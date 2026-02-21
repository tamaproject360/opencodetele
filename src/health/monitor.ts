/**
 * Health monitor — periodically pings the OpenCode server and sends a
 * Telegram alert when the server becomes unreachable.
 *
 * Behaviour:
 * - Pings every `intervalMs` (default 30 s).
 * - After `maxFailures` consecutive failures (default 3) the user is notified.
 * - Notifies once per outage; re-notifies only after the server recovers and
 *   then goes down again.
 * - When the server recovers the user receives a recovery notification.
 */

import { Api } from "grammy";
import { opencodeClient } from "../opencode/client.js";
import { logger } from "../utils/logger.js";
import { t } from "../i18n/index.js";

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_MAX_FAILURES = 3;

interface HealthMonitorOptions {
  intervalMs?: number;
  maxFailures?: number;
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
let alertSent = false;
let monitorApi: Api | null = null;
let monitorChatId: number | null = null;

async function runCheck(): Promise<void> {
  try {
    const { error } = await opencodeClient.global.health();
    if (error) {
      throw error;
    }

    // Server is healthy
    if (alertSent) {
      // It was down before — send recovery message
      logger.info("[HealthMonitor] Server recovered, sending recovery notification");
      monitorApi
        ?.sendMessage(monitorChatId!, t("health.server_recovered"))
        .catch((e) => logger.error("[HealthMonitor] Failed to send recovery message:", e));
      alertSent = false;
    }
    consecutiveFailures = 0;
  } catch {
    consecutiveFailures++;
    logger.warn(`[HealthMonitor] Health check failed (consecutive=${consecutiveFailures})`);

    const maxFailures =
      parseInt(process.env["HEALTH_CHECK_MAX_FAILURES"] ?? "", 10) || DEFAULT_MAX_FAILURES;

    if (consecutiveFailures >= maxFailures && !alertSent) {
      alertSent = true;
      logger.error("[HealthMonitor] Server unreachable, sending Telegram alert");
      monitorApi
        ?.sendMessage(monitorChatId!, t("health.server_unreachable"))
        .catch((e) => logger.error("[HealthMonitor] Failed to send alert:", e));
    }
  }
}

export function startHealthMonitor(
  api: Api,
  chatId: number,
  options: HealthMonitorOptions = {},
): void {
  if (intervalHandle) {
    return; // Already running
  }

  const intervalMs =
    (options.intervalMs ?? parseInt(process.env["HEALTH_CHECK_INTERVAL_MS"] ?? "", 10)) ||
    DEFAULT_INTERVAL_MS;
  const maxFailuresFromEnv =
    (options.maxFailures ?? parseInt(process.env["HEALTH_CHECK_MAX_FAILURES"] ?? "", 10)) ||
    DEFAULT_MAX_FAILURES;

  monitorApi = api;
  monitorChatId = chatId;
  consecutiveFailures = 0;
  alertSent = false;

  logger.info(
    `[HealthMonitor] Starting health monitor (interval=${intervalMs}ms, maxFailures=${maxFailuresFromEnv})`,
  );
  intervalHandle = setInterval(() => {
    runCheck().catch((e) => logger.error("[HealthMonitor] Unexpected error in health check:", e));
  }, intervalMs);
}

export function stopHealthMonitor(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    monitorApi = null;
    monitorChatId = null;
    consecutiveFailures = 0;
    alertSent = false;
    logger.info("[HealthMonitor] Health monitor stopped");
  }
}

/** Exposed for tests only */
export function __resetHealthMonitorForTests(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  monitorApi = null;
  monitorChatId = null;
  consecutiveFailures = 0;
  alertSent = false;
}
