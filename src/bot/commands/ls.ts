import { CommandContext, Context } from "grammy";
import { opencodeClient } from "../../opencode/client.js";
import { getCurrentProject } from "../../settings/manager.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";
import path from "node:path";

const MAX_LS_ITEMS = 50;
const MAX_MESSAGE_LENGTH = 4000;

export async function lsCommand(ctx: CommandContext<Context>): Promise<void> {
  const currentProject = getCurrentProject();
  if (!currentProject) {
    await ctx.reply(t("ls.project_not_selected"));
    return;
  }

  const directory = currentProject.worktree;
  const inputPath = ctx.match?.trim() || ".";
  const subPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(directory, inputPath);

  try {
    const { data: files, error } = await opencodeClient.file.list({
      directory,
      path: subPath,
    });

    if (error) {
      logger.error("[Bot] /ls: API error:", error);
      await ctx.reply(t("ls.not_found", { path: subPath }));
      return;
    }

    if (!files || files.length === 0) {
      await ctx.reply(t("ls.empty", { path: subPath }));
      return;
    }

    const displayItems = files.slice(0, MAX_LS_ITEMS);
    const remaining = files.length - displayItems.length;

    // Sort: directories first, then files; alphabetical within each group
    displayItems.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const lines: string[] = [];
    for (const item of displayItems) {
      const ignored = item.ignored ? t("ls.item_ignored") : "";
      if (item.type === "directory") {
        lines.push(t("ls.item_dir", { name: item.name }) + ignored);
      } else {
        lines.push(t("ls.item_file", { name: item.name }) + ignored);
      }
    }

    if (remaining > 0) {
      lines.push(t("ls.more", { count: String(remaining) }));
    }

    const header = t("ls.header", { path: subPath });
    let message = header + lines.join("\n");

    // Truncate if too long
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.slice(0, MAX_MESSAGE_LENGTH) + "\n_...(truncated)_";
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (err) {
    logger.error("[Bot] /ls: unexpected error:", err);
    await ctx.reply(t("ls.error"));
  }
}

// Tree-style formatting: show recursive directory structure
const MAX_TREE_DEPTH = 3;
const MAX_TREE_ITEMS = 100;

export async function treeCommand(ctx: CommandContext<Context>): Promise<void> {
  const currentProject = getCurrentProject();
  if (!currentProject) {
    await ctx.reply(t("tree.project_not_selected"));
    return;
  }

  const directory = currentProject.worktree;
  const inputPath = ctx.match?.trim() || ".";
  const subPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(directory, inputPath);

  try {
    const lines: string[] = [];
    let itemCount = 0;
    let truncated = false;

    await buildTree(directory, subPath, "", 0, lines, () => {
      itemCount++;
      if (itemCount >= MAX_TREE_ITEMS) {
        truncated = true;
        return true; // stop
      }
      return false;
    });

    if (lines.length === 0) {
      await ctx.reply(t("tree.empty", { path: subPath }));
      return;
    }

    const header = t("tree.header", { path: subPath });
    let message = header + "```\n" + lines.join("\n");
    if (truncated) {
      message += `\n... (showing first ${MAX_TREE_ITEMS} items)`;
    }
    message += "\n```";

    // Truncate if too long
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.slice(0, MAX_MESSAGE_LENGTH - 10) + "\n```";
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (err) {
    logger.error("[Bot] /tree: unexpected error:", err);
    await ctx.reply(t("tree.error"));
  }
}

async function buildTree(
  directory: string,
  path: string,
  prefix: string,
  depth: number,
  lines: string[],
  shouldStop: () => boolean,
): Promise<void> {
  if (depth > MAX_TREE_DEPTH) return;

  const { data: files, error } = await opencodeClient.file.list({ directory, path });
  if (error || !files) return;

  // Sort: directories first, then files
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < sorted.length; i++) {
    if (shouldStop()) return;

    const item = sorted[i];
    const isLast = i === sorted.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const ignored = item.ignored ? " (ignored)" : "";
    const suffix = item.type === "directory" ? "/" : "";

    lines.push(`${prefix}${connector}${item.name}${suffix}${ignored}`);

    if (item.type === "directory" && depth < MAX_TREE_DEPTH) {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      await buildTree(directory, item.path, childPrefix, depth + 1, lines, shouldStop);
    }
  }
}
