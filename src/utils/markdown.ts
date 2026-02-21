/**
 * Markdown sanitization for Telegram.
 *
 * OpenCode responses use standard Markdown which is not always compatible
 * with Telegram's Markdown parsing. This module converts the most common
 * incompatible constructs to Telegram-safe equivalents.
 *
 * Telegram Markdown v1 rules (parse_mode: "Markdown"):
 * - *bold*, _italic_, `code`, ```pre```
 * - Unsupported: # headings, HTML tags, ~~strikethrough~~, > blockquotes
 * - Special chars outside code spans must NOT be bare: _ * [ ] ` (they close markup)
 *
 * Strategy: we convert rather than escape, preserving readability.
 */

/**
 * Convert a raw Markdown string from OpenCode to a Telegram-safe Markdown string.
 *
 * Transformations applied (in order):
 * 1. Strip HTML tags (`<br>`, `<p>`, etc.)
 * 2. Convert ATX headings (`# H1` … `###### H6`) to bold: `*H1*`
 * 3. Convert setext headings (underlined with `===` or `---`) to bold
 * 4. Convert `~~strikethrough~~` to plain text (unsupported in TG Markdown v1)
 * 5. Convert `> blockquote` lines to plain lines prefixed with `│`
 * 6. Collapse 3+ consecutive blank lines to 2
 */
export function sanitizeMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Strip common HTML tags (replace block tags with newlines, inline with nothing)
  result = result.replace(/<br\s*\/?>/gi, "\n");
  result = result.replace(/<\/p>/gi, "\n\n");
  result = result.replace(/<p[^>]*>/gi, "");
  result = result.replace(/<[^>]+>/g, "");

  // 2. ATX headings: # Heading → *Heading*
  // Only outside code blocks (handled by processOutsideCodeBlocks)
  result = processOutsideCodeBlocks(result, (chunk) => {
    return (
      chunk
        // ATX headings (# to ######)
        .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
        // Setext H1 (===) – line above is the heading
        .replace(/^(.+)\n={3,}\s*$/gm, "*$1*")
        // Setext H2 (---) – only if the dashes line is 3+
        .replace(/^(.+)\n-{3,}\s*$/gm, "*$1*")
        // Strikethrough ~~text~~ → text
        .replace(/~~(.+?)~~/g, "$1")
        // Blockquote lines
        .replace(/^>\s?/gm, "│ ")
    );
  });

  // 3. Collapse 3+ blank lines to 2
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

/**
 * Apply `transform` only to text segments that are outside fenced code blocks
 * (``` ... ```) and inline code spans (` ... `).
 *
 * Code content is preserved verbatim.
 */
function processOutsideCodeBlocks(text: string, transform: (chunk: string) => string): string {
  const parts: string[] = [];
  // Split on fenced code blocks (``` ... ```) or inline code (` ... `)
  // Capture the delimiter so we can re-assemble
  const codePattern = /(```[\s\S]*?```|`[^`\n]+`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codePattern.exec(text)) !== null) {
    // Text before the code span
    const before = text.slice(lastIndex, match.index);
    parts.push(transform(before));
    // The code span itself — untouched
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last code span
  parts.push(transform(text.slice(lastIndex)));

  return parts.join("");
}
