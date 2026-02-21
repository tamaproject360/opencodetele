/**
 * Event wiring — registers all SSE event callbacks on `SummaryAggregator`.
 *
 * This module is intentionally free of module-level mutable state.
 * All dependencies are passed in as parameters to keep the function testable.
 */

import { Bot, Context, InputFile } from "grammy";
import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { summaryAggregator } from "../summary/aggregator.js";
import { formatSummary, formatToolInfo } from "../summary/formatter.js";
import { subscribeToEvents } from "../opencode/events.js";
import { ingestSessionInfoForCache } from "../session/cache-manager.js";
import { getCurrentSession } from "../session/manager.js";
import { questionManager } from "../question/manager.js";
import { keyboardManager } from "../keyboard/manager.js";
import { pinnedMessageManager } from "../pinned/manager.js";
import { safeBackgroundTask } from "../utils/safe-background-task.js";
import { logger } from "../utils/logger.js";
import { t } from "../i18n/index.js";
import { config } from "../config.js";
import { showCurrentQuestion } from "./handlers/question.js";
import { showPermissionRequest } from "./handlers/permission.js";

/**
 * Wire all SSE event callbacks and start the event subscription for `directory`.
 *
 * @param bot   Active grammY Bot instance (used to send messages)
 * @param chatId Telegram chat ID to send messages to
 * @param directory OpenCode project directory to subscribe to
 */
