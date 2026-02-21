import { Bot, Context, NextFunction } from "grammy";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "../config.js";
import { authMiddleware } from "./middleware/auth.js";
import { BOT_COMMANDS } from "./commands/definitions.js";
import { startCommand } from "./commands/start.js";
import { helpCommand } from "./commands/help.js";
import { statusCommand } from "./commands/status.js";
import { MODEL_BUTTON_TEXT_PATTERN, VARIANT_BUTTON_TEXT_PATTERN } from "./message-patterns.js";
import { sessionsCommand, handleSessionSelect } from "./commands/sessions.js";
import { newCommand } from "./commands/new.js";
import { projectsCommand, handleProjectSelect } from "./commands/projects.js";
import { stopCommand } from "./commands/stop.js";
import { opencodeStartCommand } from "./commands/opencode-start.js";
import { opencodeStopCommand } from "./commands/opencode-stop.js";
import { handleAgentCommand } from "./commands/agent.js";
import { handleModelCommand } from "./commands/model.js";
import { renameCommand, handleRenameCancel, handleRenameTextAnswer } from "./commands/rename.js";
import { newprojectCommand } from "./commands/newproject.js";
import { lsCommand, treeCommand } from "./commands/ls.js";
import { languageCommand, handleLanguageSelect } from "./commands/language.js";
import { handleQuestionCallback, handleQuestionTextAnswer } from "./handlers/question.js";
import { handlePermissionCallback } from "./handlers/permission.js";
import { handleAgentSelect, showAgentSelectionMenu } from "./handlers/agent.js";
import { handleModelSelect, showModelSelectionMenu } from "./handlers/model.js";
import { handleVariantSelect, showVariantSelectionMenu } from "./handlers/variant.js";
import {
  handleContextButtonPress,
  handleCompactConfirm,
  handleCompactCancel,
} from "./handlers/context.js";
import { questionManager } from "../question/manager.js";
import { permissionManager } from "../permission/manager.js";
import { keyboardManager } from "../keyboard/manager.js";
import { stopEventListening } from "../opencode/events.js";
import { summaryAggregator } from "../summary/aggregator.js";
import { opencodeClient } from "../opencode/client.js";
import { clearSession, getCurrentSession, setCurrentSession } from "../session/manager.js";
import { ingestSessionInfoForCache } from "../session/cache-manager.js";
import { getCurrentProject } from "../settings/manager.js";
import { getStoredAgent } from "../agent/manager.js";
import { getStoredModel } from "../model/manager.js";
import { formatVariantForButton } from "../variant/manager.js";
import { createMainKeyboard } from "./utils/keyboard.js";
import { logger } from "../utils/logger.js";
import { safeBackgroundTask } from "../utils/safe-background-task.js";
import { formatErrorDetails } from "../utils/error-format.js";
import { pinnedMessageManager } from "../pinned/manager.js";
import { t } from "../i18n/index.js";
import { wireEvents } from "./event-wiring.js";
import { startHealthMonitor } from "../health/monitor.js";
import {
  handleDocumentUpload,
  handlePhotoUpload,
  consumePendingAttachments,
  buildAttachmentContext,
  cleanupAttachments,
} from "./handlers/file-upload.js";

let botInstance: Bot<Context> | null = null;
let chatIdInstance: number | null = null;
let commandsInitialized = false;

async function ensureCommandsInitialized(ctx: Context, next: NextFunction): Promise<void> {
  if (commandsInitialized || !ctx.from || ctx.from.id !== config.telegram.allowedUserId) {
    await next();
    return;
  }

  if (!ctx.chat) {
    logger.warn("[Bot] Cannot initialize commands: chat context is missing");
    await next();
    return;
  }

  try {
    await ctx.api.setMyCommands(BOT_COMMANDS, {
      scope: {
        type: "chat",
        chat_id: ctx.chat.id,
      },
    });

    commandsInitialized = true;
    logger.info(`[Bot] Commands initialized for authorized user (chat_id=${ctx.chat.id})`);

    // Start health monitor now that we have a chatId to send alerts to
    startHealthMonitor(ctx.api, ctx.chat.id);
  } catch (err) {
    logger.error("[Bot] Failed to set commands:", err);
  }

  await next();
}

