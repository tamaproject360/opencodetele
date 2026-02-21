import { config } from "../config.js";

/**
 * Available log levels in order of severity
 * Lower numbers indicate lower severity (more verbose)
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Mapping of log levels to numeric values for comparison
 * Used to determine if a message should be logged based on configured level
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Normalizes a string value to a valid LogLevel
 * Falls back to 'info' if the value is invalid
 */
function normalizeLogLevel(value: string): LogLevel {
  if (value in LOG_LEVELS) {
    return value as LogLevel;
  }

  return "info";
}

/**
 * Formats the log message prefix with timestamp and level
 */
function formatPrefix(level: LogLevel): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
}

/**
 * Formats individual arguments for text logging.
 * Special handling for Error objects to extract stack trace.
 */
function formatArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`;
  }

  return arg;
}

/**
 * Serializes an argument to a JSON-friendly value.
 * Errors are converted to plain objects with name, message, and stack.
 */
function serializeArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  return arg;
}

/**
 * Outputs a structured JSON log entry to stdout/stderr.
 */
function logJson(level: LogLevel, args: unknown[]): void {
  const [first, ...rest] = args;
  const message = typeof first === "string" ? first : undefined;
  const extra = message !== undefined ? rest : args;
  const serialized = extra.map(serializeArg);

  const entry: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    message: message ?? "",
  };

  if (serialized.length === 1) {
    entry["data"] = serialized[0];
  } else if (serialized.length > 1) {
    entry["data"] = serialized;
  }

  const line = JSON.stringify(entry);

  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

/**
 * Prepends formatted prefix to log arguments
 */
function withPrefix(level: LogLevel, args: unknown[]): unknown[] {
  const formattedArgs = args.map((arg) => formatArg(arg));
  const prefix = formatPrefix(level);

  if (formattedArgs.length === 0) {
    return [prefix];
  }

  if (typeof formattedArgs[0] === "string") {
    return [`${prefix} ${formattedArgs[0]}`, ...formattedArgs.slice(1)];
  }

  return [prefix, ...formattedArgs];
}

/**
 * Determines if a message should be logged based on configured log level
 */
function shouldLog(level: LogLevel): boolean {
  const configLevel = normalizeLogLevel(config.server.logLevel);
  return LOG_LEVELS[level] >= LOG_LEVELS[configLevel];
}

function isJsonFormat(): boolean {
  return config.server.logFormat === "json";
}

/**
 * Logger interface with methods for different log levels.
 * Each method checks if the message should be logged based on configured level
 * and formats the output with timestamp and level prefix.
 *
 * Set LOG_FORMAT=json for structured JSON output (useful with log aggregators
 * like Loki, Datadog, Fluentd, etc.).
 */
export const logger = {
  /**
   * Logs debug-level messages (most verbose)
   * Used for detailed diagnostics and internal operations
   */
  debug: (...args: unknown[]): void => {
    if (shouldLog("debug")) {
      if (isJsonFormat()) {
        logJson("debug", args);
      } else {
        console.log(...withPrefix("debug", args));
      }
    }
  },

  /**
   * Logs info-level messages
   * Used for important events and general information
   */
  info: (...args: unknown[]): void => {
    if (shouldLog("info")) {
      if (isJsonFormat()) {
        logJson("info", args);
      } else {
        console.log(...withPrefix("info", args));
      }
    }
  },

  /**
   * Logs warning-level messages
   * Used for recoverable errors and potential issues
   */
  warn: (...args: unknown[]): void => {
    if (shouldLog("warn")) {
      if (isJsonFormat()) {
        logJson("warn", args);
      } else {
        console.warn(...withPrefix("warn", args));
      }
    }
  },

  /**
   * Logs error-level messages
   * Used for critical failures and exceptions
   */
  error: (...args: unknown[]): void => {
    if (shouldLog("error")) {
      if (isJsonFormat()) {
        logJson("error", args);
      } else {
        console.error(...withPrefix("error", args));
      }
    }
  },
};
