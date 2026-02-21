import { describe, it, expect } from "vitest";
import { formatVariantForButton, formatVariantForDisplay } from "../../src/variant/manager.js";

describe("VariantManager", () => {
  describe("formatVariantForButton", () => {
    it("formats default variant", () => {
      expect(formatVariantForButton("default")).toBe("💡 Default");
    });

    it("capitalizes first letter of variant id", () => {
      expect(formatVariantForButton("low")).toBe("💡 Low");
      expect(formatVariantForButton("high")).toBe("💡 High");
    });

    it("handles single character variant id", () => {
      expect(formatVariantForButton("a")).toBe("💡 A");
    });

    it("handles empty string gracefully", () => {
      expect(formatVariantForButton("")).toBe("💡 ");
    });
  });

  describe("formatVariantForDisplay", () => {
    it("capitalizes first letter only", () => {
      expect(formatVariantForDisplay("default")).toBe("Default");
      expect(formatVariantForDisplay("low")).toBe("Low");
    });

    it("handles empty string", () => {
      expect(formatVariantForDisplay("")).toBe("");
    });
  });
});