async function ensureEventSubscription(directory: string): Promise<void> {
  if (!botInstance || !chatIdInstance) {
    logger.error("[Bot] Cannot wire events: bot or chatId not set");
    return;
  }
  await wireEvents(botInstance, chatIdInstance, directory);
}

async function isSessionBusy(sessionId: string, directory: string): Promise<boolean> {
  try {
    const { data, error } = await opencodeClient.session.status({ directory });

    if (error || !data) {
      logger.warn("[Bot] Failed to check session status before prompt:", error);
      return false;
    }

    const sessionStatus = (data as Record<string, { type?: string }>)[sessionId];
    if (!sessionStatus) {
      return false;
    }

    logger.debug(`[Bot] Current session status before prompt: ${sessionStatus.type || "unknown"}`);
    return sessionStatus.type === "busy";
  } catch (err) {
    logger.warn("[Bot] Error checking session status before prompt:", err);
    return false;
  }
}

async function resetMismatchedSessionContext(): Promise<void> {
  stopEventListening();
  summaryAggregator.clear();
  questionManager.clear();
  permissionManager.clear();
  clearSession();
  keyboardManager.clearContext();

  if (!pinnedMessageManager.isInitialized()) {
    return;
  }

  try {
    await pinnedMessageManager.clear();
  } catch (err) {
    logger.error("[Bot] Failed to clear pinned message during session reset:", err);
  }
}

