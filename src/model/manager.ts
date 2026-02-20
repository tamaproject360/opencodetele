import { getCurrentModel, setCurrentModel } from "../settings/manager.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { opencodeClient } from "../opencode/client.js";
import type { ModelInfo, FavoriteModel } from "./types.js";
import path from "node:path";

interface OpenCodeModelState {
  favorite?: Array<{ providerID?: string; modelID?: string }>;
}

function getEnvDefaultModel(): FavoriteModel | null {
  const providerID = config.opencode.model.provider;
  const modelID = config.opencode.model.modelId;

  if (!providerID || !modelID) {
    return null;
  }

  return { providerID, modelID };
}

function dedupeModels(models: FavoriteModel[]): FavoriteModel[] {
  const unique = new Map<string, FavoriteModel>();

  for (const model of models) {
    const key = `${model.providerID}/${model.modelID}`;
    if (!unique.has(key)) {
      unique.set(key, model);
    }
  }

  return Array.from(unique.values());
}

function normalizeFavoriteModels(state: OpenCodeModelState): FavoriteModel[] {
  if (!Array.isArray(state.favorite)) {
    return [];
  }

  return state.favorite
    .filter(
      (model): model is { providerID: string; modelID: string } =>
        typeof model?.providerID === "string" &&
        model.providerID.length > 0 &&
        typeof model.modelID === "string" &&
        model.modelID.length > 0,
    )
    .map((model) => ({
      providerID: model.providerID,
      modelID: model.modelID,
    }));
}

function getOpenCodeModelStatePath(): string {
  const xdgStateHome = process.env.XDG_STATE_HOME;

  if (xdgStateHome && xdgStateHome.trim().length > 0) {
    return path.join(xdgStateHome, "opencode", "model.json");
  }

  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  return path.join(homeDir, ".local", "state", "opencode", "model.json");
}

/**
 * Get all available models from OpenCode API (all providers).
 * Falls back to local favorites file, then env default if API is unavailable.
 */
export async function getFavoriteModels(): Promise<FavoriteModel[]> {
  // 1. Try to fetch all models from the live API
  try {
    const { data: providersData, error } = await opencodeClient.config.providers();

    if (!error && providersData?.providers && providersData.providers.length > 0) {
      const apiModels: FavoriteModel[] = [];

      for (const provider of providersData.providers) {
        const models = Object.values(provider.models ?? {});
        for (const model of models) {
          if (model.id) {
            apiModels.push({ providerID: provider.id, modelID: model.id });
          }
        }
      }

      if (apiModels.length > 0) {
        logger.debug(`[ModelManager] Loaded ${apiModels.length} models from API`);
        return apiModels;
      }

      logger.warn("[ModelManager] API returned no models, falling back to local favorites");
    } else {
      logger.warn("[ModelManager] API providers error or empty, falling back to local favorites");
    }
  } catch (err) {
    logger.warn("[ModelManager] Failed to fetch models from API, falling back to local:", err);
  }

  // 2. Fallback: read local OpenCode favorites file
  const envDefaultModel = getEnvDefaultModel();

  try {
    const fs = await import("fs/promises");

    const stateFilePath = getOpenCodeModelStatePath();
    const content = await fs.readFile(stateFilePath, "utf-8");
    const state = JSON.parse(content) as OpenCodeModelState;
    const favorites = normalizeFavoriteModels(state);

    if (favorites.length === 0) {
      if (envDefaultModel) {
        logger.info(`[ModelManager] No favorites in ${stateFilePath}, using env default model`);
        return [envDefaultModel];
      }

      logger.warn(`[ModelManager] No favorites in ${stateFilePath}`);
      return [];
    }

    const merged = envDefaultModel ? dedupeModels([...favorites, envDefaultModel]) : favorites;

    logger.debug(`[ModelManager] Loaded ${merged.length} favorite models from ${stateFilePath}`);
    return merged;
  } catch (err) {
    // 3. Final fallback: env default model only
    if (envDefaultModel) {
      logger.warn(
        "[ModelManager] Failed to load OpenCode favorites, using env default model:",
        err,
      );
      return [envDefaultModel];
    }

    logger.error("[ModelManager] Failed to load OpenCode favorites:", err);
    return [];
  }
}

/**
 * Get current model from settings or fallback to config
 * @returns Current model info
 */
export function fetchCurrentModel(): ModelInfo {
  return getStoredModel();
}

/**
 * Select model and persist to settings
 * @param modelInfo Model to select
 */
export function selectModel(modelInfo: ModelInfo): void {
  logger.info(`[ModelManager] Selected model: ${modelInfo.providerID}/${modelInfo.modelID}`);
  setCurrentModel(modelInfo);
}

/**
 * Get stored model from settings (synchronous)
 * ALWAYS returns a model - fallback to config if not found
 * @returns Current model info
 */
export function getStoredModel(): ModelInfo {
  const storedModel = getCurrentModel();

  if (storedModel) {
    // Ensure variant is set (default to "default")
    if (!storedModel.variant) {
      storedModel.variant = "default";
    }
    return storedModel;
  }

  // Fallback to model from config (environment variables)
  if (config.opencode.model.provider && config.opencode.model.modelId) {
    logger.debug("[ModelManager] Using model from config");
    return {
      providerID: config.opencode.model.provider,
      modelID: config.opencode.model.modelId,
      variant: "default",
    };
  }

  // This should not happen if config is properly set
  logger.warn("[ModelManager] No model found in settings or config, returning empty model");
  return {
    providerID: "",
    modelID: "",
    variant: "default",
  };
}
