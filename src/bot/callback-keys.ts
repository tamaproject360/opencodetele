/**
 * Centralized callback data key prefixes for inline keyboard buttons.
 *
 * All callback_query data strings follow the pattern: `PREFIX + payload`.
 * Using these constants avoids scattered magic strings across handlers.
 */

export const CB = {
  /** Session selection: "session:<sessionId>" */
  SESSION: "session:",

  /** Project selection: "project:<projectId>" */
  PROJECT: "project:",

  /** Agent selection: "agent:<agentName>" */
  AGENT: "agent:",

  /** Model selection: "model:<providerID>:<modelID>" */
  MODEL: "model:",

  /** Variant selection: "variant:<variantId>" */
  VARIANT: "variant:",

  /** Question answer: "question:<answer>" */
  QUESTION: "question:",

  /** Permission response: "permission:<once|always|reject>" */
  PERMISSION: "permission:",

  /** Compact context confirm */
  COMPACT_CONFIRM: "compact:confirm",

  /** Compact context cancel */
  COMPACT_CANCEL: "compact:cancel",

  /** Rename cancel */
  RENAME_CANCEL: "rename:cancel",
} as const;
