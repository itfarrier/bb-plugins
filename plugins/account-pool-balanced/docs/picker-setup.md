# Showing pooled providers in BB's agent picker

BB's composer picker lists **agent providers** — the executors that run turns
(Claude Code, Codex, and ACP agents). The pool is a traffic router: it does not
add picker entries by itself. Instead it attaches routing to agent providers by
id (`experimental_contributeEnv`), swapping the real provider key for a pool
token and pointing the agent at the hub whenever a thread runs on a matching
provider id.

To select a pooled provider in the menu, register a matching **ACP agent** in
BB and give OpenCode a provider entry that reads the pool-injected environment.

## 1. Register the ACP agents (BB side)

Settings → Plugins → ACP providers → `customAgents`, or:

```sh
bb plugin config provider-acp set customAgents '[
  {"id":"opencode-zai","displayName":"Z.ai (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-go","displayName":"OpenCode Go (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-openrouter","displayName":"OpenRouter (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-nvidia","displayName":"NVIDIA (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-groq","displayName":"Groq (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-mistral","displayName":"Mistral (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-modelscope","displayName":"ModelScope (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-cloudflare","displayName":"Cloudflare (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-llm7","displayName":"LLM7 (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-kilo","displayName":"Kilo (pool)","command":"opencode","args":["acp"]},
  {"id":"opencode-opencode","displayName":"OpenCode Zen (pool)","command":"opencode","args":["acp"]}
]'
```

Merge with any entries you already have — the setting replaces the whole
array. BB derives provider ids `acp-<id>` (`acp-opencode-zai`,
`acp-opencode-openrouter`, …), which are exactly the ids the pool contributes
environment to. Changes apply immediately.

The one exception is Kimi: the pool's Kimi mount speaks the Anthropic wire
(`/kimi/v1/messages`), so it is reached through OpenCode's Anthropic-compatible
provider rather than the OpenAI-compatible entries below.

## 2. Point OpenCode at the pool (OpenCode side)

When BB starts a thread on `acp-opencode-<provider>`, the pool injects:

| Provider id | Key env | Base-URL env |
| --- | --- | --- |
| `acp-opencode-zai` | `ZAI_API_KEY` | `OXI_ZAI_BASE_URL` |
| `acp-opencode-go` | `OPENCODE_API_KEY` | `OXI_OPENCODE_GO_BASE_URL` |
| `acp-opencode-<id>` | first key env of the provider | `OXI_<ID>_BASE_URL` |

Add matching provider entries to `~/.config/opencode/opencode.json` that read
those variables with `{env:…}` substitution. Inside BB sessions only the
injected variables exist, so these entries only work through the pool — your
normal OpenCode CLI setup is unaffected because the ids are distinct.

```json
{
  "provider": {
    "pool-zai": {
      "name": "Z.ai (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:ZAI_API_KEY}", "baseURL": "{env:OXI_ZAI_BASE_URL}" },
      "models": { "glm-4.6": { "name": "GLM-4.6" }, "glm-4.5-air": { "name": "GLM-4.5 Air" } }
    },
    "pool-openrouter": {
      "name": "OpenRouter (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:OPENROUTER_API_KEY}", "baseURL": "{env:OXI_OPENROUTER_BASE_URL}" },
      "models": { "openai/gpt-4o-mini": { "name": "GPT-4o mini" }, "z-ai/glm-4.6": { "name": "GLM-4.6" } }
    },
    "pool-groq": {
      "name": "Groq (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:GROQ_API_KEY}", "baseURL": "{env:OXI_GROQ_BASE_URL}" },
      "models": { "llama-3.3-70b-versatile": { "name": "Llama 3.3 70B" }, "openai/gpt-oss-120b": { "name": "GPT-OSS 120B" } }
    },
    "pool-nvidia": {
      "name": "NVIDIA (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:NVIDIA_API_KEY}", "baseURL": "{env:OXI_NVIDIA_BASE_URL}" },
      "models": { "meta/llama-3.1-405b-instruct": { "name": "Llama 3.1 405B" } }
    },
    "pool-mistral": {
      "name": "Mistral (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:MISTRAL_API_KEY}", "baseURL": "{env:OXI_MISTRAL_BASE_URL}" },
      "models": { "mistral-large-latest": { "name": "Mistral Large" }, "codestral-latest": { "name": "Codestral" } }
    },
    "pool-modelscope": {
      "name": "ModelScope (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:MODELSCOPE_API_KEY}", "baseURL": "{env:OXI_MODELSCOPE_BASE_URL}" },
      "models": { "ZhipuAI/GLM-4.6": { "name": "GLM-4.6" }, "deepseek-ai/DeepSeek-V3.1": { "name": "DeepSeek V3.1" } }
    },
    "pool-cloudflare": {
      "name": "Cloudflare (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:CLOUDFLARE_API_TOKEN}", "baseURL": "{env:OXI_CLOUDFLARE_BASE_URL}" },
      "models": { "@cf/meta/llama-3.1-8b-instruct": { "name": "Llama 3.1 8B" } }
    },
    "pool-llm7": {
      "name": "LLM7 (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:LLM7_API_KEY}", "baseURL": "{env:OXI_LLM7_BASE_URL}" },
      "models": { "gpt-4o": { "name": "GPT-4o" } }
    },
    "pool-kilo": {
      "name": "Kilo (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:KILO_API_KEY}", "baseURL": "{env:OXI_KILO_BASE_URL}" },
      "models": { "auto": { "name": "Kilo auto" } }
    },
    "pool-opencode-zen": {
      "name": "OpenCode Zen (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:OPENCODE_API_KEY}", "baseURL": "{env:OXI_OPENCODE_BASE_URL}" },
      "models": { "code-supernova": { "name": "Code Supernova" } }
    },
    "pool-opencode-go": {
      "name": "OpenCode Go (pool)",
      "npm": "@ai-sdk/openai-compatible",
      "options": { "apiKey": "{env:OPENCODE_API_KEY}", "baseURL": "{env:OXI_OPENCODE_GO_BASE_URL}" },
      "models": { "code-supernova": { "name": "Code Supernova" } }
    }
  }
}
```

Adjust the model ids to what each provider actually serves — the pool forwards
whatever id the client picks. `GET <hub>/<provider>/v1/models` with a pool
token lists them.

## 3. Use it

Pick the agent in the composer (e.g. **OpenRouter (pool)**), choose a model
from its `pool-openrouter` entries, and send. The turn runs: BB → opencode
(ACP) → pool hub (token swapped for the real key) → provider. `bb pool status`
shows the account and quota the turn used.

Routing per provider can be turned off with `bb pool routing <provider> --off`;
the corresponding ACP agent then contributes no environment and traffic falls
back to whatever the agent is configured with natively.
