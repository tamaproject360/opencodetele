/**
 * File upload handler — receives documents and photos from Telegram and
 * appends them as context to the next OpenCode prompt.
 *
 * Files are downloaded from Telegram to a temporary directory inside the
 * current project, then included as a file path reference in the prompt text.
 * After the prompt is sent the temporary file is cleaned up.
 */

import { Context } from "grammy";
import { promises as fs } from "fs";
import * as nodePath from "path";
import { getCurrentProject } from "../../settings/manager.js";
import { logger } from "../../utils/logger.js";
import { t } from "../../i18n/index.js";

interface PendingAttachment {
  localPath: string;
  filename: string;
  mimeType: string;
}

const pendingAttachments: PendingAttachment[] = [];

/** Returns all pending attachments and clears the queue. */
export function consumePendingAttachments(): PendingAttachment[] {
  return pendingAttachments.splice(0);
}

/** Returns true if there are queued attachments. */
export function hasPendingAttachments(): boolean {
  return pendingAttachments.length > 0;
}

/** Build the attachment context block to prepend to a prompt. */
export function buildAttachmentContext(attachments: PendingAttachment[]): string {
  if (attachments.length === 0) return "";
  const lines = attachments.map((a) => `- ${a.localPath} (${a.mimeType})`);
  return `[Attached files]\n${lines.join("\n")}\n\n`;
}

/** Clean up downloaded temporary files. */
export async function cleanupAttachments(attachments: PendingAttachment[]): Promise<void> {
  for (const att of attachments) {
    await fs.unlink(att.localPath).catch((e) => {
      logger.warn(`[FileUpload] Failed to delete temp file ${att.localPath}:`, e);
    });
  }
}

async function downloadTelegramFile(
  ctx: Context,
  fileId: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  const project = getCurrentProject();
  if (!project) {
    await ctx.reply(t("bot.project_not_selected"));
    return;
  }

  const tempDir = nodePath.join(project.worktree, ".tmp", "telegram-uploads");
  await fs.mkdir(tempDir, { recursive: true });
  const localPath = nodePath.join(tempDir, filename);

  try {
    const fileInfo = await ctx.api.getFile(fileId);
    const filePath = fileInfo.file_path;
    if (!filePath) {
      await ctx.reply(t("file_upload.download_error"));
      return;
    }

    const token = ctx.api.token;
    const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);

    pendingAttachments.push({ localPath, filename, mimeType });
    logger.info(`[FileUpload] Queued file: ${filename} (${buffer.length} bytes)`);
    await ctx.reply(t("file_upload.queued", { filename }));
  } catch (err) {
    logger.error("[FileUpload] Failed to download file from Telegram:", err);
    await ctx.reply(t("file_upload.download_error"));
  }
}

export async function handleDocumentUpload(ctx: Context): Promise<void> {
  const doc = ctx.message?.document;
  if (!doc) return;

  const filename = doc.file_name ?? `document_${doc.file_id.slice(-8)}`;
  const mimeType = doc.mime_type ?? "application/octet-stream";

  logger.debug(`[FileUpload] Received document: ${filename} (${mimeType})`);
  await downloadTelegramFile(ctx, doc.file_id, filename, mimeType);
}

export async function handlePhotoUpload(ctx: Context): Promise<void> {
  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) return;

  // Use largest photo size
  const photo = photos[photos.length - 1];
  const filename = `photo_${photo.file_id.slice(-8)}.jpg`;

  logger.debug(`[FileUpload] Received photo: ${filename}`);
  await downloadTelegramFile(ctx, photo.file_id, filename, "image/jpeg");
}
