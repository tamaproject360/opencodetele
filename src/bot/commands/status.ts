import { CommandContext, Context } from "grammy";
import { opencodeClient } from "../../opencode/client.js";
import { getCurrentSession } from "../../session/manager.js";
import { getCurrentProject } from "../../settings/manager.js";
import { fetchCurrentAgent } from "../../agent/manager.js";
import { getAgentDisplayName } from "../../agent/types.js";
import { fetchCurrentModel } from "../../model/manager.js";
import { formatModelForDisplay } from "../../model/types.js";
import { processManager } from "../../process/manager.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";
import type { McpStatus } from "@opencode-ai/sdk/v2";

function formatMcpEntry(name: string, status: McpStatus): string {
  switch (status.status) {
    case "connected":
      return t("status.mcp.item_connected", { name });
    case "disabled":
      return t("status.mcp.item_disabled", { name });
    case "needs_auth":
    case "needs_client_registration":
      return t("status.mcp.item_needs_auth", { name });
    case "failed":
      return t("status.mcp.item_failed", { name, error: status.error });
    default:
      return t("status.mcp.item_connected", { name });
  }
}

export async function statusCommand(ctx: CommandContext<Context>) {
  try {
    const { data, error } = await opencodeClient.global.health();

    if (error || !data) {
      throw error || new Error("No data received from server");
    }

    let message = `${t("status.header_running")}\n\n`;
    const healthLabel = data.healthy ? t("status.health.healthy") : t("status.health.unhealthy");
    message += `${t("status.line.health", { health: healthLabel })}\n`;
    if (data.version) {
      message += `${t("status.line.version", { version: data.version })}\n`;
    }

    // Add process management information
    if (processManager.isRunning()) {
      const uptime = processManager.getUptime();
      const uptimeStr = uptime ? Math.floor(uptime / 1000) : 0;
      message += `${t("status.line.managed_yes")}\n`;
      message += `${t("status.line.pid", { pid: processManager.getPID() ?? "-" })}\n`;
      message += `${t("status.line.uptime_sec", { seconds: uptimeStr })}\n`;
    } else {
      message += `${t("status.line.managed_no")}\n`;
    }

    // Add agent mode information
    const currentAgent = await fetchCurrentAgent();
    const agentDisplay = currentAgent
      ? getAgentDisplayName(currentAgent)
      : t("status.agent_not_set");
    message += `${t("status.line.mode", { mode: agentDisplay })}\n`;

    // Add model information
    const currentModel = fetchCurrentModel();
    const modelDisplay = formatModelForDisplay(currentModel.providerID, currentModel.modelID);
    message += `${t("status.line.model", { model: modelDisplay })}\n`;

    // Add MCP servers status
    try {
      const mcpResult = await opencodeClient.mcp.status();
      if (mcpResult.data) {
        const mcpEntries = Object.entries(mcpResult.data);
        if (mcpEntries.length > 0) {
          message += `\n${t("status.mcp.section", { count: mcpEntries.length })}\n`;
          for (const [name, status] of mcpEntries) {
            message += `${formatMcpEntry(name, status)}\n`;
          }
        } else {
          message += `\n${t("status.mcp.none")}\n`;
        }
      }
    } catch (mcpErr) {
      logger.debug("[Bot] MCP status not available:", mcpErr);
    }

    // Add formatters status
    try {
      const fmtResult = await opencodeClient.formatter.status();
      if (fmtResult.data) {
        const enabledFormatters = fmtResult.data.filter((f) => f.enabled);
        if (enabledFormatters.length > 0) {
          message += `\n${t("status.formatters.section", { count: enabledFormatters.length })}\n`;
          for (const fmt of enabledFormatters) {
            const exts = fmt.extensions.join(", ");
            message += `${t("status.formatters.item", { name: fmt.name, extensions: exts })}\n`;
          }
        } else {
          message += `\n${t("status.formatters.none")}\n`;
        }
      }
    } catch (fmtErr) {
      logger.debug("[Bot] Formatter status not available:", fmtErr);
    }

    const currentProject = getCurrentProject();
    if (currentProject) {
      const projectName = currentProject.name || currentProject.worktree;
      message += `\n${t("status.project_selected", { project: projectName })}\n`;

      // Add VCS branch info for current project
      try {
        const vcsResult = await opencodeClient.vcs.get({
          directory: currentProject.worktree,
        });
        if (vcsResult.data?.branch) {
          message += `${t("status.vcs.branch", { branch: vcsResult.data.branch })}\n`;
        }
      } catch (vcsErr) {
        logger.debug("[Bot] VCS info not available:", vcsErr);
      }

      // Add worktree list
      try {
        const worktreeResult = await opencodeClient.worktree.list({
          directory: currentProject.worktree,
        });
        if (worktreeResult.data && worktreeResult.data.length > 0) {
          message += `\n${t("status.worktrees.section", { count: String(worktreeResult.data.length) })}\n`;
          for (const wtDir of worktreeResult.data) {
            message += `  🌿 \`${wtDir}\`\n`;
          }
        } else if (worktreeResult.data !== undefined) {
          message += `\n${t("status.worktrees.none")}\n`;
        }
      } catch (wtErr) {
        logger.debug("[Bot] Worktree list not available:", wtErr);
      }
    } else {
      message += `\n${t("status.project_not_selected")}\n`;
      message += t("status.project_hint");
    }

    const currentSession = getCurrentSession();
    if (currentSession) {
      message += `\n${t("status.session_selected", { title: currentSession.title })}\n`;
    } else {
      message += `\n${t("status.session_not_selected")}\n`;
      message += t("status.session_hint");
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    logger.error("[Bot] Error checking server status:", error);
    await ctx.reply(t("status.server_unavailable"));
  }
}
