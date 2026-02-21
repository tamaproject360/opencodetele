import { describe, it, expect, afterEach } from "vitest";
import { en } from "../../src/i18n/en.js";
import { id } from "../../src/i18n/id.js";
import { ru } from "../../src/i18n/ru.js";
import {
  t,
  getLocale,
  setRuntimeLocale,
  resetRuntimeLocale,
  SUPPORTED_LOCALES,
} from "../../src/i18n/index.js";
import type { I18nKey } from "../../src/i18n/en.js";

afterEach(() => {
  resetRuntimeLocale();
});

// ---------------------------------------------------------------------------
// #18 — Key completeness for locale "id"
// ---------------------------------------------------------------------------

describe("i18n/id — key completeness", () => {
  const enKeys = Object.keys(en) as I18nKey[];

  it("id locale has the same number of keys as en", () => {
    expect(Object.keys(id).length).toBe(enKeys.length);
  });

  it("id locale contains all keys defined in en", () => {
    const idKeys = new Set(Object.keys(id));
    const missing = enKeys.filter((k) => !idKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("id locale has no extra keys not present in en", () => {
    const enKeySet = new Set(enKeys);
    const extra = Object.keys(id).filter((k) => !enKeySet.has(k as I18nKey));
    expect(extra).toEqual([]);
  });

  it("all id values are non-empty strings", () => {
    const empty = Object.entries(id)
      .filter(([, v]) => typeof v !== "string" || v.length === 0)
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// #18 — Key completeness for locale "ru" (baseline sanity)
// ---------------------------------------------------------------------------

describe("i18n/ru — key completeness", () => {
  const enKeys = Object.keys(en) as I18nKey[];

  it("ru locale contains all keys defined in en", () => {
    const ruKeys = new Set(Object.keys(ru));
    const missing = enKeys.filter((k) => !ruKeys.has(k));
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// #19 — normalizeLocale() / getLocale() for locale "id"
// ---------------------------------------------------------------------------

describe("i18n — normalizeLocale / getLocale", () => {
  it('SUPPORTED_LOCALES includes "id"', () => {
    expect(SUPPORTED_LOCALES).toContain("id");
  });

  it('setRuntimeLocale("id") → getLocale() returns "id"', () => {
    setRuntimeLocale("id");
    expect(getLocale()).toBe("id");
  });

  it('BOT_LOCALE=id env var normalises to "id"', () => {
    resetRuntimeLocale();
    const prev = process.env.BOT_LOCALE;
    process.env.BOT_LOCALE = "id";
    expect(getLocale()).toBe("id");
    process.env.BOT_LOCALE = prev ?? "";
  });

  it('BOT_LOCALE=id-ID (BCP-47) normalises to "id"', () => {
    resetRuntimeLocale();
    const prev = process.env.BOT_LOCALE;
    process.env.BOT_LOCALE = "id-ID";
    expect(getLocale()).toBe("id");
    process.env.BOT_LOCALE = prev ?? "";
  });

  it('BOT_LOCALE=ID (uppercase) normalises to "id"', () => {
    resetRuntimeLocale();
    const prev = process.env.BOT_LOCALE;
    process.env.BOT_LOCALE = "ID";
    expect(getLocale()).toBe("id");
    process.env.BOT_LOCALE = prev ?? "";
  });

  it('BOT_LOCALE=ru normalises to "ru"', () => {
    resetRuntimeLocale();
    const prev = process.env.BOT_LOCALE;
    process.env.BOT_LOCALE = "ru";
    expect(getLocale()).toBe("ru");
    process.env.BOT_LOCALE = prev ?? "";
  });

  it('BOT_LOCALE=fr falls back to "en"', () => {
    resetRuntimeLocale();
    const prev = process.env.BOT_LOCALE;
    process.env.BOT_LOCALE = "fr";
    expect(getLocale()).toBe("en");
    process.env.BOT_LOCALE = prev ?? "";
  });
});

// ---------------------------------------------------------------------------
// t() function — interpolation and locale switching
// ---------------------------------------------------------------------------

describe("i18n — t() function", () => {
  it("returns the key as fallback when key is missing in all locales", () => {
    // Cast as I18nKey to avoid TypeScript error; at runtime it should not exist
    const result = t("__nonexistent_key__" as I18nKey);
    expect(result).toBe("__nonexistent_key__");
  });

  it("interpolates {placeholder} correctly", () => {
    const result = t("bot.session_created", { title: "My Session" });
    expect(result).toContain("My Session");
  });

  it("leaves unmatched placeholders as-is", () => {
    const result = t("bot.session_created", {}); // no title provided
    expect(result).toContain("{title}");
  });

  it("renders id locale strings via setRuntimeLocale", () => {
    setRuntimeLocale("id");
    // "error.generic" must exist and differ from key
    const result = t("error.generic");
    expect(result).not.toBe("error.generic");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts explicit locale override as third argument", () => {
    const enResult = t("error.generic", undefined, "en");
    const idResult = t("error.generic", undefined, "id");
    // Both should be non-empty; en and id strings may or may not be identical
    expect(enResult.length).toBeGreaterThan(0);
    expect(idResult.length).toBeGreaterThan(0);
  });
});
