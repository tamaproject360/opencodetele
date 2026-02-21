import dotenv from "dotenv";
import { getRuntimePaths } from "./runtime/paths.js";
import { normalizeLocale, SUPPORTED_LOCALES, type Locale } from "./i18n/index.js";

const runtimePaths = getRuntimePaths();
dotenv.config({ path: runtimePaths.envFilePath });

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(
      `Missing required environment variable: ${key} (expected in ${runtimePaths.envFilePath})`,
    );
  }
  return value || "";
}

function getOptionalPositiveIntEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key, false);

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return defaultValue;
  }

  return parsedValue;
}

function getOptionalLocaleEnvVar(key: string, defaultValue: Locale): Locale {
  const value = getEnvVar(key, false);

  if (!value) {
    return defaultValue;
  }

  const normalized = normalizeLocale(value);
  // normalizeLocale falls back to "en" for unknown locales;
  // if the raw value wasn't empty but normalizes to "en" when default isn't "en",
  // we still respect the normalised result (valid English locale inputs map to "en").
  return normalized;
}

// Re-export for callers that need to enumerate supported locales
export { SUPPORTED_LOCALES };

export const config = {
  telegram: {
    token: getEnvVar("TELEGRAM_BOT_TOKEN"),
    allowedUserId: parseInt(getEnvVar("TELEGRAM_ALLOWED_USER_ID"), 10),
    proxyUrl: getEnvVar("TELEGRAM_PROXY_URL", false),
  },
  opencode: {
    apiUrl: getEnvVar("OPENCODE_API_URL", false) || "http://localhost:4096",
    username: getEnvVar("OPENCODE_SERVER_USERNAME", false) || "opencode",
    password: getEnvVar("OPENCODE_SERVER_PASSWORD", false),
    model: {
      provider: getEnvVar("OPENCODE_MODEL_PROVIDER", true), // Required
      modelId: getEnvVar("OPENCODE_MODEL_ID", true), // Required
    },
  },
  server: {
    logLevel: getEnvVar("LOG_LEVEL", false) || "info",
    logFormat: getEnvVar("LOG_FORMAT", false) || "text",
  },
  bot: {
    sessionsListLimit: getOptionalPositiveIntEnvVar("SESSIONS_LIST_LIMIT", 10),
    locale: getOptionalLocaleEnvVar("BOT_LOCALE", "en"),
    showThinking: getEnvVar("SHOW_THINKING", false).toLowerCase() !== "false",
    showToolEvents: getEnvVar("SHOW_TOOL_EVENTS", false).toLowerCase() !== "false",
  },
  files: {
    maxFileSizeKb: parseInt(getEnvVar("CODE_FILE_MAX_SIZE_KB", false) || "100", 10),
  },
};
