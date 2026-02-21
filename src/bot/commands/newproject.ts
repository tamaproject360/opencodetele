import { CommandContext, Context } from "grammy";
import { opencodeClient } from "../../opencode/client.js";
import { setCurrentProject } from "../../settings/manager.js";
import { clearSession } from "../../session/manager.js";
import { summaryAggregator } from "../../summary/aggregator.js";
import { pinnedMessageManager } from "../../pinned/manager.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";

export async function newprojectCommand(ctx: CommandContext<Context>): Promise<void> {
  const rawPath = ctx.match?.trim();

  if (!rawPath) {
    await ctx.reply(t("newproject.usage"));
    return;
  }

  // Normalize path: replace backslashes with forward slashes for consistency
  const directory = rawPath.replace(/\\/g, "/");

  try {
    await ctx.reply(t("newproject.checking", { path: directory }));

    // project.current with a directory will return (or implicitly register)
    // the project for that directory in OpenCode.
    const { data: project, error } = await opencodeClient.project.current({
      directory,
    });

    if (error || !project) {
      logger.error("[Bot] /newproject: failed to get/create project for path:", error);
      await ctx.reply(t("newproject.error", { path: directory }));
      return;
    }

    logger.info(
      `[Bot] /newproject: resolved project id=${project.id}, worktree=${project.worktree}`,
    );

    // Set this as the current project and reset session state
    setCurrentProject(project);
    clearSession();
    summaryAggregator.clear();

    // Clear pinned message when switching projects
    try {
      await pinnedMessageManager.clear();
    } catch (err) {
      logger.warn("[Bot] /newproject: failed to clear pinned message:", err);
    }

    const projectName = project.name || project.worktree;
    await ctx.reply(t("newproject.success", { project: projectName }));
  } catch (err) {
    logger.error("[Bot] /newproject: unexpected error:", err);
    await ctx.reply(t("newproject.error", { path: directory }));
  }
}
