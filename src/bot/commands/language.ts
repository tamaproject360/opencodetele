import { CommandContext, Context, InlineKeyboard } from "grammy";
import { t, getLocale, setRuntimeLocale, normalizeLocale } from "../../i18n/index.js";
import { setStoredLocale } from "../../settings/manager.js";
import { logger } from "../../utils/logger.js";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Русский",
  id: "Indonesia",
};

export async function languageCommand(ctx: CommandContext<Context>): Promise<void> {
  const currentLocale = getLocale();
  const currentName = LANGUAGE_NAMES[currentLocale] || currentLocale;

  const keyboard = new InlineKeyboard();

  for (const [code, name] of Object.entries(LANGUAGE_NAMES)) {
    keyboard.text(code === currentLocale ? `✅ ${name}` : name, `lang:${code}`);
    keyboard.row();
  }

  await ctx.reply(t("language.menu.current", { name: currentName }), {
    reply_markup: keyboard,
  });
}

export async function handleLanguageSelect(ctx: Context): Promise<boolean> {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("lang:")) {
    return false;
  }

  const newLocaleCode = data.substring(5);
  const normalized = normalizeLocale(newLocaleCode);

  try {
    setStoredLocale(normalized);
    setRuntimeLocale(normalized);

    const name = LANGUAGE_NAMES[normalized] || normalized;

    await ctx.answerCallbackQuery({
      text: t("language.changed_callback", { name }),
    });

    await ctx.editMessageText(t("language.changed_message", { name }));

    // Also re-register bot commands so they appear in the new language
    const { COMMAND_DEFINITIONS } = await import("./definitions.js");
    if (ctx.chat) {
      await ctx.api
        .setMyCommands(
          COMMAND_DEFINITIONS.map(({ command, descriptionKey }) => ({
            command,
            description: t(descriptionKey, undefined, normalized),
          })),
          {
            scope: {
              type: "chat",
              chat_id: ctx.chat.id,
            },
          },
        )
        .catch((err) => {
          logger.error("[Bot] Failed to update commands on language change:", err);
        });
    }
  } catch (error) {
    logger.error("[Bot] Error changing language:", error);
    await ctx.answerCallbackQuery({
      text: "Failed to change language",
      show_alert: true,
    });
  }

  return true;
}
