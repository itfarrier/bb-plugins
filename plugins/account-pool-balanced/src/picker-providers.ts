// Picker providers: pool providers that surface directly in BB's agent menu.
// When a provider has enabled routing and at least one enabled account, the
// server registers a BB agent provider ("pool-<id>") whose bridge is the SDK's
// ACP bridge launching `opencode acp`. The pool then injects, per thread, an
// inline OpenCode config (OPENCODE_CONFIG_CONTENT) that points a matching
// OpenCode provider at the hub, plus the pool token and hub base URL it
// references — so the picker entry, model list and credentials all come from
// the pool with no manual OpenCode setup.

import type { PoolProvider } from "./contracts.js";
import { COMPATIBLE_PROVIDERS } from "./compatible-providers.js";

export interface PickerProviderDefinition {
  /** BB agent-provider id; stable across sessions. */
  pickerId: string;
  /** The pool provider whose accounts serve the traffic. */
  provider: PoolProvider;
  displayName: string;
  /** Env var carrying the pool token; the OpenCode config references it. */
  keyEnv: string;
  /** Env var carrying the hub base URL, injected as a {serverPath} value. */
  baseEnv: string;
  /** Hub mount path relative to the plugin HTTP base: "<provider>/v1". */
  mount: string;
}

export const PICKER_PROVIDER_DEFS: readonly PickerProviderDefinition[] = [
  {
    pickerId: "pool-zai",
    provider: "zai",
    displayName: "Z.ai (pool)",
    keyEnv: "ZAI_API_KEY",
    baseEnv: "OXI_ZAI_BASE_URL",
    mount: "zai/v1",
  },
  {
    pickerId: "pool-opencode-go",
    provider: "opencode-go",
    displayName: "OpenCode Go (pool)",
    keyEnv: "OPENCODE_API_KEY",
    baseEnv: "OXI_OPENCODE_GO_BASE_URL",
    mount: "opencode-go/v1",
  },
  ...COMPATIBLE_PROVIDERS.map(
    (definition): PickerProviderDefinition => ({
      pickerId: `pool-${definition.id}`,
      provider: definition.id,
      displayName: `${definition.title} (pool)`,
      keyEnv: definition.keyEnvs[0],
      baseEnv: `OXI_${definition.id.toUpperCase().replace(/-/gu, "_")}_BASE_URL`,
      mount: `${definition.id}/v1`,
    }),
  ),
];

/** Provider ids eligible for the picker: routing on and an enabled account. */
export function desiredPickerProviders(
  enabledProviders: ReadonlySet<string>,
): PickerProviderDefinition[] {
  return PICKER_PROVIDER_DEFS.filter((definition) =>
    enabledProviders.has(definition.provider),
  );
}

/** OpenCode model entries are capped so the inline config stays a sane size. */
export const OPENCODE_MODEL_LIMIT = 100;

/** Inline OpenCode config (OPENCODE_CONFIG_CONTENT) for one pool provider. */
export function opencodeConfigContent(
  definition: PickerProviderDefinition,
  models: readonly string[],
): string {
  const capped = models.slice(0, OPENCODE_MODEL_LIMIT);
  return JSON.stringify({
    provider: {
      [definition.pickerId]: {
        name: definition.displayName,
        npm: "@ai-sdk/openai-compatible",
        options: {
          apiKey: `{env:${definition.keyEnv}}`,
          baseURL: `{env:${definition.baseEnv}}`,
        },
        models: Object.fromEntries(
          (capped.length > 0 ? capped : ["default"]).map((id) => [
            id,
            { name: id },
          ]),
        ),
      },
    },
  });
}

export interface PickerFallbackModel {
  id: string;
  displayName: string;
  description: string;
  supportedReasoningEfforts: readonly {
    reasoningEffort: "none" | "low" | "medium" | "high" | "xhigh" | "ultracode" | "max" | "ultra";
    description: string;
  }[];
  defaultReasoningEffort: "none" | "low" | "medium" | "high" | "xhigh" | "ultracode" | "max" | "ultra";
  isDefault: boolean;
}

/** Cold-cache picker models from the hub's /models catalog. */
export function pickerFallbackModels(
  definition: PickerProviderDefinition,
  models: readonly string[],
): PickerFallbackModel[] {
  return models.slice(0, 50).map((id, index) => ({
    id,
    displayName: id,
    description: `${definition.displayName} model served through the pool`,
    supportedReasoningEfforts: [
      { reasoningEffort: "medium", description: "Provider default effort" },
    ],
    defaultReasoningEffort: "medium",
    isDefault: index === 0,
  }));
}

/** Extract model ids from a hub `GET <mount>/models` response body. */
export function modelIdsFromCatalog(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data
    .map((entry) =>
      typeof entry === "object" && entry !== null && typeof (entry as { id?: unknown }).id === "string"
        ? (entry as { id: string }).id
        : null,
    )
    .filter((id): id is string => id !== null);
}