export async function wireEvents(
  bot: Bot<Context>,
  chatId: number,
  directory: string,
): Promise<void> {
  if (!directory) {
    logger.error("No directory found for event subscription");
    return;
  }

  summaryAggregator.setOnComplete(async (sessionId, messageText) => {
    const currentSession = getCurrentSession();
    if (currentSession?.id !== sessionId) {
      return;
    }

    try {
      const parts = formatSummary(messageText);

      logger.debug(
        `[Bot] Sending completed message to Telegram (chatId=${chatId}, parts=${parts.length})`,
      );
      for (let i = 0; i < parts.length; i++) {
        const isLastPart = i === parts.length - 1;
        if (isLastPart && keyboardManager.isInitialized()) {
          const keyboard = keyboardManager.getKeyboard();
          if (keyboard) {
            await bot.api.sendMessage(chatId, parts[i], { reply_markup: keyboard });
          } else {
            await bot.api.sendMessage(chatId, parts[i]);
          }
        } else {
          await bot.api.sendMessage(chatId, parts[i]);
        }
      }
    } catch (err) {
      logger.error("Failed to send message to Telegram:", err);
      logger.error("[Bot] CRITICAL: Stopping event processing due to error");
      summaryAggregator.clear();
    }
  });

  summaryAggregator.setOnTool(async (toolInfo) => {
    if (!config.bot.showToolEvents) {
      return;
    }

    const currentSession = getCurrentSession();
    const sessionId = summaryAggregator.getCurrentSessionId();
    if (!currentSession || currentSession.id !== sessionId) {
      return;
    }

    try {
      const message = formatToolInfo(toolInfo);
      if (message) {
        await bot.api.sendMessage(chatId, message);
      }
    } catch (err) {
      logger.error("Failed to send tool notification to Telegram:", err);
    }
  });

  summaryAggregator.setOnToolFile(async (fileData) => {
    const currentSession = getCurrentSession();
    if (!currentSession) {
      return;
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tempDir = path.join(__dirname, "..", ".tmp");

    let tempFilePath: string | null = null;
    try {
      logger.debug(
        `[Bot] Sending code file: ${fileData.filename} (${fileData.buffer.length} bytes)`,
      );

      await fs.mkdir(tempDir, { recursive: true });

      tempFilePath = path.join(tempDir, fileData.filename);
      await fs.writeFile(tempFilePath, fileData.buffer);

      await bot.api.sendDocument(chatId, new InputFile(tempFilePath), {
        caption: fileData.caption,
      });
    } catch (err) {
      logger.error("Failed to send file to Telegram:", err);
    } finally {
      if (tempFilePath) {
        await fs
          .unlink(tempFilePath)
          .catch((e) => logger.warn(`[Bot] Failed to delete temp file ${fileData.filename}:`, e));
        logger.debug(`[Bot] Temporary file deleted: ${fileData.filename}`);
      }
    }
  });

  summaryAggregator.setOnQuestion(async (questions, requestID) => {
    logger.info(`[Bot] Received ${questions.length} questions from agent, requestID=${requestID}`);
    questionManager.startQuestions(questions, requestID);
    await showCurrentQuestion(bot.api, chatId);
  });

  summaryAggregator.setOnQuestionError(async () => {
    logger.info(`[Bot] Question tool failed, clearing active poll and deleting messages`);

    const messageIds = questionManager.getMessageIds();
    for (const messageId of messageIds) {
      await bot.api.deleteMessage(chatId, messageId).catch((err) => {
        logger.error(`[Bot] Failed to delete question message ${messageId}:`, err);
      });
    }

    questionManager.clear();
  });

  summaryAggregator.setOnPermission(async (request) => {
    logger.info(
      `[Bot] Received permission request from agent: type=${request.permission}, requestID=${request.id}`,
    );
    await showPermissionRequest(bot.api, chatId, request);
  });

  summaryAggregator.setOnThinking(async () => {
    if (!config.bot.showThinking) {
      return;
    }

    logger.debug("[Bot] Agent started thinking");

    await bot.api.sendMessage(chatId, t("bot.thinking")).catch((err) => {
      logger.error("[Bot] Failed to send thinking message:", err);
    });
  });

  summaryAggregator.setOnTokens(async (tokens) => {
    if (!pinnedMessageManager.isInitialized()) {
      return;
    }

    try {
      logger.debug(`[Bot] Received tokens: input=${tokens.input}, output=${tokens.output}`);

      const contextSize = tokens.input + tokens.cacheRead;
      const contextLimit = pinnedMessageManager.getContextLimit();
      if (contextLimit > 0) {
        keyboardManager.updateContext(contextSize, contextLimit);
      }

      await pinnedMessageManager.onMessageComplete(tokens);
    } catch (err) {
      logger.error("[Bot] Error updating pinned message with tokens:", err);
    }
  });

  summaryAggregator.setOnSessionCompacted(async (sessionId, dir) => {
    if (!pinnedMessageManager.isInitialized()) {
      return;
    }

    try {
      logger.info(`[Bot] Session compacted, reloading context: ${sessionId}`);
      await pinnedMessageManager.onSessionCompacted(sessionId, dir);
    } catch (err) {
      logger.error("[Bot] Error reloading context after compaction:", err);
    }
  });

  summaryAggregator.setOnSessionDiff(async (_sessionId, diffs) => {
    if (!pinnedMessageManager.isInitialized()) {
      return;
    }

    try {
      await pinnedMessageManager.onSessionDiff(diffs);
    } catch (err) {
      logger.error("[Bot] Error updating session diff:", err);
    }
  });

  summaryAggregator.setOnFileChange((change) => {
    if (!pinnedMessageManager.isInitialized()) {
      return;
    }
    pinnedMessageManager.addFileChange(change);
  });

  pinnedMessageManager.setOnKeyboardUpdate(async (tokensUsed, tokensLimit) => {
    try {
      logger.debug(`[Bot] Updating keyboard with context: ${tokensUsed}/${tokensLimit}`);
      keyboardManager.updateContext(tokensUsed, tokensLimit);
    } catch (err) {
      logger.error("[Bot] Error updating keyboard context:", err);
    }
  });

  logger.info(`[Bot] Subscribing to OpenCode events for project: ${directory}`);
  subscribeToEvents(directory, (event) => {
    if (event.type === "session.created" || event.type === "session.updated") {
      const info = (
        event.properties as { info?: { directory?: string; time?: { updated?: number } } }
      ).info;

      if (info?.directory) {
        safeBackgroundTask({
          taskName: `session.cache.${event.type}`,
          task: () => ingestSessionInfoForCache(info),
        });
      }
    }

    summaryAggregator.processEvent(event);
  }).catch((err) => {
    logger.error("Event stream permanently disconnected:", err);
    bot.api
      .sendMessage(chatId, t("bot.event_stream_disconnected"))
      .catch((sendErr) => logger.error("[Bot] Failed to send disconnect notification:", sendErr));
  });
}
