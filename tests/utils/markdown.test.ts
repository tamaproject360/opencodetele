import { describe, it, expect } from "vitest";
import { sanitizeMarkdown } from "../../src/utils/markdown.js";

describe("utils/markdown — sanitizeMarkdown", () => {
  it("leaves plain text unchanged", () => {
    expect(sanitizeMarkdown("Hello world")).toBe("Hello world");
  });

  it("converts ATX headings to bold", () => {
    expect(sanitizeMarkdown("# Title")).toBe("*Title*");
    expect(sanitizeMarkdown("## Sub")).toBe("*Sub*");
    expect(sanitizeMarkdown("### Deep")).toBe("*Deep*");
  });

  it("converts setext H1 to bold", () => {
    const input = "Title\n===";
    expect(sanitizeMarkdown(input)).toBe("*Title*");
  });

  it("converts setext H2 to bold", () => {
    const input = "Subtitle\n---";
    expect(sanitizeMarkdown(input)).toBe("*Subtitle*");
  });

  it("strips ~~strikethrough~~", () => {
    expect(sanitizeMarkdown("~~deleted~~")).toBe("deleted");
  });

  it("converts blockquote lines", () => {
    expect(sanitizeMarkdown("> note")).toBe("│ note");
  });

  it("strips HTML tags", () => {
    expect(sanitizeMarkdown("<p>text</p>")).toBe("text\n\n");
    expect(sanitizeMarkdown("line1<br>line2")).toBe("line1\nline2");
  });

  it("strips inline HTML", () => {
    expect(sanitizeMarkdown("<b>bold</b>")).toBe("bold");
  });

  it("converts heading and preserves inline code in the heading", () => {
    // The heading text before the code span gets bolded; code span is untouched
    const input = "# outside `code`";
    const result = sanitizeMarkdown(input);
    // heading part is converted, inline code preserved
    expect(result).toContain("`code`");
    expect(result).not.toContain("# outside");
  });

  it("preserves fenced code blocks unchanged", () => {
    const input = "# heading\n```\n# not a heading\n```";
    const result = sanitizeMarkdown(input);
    expect(result).toContain("# not a heading");
    expect(result).toContain("*heading*");
  });

  it("collapses more than 2 consecutive blank lines to 2", () => {
    const input = "a\n\n\n\nb";
    expect(sanitizeMarkdown(input)).toBe("a\n\nb");
  });

  it("returns empty string unchanged", () => {
    expect(sanitizeMarkdown("")).toBe("");
  });
});
