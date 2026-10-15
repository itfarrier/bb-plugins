# Pooled providers in BB's agent picker

Since pool 0.6.0 this is automatic: **a provider appears in BB's composer
agent menu as soon as the pool has an enabled account for it** (with routing
enabled, the default). Remove or disable its accounts and the entry
disappears.

## How it works

For every pool provider on the OpenAI Chat Completions wire — Z.ai, OpenCode
Go and the API-key registry (NVIDIA, OpenRouter, Groq, Mistral, ModelScope,
Cloudflare Workers AI, LLM7, Kilo, OpenCode Zen) — the plugin registers a BB
agent provider named `<Title> (pool)` (ids `pool-zai`, `pool-openrouter`, …)
backed by the SDK's generic ACP bridge. When a thread starts on it, the pool
injects everything the agent needs:

- `OPENCODE_CONFIG_CONTENT` — an inline OpenCode config that defines one
  `@ai-sdk/openai-compatible` provider pointing at the hub, with the model
  catalog fetched from the hub's `/models` route,
- the pool token (per machine and project) and the hub base URL the config
  references.

The registered provider launches `opencode acp` as its agent, so **OpenCode
must be installed on the machine** running the thread. Nothing else is
required — no manual OpenCode config, no ACP `customAgents` entries. Your own
OpenCode setup is untouched: the inline config defines only the pool provider,
under a distinct id.

Model list: the picker shows the provider's real catalog from its `/models`
route (fetched through the hub, refreshed in the background). Turn flow:
BB → OpenCode (ACP) → pool hub (token swapped for the real key) → provider.
`bb pool status` shows the account that served each turn.

## Requirements and notes

- OpenCode on the thread's host (`opencode --version`).
- An enabled account for the provider (`bb pool account add-env --keys-file …`)
  and routing enabled (`bb pool routing <provider>`; on by default).
- The entry appears within a second of adding/enabling an account; open
  threads keep running when the entry later disappears (they show
  provider-unavailable for new turns).
- Claude and Codex keep their native BB providers (the pool routes them
  in place). Kimi, Cursor and Devin keep their existing routing hooks.
- To hide a provider from the menu without removing the key, disable its
  accounts (`bb pool account disable <id>`) or turn off its routing
  (`bb pool routing <provider> --off`).

## Legacy manual setup

The earlier manual route — `customAgents` entries in BB's ACP providers plugin
plus explicit `{env:…}` provider entries in `~/.config/opencode/opencode.json`
— still works and composes with the pool's `acp-opencode-*` env contributions.
It is only needed if you prefer your own agent (not `opencode acp`) in the
menu; see `git history` for that document.
