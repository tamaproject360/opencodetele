import { en, type I18nKey } from "./en.js";
import { id } from "./id.js";
import { ru } from "./ru.js";

export const SUPPORTED_LOCALES = ["en", "ru", "id"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const dictionaries: Record<Locale, Record<I18nKey, string>> = {
  en,
  ru,
  id,
};

let runtimeLocaleOverride: Locale | null = null;

function normalizeLocale(locale: string): Locale {
  const normalized = locale.trim().toLowerCase();
  const baseLocale = normalized.split("-")[0];

  if (baseLocale === "ru") {
    return "ru";
  }

  if (baseLocale === "id") {
    return "id";
  }

  return "en";
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (fullMatch, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      return fullMatch;
    }

    return String(value);
  });
}

export function getLocale(): Locale {
  if (runtimeLocaleOverride) {
    return runtimeLocaleOverride;
  }

  const localeFromEnv = process.env.BOT_LOCALE;
  return normalizeLocale(localeFromEnv ?? "en");
}

export function setRuntimeLocale(locale: Locale): void {
  runtimeLocaleOverride = locale;
}

export function resetRuntimeLocale(): void {
  runtimeLocaleOverride = null;
}

export function t(key: I18nKey, params?: TranslationParams, locale?: Locale): string {
  const activeLocale = locale ?? getLocale();
  const dictionary = dictionaries[activeLocale];
  const template = dictionary[key] ?? en[key];

  if (!template) {
    return key;
  }

  return interpolate(template, params);
}
