// Registry of API-key providers that speak the OpenAI Chat Completions wire.
// Each entry becomes a pool provider with a `/<mountPrefix>v1/...` HTTP mount,
// one upstream base URL, and one or more well-known environment variable names
// that `bb pool account add-env` scans for keys. Add an entry here and the hub,
// server routes, CLI, settings UI and standalone listener pick it up.

export const COMPATIBLE_PROVIDER_IDS = [
  "nvidia",
  "openrouter",
  "groq",
  "mistral",
  "modelscope",
  "cloudflare",
  "llm7",
  "kilo",
  "opencode",
] as const;

export type CompatibleProviderId = (typeof COMPATIBLE_PROVIDER_IDS)[number];

export interface CompatibleProviderDefinition {
  /** Pool provider id; also used as the mount prefix. */
  id: CompatibleProviderId;
  /** Display name. */
  title: string;
  /** Upstream service name used in error messages. */
  upstreamName: string;
  /** Upstream Chat Completions base URL, including the version segment. */
  defaultBaseUrl: (env: Readonly<Record<string, string | undefined>>) => string;
  /** Environment variable names scanned for API keys, in priority order. */
  keyEnvs: readonly string[];
  /** Extra request header prefixes forwarded from the inbound client. */
  allowedHeaderPrefixes?: readonly string[];
}

const envValue = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => env[name] ?? "";

export const COMPATIBLE_PROVIDERS: readonly CompatibleProviderDefinition[] = [
  {
    id: "nvidia",
    title: "NVIDIA NIM",
    upstreamName: "NVIDIA",
    defaultBaseUrl: () => "https://integrate.api.nvidia.com/v1",
    keyEnvs: ["NVIDIA_API_KEY"],
  },
  {
    id: "openrouter",
    title: "OpenRouter",
    upstreamName: "OpenRouter",
    defaultBaseUrl: () => "https://openrouter.ai/api/v1",
    keyEnvs: ["OPENROUTER_API_KEY"],
    allowedHeaderPrefixes: ["http-referer", "x-title"],
  },
  {
    id: "groq",
    title: "Groq",
    upstreamName: "Groq",
    defaultBaseUrl: () => "https://api.groq.com/openai/v1",
    keyEnvs: ["GROQ_API_KEY"],
  },
  {
    id: "mistral",
    title: "Mistral",
    upstreamName: "Mistral",
    defaultBaseUrl: () => "https://api.mistral.ai/v1",
    keyEnvs: ["MISTRAL_API_KEY"],
  },
  {
    id: "modelscope",
    title: "ModelScope",
    upstreamName: "ModelScope",
    defaultBaseUrl: () => "https://api-inference.modelscope.cn/v1",
    keyEnvs: ["MODELSCOPE_API_KEY"],
  },
  {
    id: "cloudflare",
    title: "Cloudflare Workers AI",
    upstreamName: "Cloudflare",
    defaultBaseUrl: (env) =>
      `https://api.cloudflare.com/client/v4/accounts/${envValue(env, "CLOUDFLARE_ACCOUNT_ID") || "YOUR_ACCOUNT_ID"}/ai/v1`,
    keyEnvs: ["CLOUDFLARE_API_TOKEN"],
  },
  {
    id: "llm7",
    title: "LLM7",
    upstreamName: "LLM7",
    defaultBaseUrl: () => "https://api.llm7.io/v1",
    keyEnvs: ["LLM7_API_KEY"],
  },
  {
    id: "kilo",
    title: "Kilo",
    upstreamName: "Kilo",
    defaultBaseUrl: () => "https://api.kilo.ai/api/gateway/v1",
    keyEnvs: ["KILO_API_KEY", "KILO_TOKEN"],
  },
  {
    id: "opencode",
    title: "OpenCode Zen",
    upstreamName: "OpenCode Zen",
    defaultBaseUrl: () => "https://opencode.ai/zen/v1",
    keyEnvs: ["OPENCODE_API_KEY", "OPENCODE_API_KEY_2"],
  },
];

/** Every environment variable name the env scanner looks at, for diagnostics. */
export const COMPATIBLE_ENV_SUMMARY: string = COMPATIBLE_PROVIDERS.flatMap(
  (definition) => definition.keyEnvs,
).join(", ");

export function compatibleProvider(
  id: string,
): CompatibleProviderDefinition | null {
  return (
    COMPATIBLE_PROVIDERS.find((definition) => definition.id === id) ?? null
  );
}

/** Env-var keys of one provider; one pooled account is created per present key. */
export function scanCompatibleProviderKeys(
  env: Readonly<Record<string, string | undefined>>,
): Array<{ definition: CompatibleProviderDefinition; envName: string; apiKey: string }> {
  const found: Array<{
    definition: CompatibleProviderDefinition;
    envName: string;
    apiKey: string;
  }> = [];
  for (const definition of COMPATIBLE_PROVIDERS) {
    for (const envName of definition.keyEnvs) {
      const apiKey = (env[envName] ?? "").trim();
      if (apiKey !== "") found.push({ definition, envName, apiKey });
    }
  }
  return found;
}

const ENV_FILE_LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;

/** Parse KEY=VALUE lines from a dotenv-style file; quotes and comments honored. */
export function parseEnvFile(text: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = ENV_FILE_LINE.exec(line);
    if (match === null) continue;
    let value = match[2];
    const hash = value.indexOf(" #");
    if (hash >= 0 && !value.startsWith('"') && !value.startsWith("'")) {
      value = value.slice(0, hash).trim();
    }
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    parsed[match[1]] = value;
  }
  return parsed;
}