export function createBot(): Bot<Context> {
  const botOptions: ConstructorParameters<typeof Bot<Context>>[1] = {};

  if (config.telegram.proxyUrl) {
    const proxyUrl = config.telegram.proxyUrl;
    let agent;

    if (proxyUrl.startsWith("socks")) {
      agent = new SocksProxyAgent(proxyUrl);
      logger.info(`[Bot] Using SOCKS proxy: ${proxyUrl.replace(/\/\/.*@/, "//***@")}`);
    } else {
      agent = new HttpsProxyAgent(proxyUrl);
      logger.info(`[Bot] Using HTTP/HTTPS proxy: ${proxyUrl.replace(/\/\/.*@/, "//***@")}`);
    }

    botOptions.client = {
      baseFetchConfig: {
        agent,
        compress: true,
      },
    };
  }

  const bot = new Bot(config.telegram.token, botOptions);

  // Heartbeat for diagnostics: verify the event loop is not blocked
  let heartbeatCounter = 0;
  const heartbeatInterval = setInterval(() => {
    heartbeatCounter++;
    if (heartbeatCounter % 6 === 0) {
      // Log every 30 seconds (5 sec * 6)
      logger.debug(`[Bot] Heartbeat #${heartbeatCounter} - event loop alive`);
    }
  }, 5000);

  bot.catch((err) => {
    logger.error("[Bot] Unhandled error in bot:", err);
    if (err.ctx) {
      logger.error(
        "[Bot] Error context - update type:",
        err.ctx.update ? Object.keys(err.ctx.update) : "unknown",
      );
    }
    clearInterval(heartbeatInterval);
  });

  // Log all API calls for diagnostics
  let lastGetUpdatesTime = Date.now();
  bot.api.config.use(async (prev, method, payload, signal) => {
    if (method === "getUpdates") {
      const now = Date.now();
      const timeSinceLast = now - lastGetUpdatesTime;
      logger.debug(`[Bot API] getUpdates called (${timeSinceLast}ms since last)`);
      lastGetUpdatesTime = now;
    } else if (method === "sendMessage") {
      logger.debug(`[Bot API] sendMessage to chat ${(payload as { chat_id?: number }).chat_id}`);
    }
    return prev(method, payload, signal);
  });

  bot.use((ctx, next) => {
    const hasCallbackQuery = !!ctx.callbackQuery;
    const hasMessage = !!ctx.message;
    const callbackData = ctx.callbackQuery?.data || "N/A";
    logger.debug(
      `[DEBUG] Incoming update: hasCallbackQuery=${hasCallbackQuery}, hasMessage=${hasMessage}, callbackData=${callbackData}`,
    );
    return next();
  });

  bot.use(authMiddleware);
  bot.use(ensureCommandsInitialized);

  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("status", statusCommand);
  bot.command("opencode_start", opencodeStartCommand);
  bot.command("opencode_stop", opencodeStopCommand);
  bot.command("projects", projectsCommand);
  bot.command("sessions", sessionsCommand);
  bot.command("new", newCommand);
  bot.command("agent", handleAgentCommand);
  bot.command("model", handleModelCommand);
  bot.command("stop", stopCommand);
  bot.command("rename", renameCommand);
  bot.command("newproject", newprojectCommand);
  bot.command("ls", lsCommand);
  bot.command("tree", treeCommand);
  bot.command("language", languageCommand);

  bot.on("callback_query:data", async (ctx) => {
    logger.debug(`[Bot] Received callback_query:data: ${ctx.callbackQuery?.data}`);
    logger.debug(`[Bot] Callback context: from=${ctx.from?.id}, chat=${ctx.chat?.id}`);

    try {
      const handledSession = await handleSessionSelect(ctx);
      const handledProject = await handleProjectSelect(ctx);
      const handledQuestion = await handleQuestionCallback(ctx);
      const handledPermission = await handlePermissionCallback(ctx);
      const handledAgent = await handleAgentSelect(ctx);
      const handledModel = await handleModelSelect(ctx);
      const handledVariant = await handleVariantSelect(ctx);
      const handledLanguage = await handleLanguageSelect(ctx);
      const handledCompactConfirm = await handleCompactConfirm(ctx);
      const handledCompactCancel = await handleCompactCancel(ctx);
      const handledRenameCancel = await handleRenameCancel(ctx);

      logger.debug(
        `[Bot] Callback handled: session=${handledSession}, project=${handledProject}, question=${handledQuestion}, permission=${handledPermission}, agent=${handledAgent}, model=${handledModel}, variant=${handledVariant}, language=${handledLanguage}, compact=${handledCompactConfirm || handledCompactCancel}, rename=${handledRenameCancel}`,
      );

      if (
        !handledSession &&
        !handledProject &&
        !handledQuestion &&
        !handledPermission &&
        !handledAgent &&
        !handledModel &&
        !handledVariant &&
        !handledLanguage &&
        !handledCompactConfirm &&
        !handledCompactCancel &&
        !handledRenameCancel
      ) {
        logger.debug("Unknown callback query:", ctx.callbackQuery?.data);
        await ctx.answerCallbackQuery({ text: t("callback.unknown_command") });
      }
    } catch (err) {
      logger.error("[Bot] Error handling callback:", err);
      await ctx.answerCallbackQuery({ text: t("callback.processing_error") }).catch(() => {});
    }
  });

  // Handle Reply Keyboard button press (agent mode indicator)
  bot.hears(/^(📋|🛠️|💬|🔍|📝|📄|📦|🤖) \w+ Mode$/, async (ctx) => {
    logger.debug(`[Bot] Agent mode button pressed: ${ctx.message?.text}`);

    try {
      await showAgentSelectionMenu(ctx);
    } catch (err) {
      logger.error("[Bot] Error showing agent menu:", err);
      await ctx.reply(t("error.load_agents"));
    }
  });

  // Handle Reply Keyboard button press (model selector)
  // Model button text is produced by formatModelForButton() and always starts with "🤖 ".
  bot.hears(MODEL_BUTTON_TEXT_PATTERN, async (ctx) => {
    logger.debug(`[Bot] Model button pressed: ${ctx.message?.text}`);

    try {
      await showModelSelectionMenu(ctx);
    } catch (err) {
      logger.error("[Bot] Error showing model menu:", err);
      await ctx.reply(t("error.load_models"));
    }
  });

  // Handle Reply Keyboard button press (context button)
  bot.hears(/^📊(?:\s|$)/, async (ctx) => {
    logger.debug(`[Bot] Context button pressed: ${ctx.message?.text}`);

    try {
      await handleContextButtonPress(ctx);
    } catch (err) {
      logger.error("[Bot] Error handling context button:", err);
      await ctx.reply(t("error.context_button"));
    }
  });

  // Handle Reply Keyboard button press (variant selector)
  // Keep support for both legacy "💭" and current "💡" prefix.
  bot.hears(VARIANT_BUTTON_TEXT_PATTERN, async (ctx) => {
    logger.debug(`[Bot] Variant button pressed: ${ctx.message?.text}`);

    try {
      await showVariantSelectionMenu(ctx);
    } catch (err) {
      logger.error("[Bot] Error showing variant menu:", err);
      await ctx.reply(t("error.load_variants"));
    }
  });

  bot.on("message:text", async (ctx, next) => {
    const text = ctx.message?.text;
    if (text) {
      const isCommand = text.startsWith("/");
      logger.debug(
        `[Bot] Received text message: ${isCommand ? `command="${text}"` : `prompt (length=${text.length})`}, chatId=${ctx.chat.id}`,
      );
    }
    await next();
  });

  // File and photo upload handlers
  bot.on("message:document", async (ctx) => {
    await handleDocumentUpload(ctx);
  });

  bot.on("message:photo", async (ctx) => {
    await handlePhotoUpload(ctx);
  });

  // Remove any previously set global commands to prevent unauthorized users from seeing them
  safeBackgroundTask({
    taskName: "bot.clearGlobalCommands",
    task: async () => {
      try {
        await Promise.all([
          bot.api.setMyCommands([], { scope: { type: "default" } }),
          bot.api.setMyCommands([], { scope: { type: "all_private_chats" } }),
        ]);
        return { success: true as const };
      } catch (error) {
        return { success: false as const, error };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        logger.info("[Bot] Cleared global commands (default and all_private_chats scopes)");
        return;
      }

      logger.warn("[Bot] Could not clear global commands:", result.error);
    },
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message?.text;
    if (!text) {
      return;
    }

    if (text.startsWith("/")) {
      return;
    }

    if (questionManager.isActive()) {
      await handleQuestionTextAnswer(ctx);
      return;
    }

    const handledRename = await handleRenameTextAnswer(ctx);
    if (handledRename) {
      return;
    }

    const currentProject = getCurrentProject();
    if (!currentProject) {
      await ctx.reply(t("bot.project_not_selected"));
      return;
    }

    botInstance = bot;
    chatIdInstance = ctx.chat.id;

    // Initialize pinned message manager if not already
    if (!pinnedMessageManager.isInitialized()) {
      pinnedMessageManager.initialize(bot.api, ctx.chat.id);
    }

    // Initialize keyboard manager if not already
    keyboardManager.initialize(bot.api, ctx.chat.id);

    let currentSession = getCurrentSession();

    if (currentSession && currentSession.directory !== currentProject.worktree) {
      logger.warn(
        `[Bot] Session/project mismatch detected. sessionDirectory=${currentSession.directory}, projectDirectory=${currentProject.worktree}. Resetting session context.`,
      );
      await resetMismatchedSessionContext();
      await ctx.reply(t("bot.session_reset_project_mismatch"));
      return;
    }

    if (!currentSession) {
      await ctx.reply(t("bot.creating_session"));

      const { data: session, error } = await opencodeClient.session.create({
        directory: currentProject.worktree,
      });

      if (error || !session) {
        await ctx.reply(t("bot.create_session_error"));
        return;
      }

      logger.info(
        `[Bot] Created new session: id=${session.id}, title="${session.title}", project=${currentProject.worktree}`,
      );

      currentSession = {
        id: session.id,
        title: session.title,
        directory: currentProject.worktree,
      };

      setCurrentSession(currentSession);
      await ingestSessionInfoForCache(session);

      // Create pinned message for new session
      try {
        await pinnedMessageManager.onSessionChange(session.id, session.title);
      } catch (err) {
        logger.error("[Bot] Error creating pinned message for new session:", err);
      }

      const currentAgent = getStoredAgent();
      const currentModel = getStoredModel();
      const contextInfo = pinnedMessageManager.getContextInfo();
      const variantName = formatVariantForButton(currentModel.variant || "default");
      const keyboard = createMainKeyboard(
        currentAgent,
        currentModel,
        contextInfo ?? undefined,
        variantName,
      );

      await ctx.reply(t("bot.session_created", { title: session.title }), {
        reply_markup: keyboard,
      });
    } else {
      logger.info(
        `[Bot] Using existing session: id=${currentSession.id}, title="${currentSession.title}"`,
      );

      // Ensure pinned message exists for existing session
      if (!pinnedMessageManager.getState().messageId) {
        try {
          await pinnedMessageManager.onSessionChange(currentSession.id, currentSession.title);
        } catch (err) {
          logger.error("[Bot] Error creating pinned message for existing session:", err);
        }
      }
    }

    await ensureEventSubscription(currentSession.directory);

    summaryAggregator.setSession(currentSession.id);
    summaryAggregator.setBotAndChatId(bot, ctx.chat.id);

    const sessionIsBusy = await isSessionBusy(currentSession.id, currentSession.directory);
    if (sessionIsBusy) {
      logger.info(`[Bot] Ignoring new prompt: session ${currentSession.id} is busy`);
      await ctx.reply(t("bot.session_busy"));
      return;
    }

    try {
      const currentAgent = getStoredAgent();
      const storedModel = getStoredModel();

      const promptOptions: {
        sessionID: string;
        directory: string;
        parts: Array<{ type: "text"; text: string }>;
        model?: { providerID: string; modelID: string };
        agent?: string;
        variant?: string;
      } = {
        sessionID: currentSession.id,
        directory: currentSession.directory,
        parts: [{ type: "text", text }],
        agent: currentAgent,
      };

      // Prepend any queued file attachments as context in the prompt text
      const attachments = consumePendingAttachments();
      if (attachments.length > 0) {
        const context = buildAttachmentContext(attachments);
        promptOptions.parts = [{ type: "text", text: context + text }];
        // Clean up temp files after prompt is built
        cleanupAttachments(attachments).catch((e) =>
          logger.warn("[Bot] Failed to clean up attachment files:", e),
        );
      }

      // Use stored model (from settings or config)
      if (storedModel.providerID && storedModel.modelID) {
        promptOptions.model = {
          providerID: storedModel.providerID,
          modelID: storedModel.modelID,
        };

        // Add variant if specified
        if (storedModel.variant) {
          promptOptions.variant = storedModel.variant;
        }
      }

      logger.info(`[Bot] Calling session.prompt (fire-and-forget) with agent=${currentAgent}...`);

      // CRITICAL: DO NOT wait for session.prompt to complete.
      // If we wait, the handler will not finish and grammY will not call getUpdates,
      // which blocks receiving button callback_query updates.
      // The processing result will arrive via SSE events.
      safeBackgroundTask({
        taskName: "session.prompt",
        task: () => opencodeClient.session.prompt(promptOptions),
        onSuccess: ({ error }) => {
          if (error) {
            const details = formatErrorDetails(error);
            logger.error("OpenCode API error:", error);
            // Send the error via API directly because ctx is no longer available
            void bot.api
              .sendMessage(
                ctx.chat.id,
                t("bot.prompt_send_error_detailed", {
                  details,
                }),
              )
              .catch(() => {});
            return;
          }

          logger.info("[Bot] session.prompt completed");
        },
        onError: (error) => {
          logger.error("[Bot] session.prompt background task failed:", error);
          void bot.api.sendMessage(ctx.chat.id, t("bot.prompt_send_error")).catch(() => {});
        },
      });
    } catch (err) {
      logger.error("Error in prompt handler:", err);
      await ctx.reply(t("error.generic"));
    }

    logger.debug("[Bot] message:text handler completed (prompt sent in background)");
  });

  return bot;
}
