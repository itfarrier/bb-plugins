# itfarrier BB Plugins — multi-provider Account Pool

Open-source plugins for [BB](https://github.com/get-bb/bb), forked from [OXI-717/bb-plugins](https://github.com/OXI-717/bb-plugins) (account-pool-balanced), which itself derives from get-bb/bb's account-pool. This fork turns the pool into a **multi-provider API-key gateway**: besides the native OAuth adapters (Claude, Codex) and the OXI adapters (Kimi, Z.ai, OpenCode Go, Cursor, Devin), it pools any **OpenAI-compatible provider by API key**, importing keys straight from your shell environment.

## Providers

| Provider | Pool id | Key env vars | Default upstream |
| --- | --- | --- | --- |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY` | `https://integrate.api.nvidia.com/v1` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` |
| Groq | `groq` | `GROQ_API_KEY` | `https://api.groq.com/openai/v1` |
| Mistral | `mistral` | `MISTRAL_API_KEY` | `https://api.mistral.ai/v1` |
| ModelScope | `modelscope` | `MODELSCOPE_API_KEY` | `https://api-inference.modelscope.cn/v1` |
| Cloudflare Workers AI | `cloudflare` | `CLOUDFLARE_API_TOKEN` (+ `CLOUDFLARE_ACCOUNT_ID` for the URL) | `https://api.cloudflare.com/client/v4/accounts/<account>/ai/v1` |
| LLM7 | `llm7` | `LLM7_API_KEY` | `https://api.llm7.io/v1` |
| Kilo | `kilo` | `KILO_API_KEY`, `KILO_TOKEN` | `https://api.kilo.ai/api/gateway/v1` |
| OpenCode Zen | `opencode` | `OPENCODE_API_KEY`, `OPENCODE_API_KEY_2` | `https://opencode.ai/zen/v1` |

These ride the same hub as every other adapter: sequential or balanced routing, primary/reserve roles, caps, session affinity, per-provider routing switches and external-client tokens all apply. They expose no quota telemetry, so rotation advances on the provider's own rate-limit responses; each provider gets a `/<provider>/v1/chat/completions` (POST) and `/<provider>/v1/models` (GET) mount.

To add another provider, append one entry to `plugins/account-pool-balanced/src/compatible-providers.ts` — the hub, server routes, CLI, settings UI and standalone listener pick it up automatically.

## Quick start (BB-hosted)

```sh
bb marketplace add git:https://github.com/itfarrier/bb-plugins@main
bb plugin install account-pool-balanced@itfarrier-public

# import every supported key found in the environment (e.g. from ~/.zshrc)
bb pool account add-env

# or read keys from files directly (KEY=VALUE and zsh export lines both work);
# needed because the bb daemon does not inherit your shell rc environment
bb pool account add-env --keys-file ~/.zshrc,~/.config/freelm/env

bb pool status
```

Point an OpenAI-compatible client at the pool mount of a routed provider, authenticating with a pool token instead of the real key:

```sh
bb pool client add laptop --output /secure/laptop.token
curl http://127.0.0.1:38886/api/v1/plugins/account-pool-balanced/http/openrouter/v1/chat/completions \
  -H "Authorization: Bearer $(cat /secure/laptop.token)" \
  -H "content-type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}'
```

Override a provider's upstream (for example a Cloudflare account-id change or a proxy) without editing code:

```sh
bb pool config set compatibleUpstream openrouter https://my-proxy.example/v1
bb pool config set compatibleUpstream openrouter default   # restore
```

## Standalone (no BB)

```sh
cd plugins/account-pool-balanced && npm ci
npm run pool -- --data-dir /secure/pool import-account < openrouter-account.json
npm run pool -- --data-dir /secure/pool client-add --client orca --output /secure/client.token
npm run pool -- --data-dir /secure/pool serve --port 8787
# POST http://127.0.0.1:8787/<provider>/v1/chat/completions with the client token
```

See [external clients and standalone setup](plugins/account-pool-balanced/docs/external-clients.md) for the full client matrix (Claude Code, Codex, Cursor, Devin).

## Showing pooled providers in BB's picker

The pool routes traffic; BB's agent picker lists agent providers. To see pooled providers in the menu, register matching ACP agents (OpenCode) and point them at the pool-injected environment — copy-paste steps in [picker setup](plugins/account-pool-balanced/docs/picker-setup.md).

## Inherited upstream features

Sequential and balanced routing, primary/reserve accounts, per-account caps, session affinity, quota telemetry for Claude/Codex/Kimi/Z.ai/OpenCode Go, Cursor and Devin adapters, project routing, VPN Guard integration, external clients and a standalone server — all documented in [PLUGIN_OVERVIEW.md](plugins/account-pool-balanced/PLUGIN_OVERVIEW.md) and the upstream README at https://github.com/OXI-717/bb-plugins.

Inherited changelog highlights (from upstream 0.4.x):

Version 0.4.3 shows the count and individual expiry dates of saved Codex usage-limit resets in each account card. These are separate from automatic quota-window resets. It also clears stale Claude reset dates when fresh usage omits a new date. Version 0.4.2 adds a successful-request count and explicit observed limit-reset times to each account card. Counts start when this version is installed and do not represent the provider's remaining token allowance. Version 0.4.1 preserves the native 1M Opus context window for Claude Code threads routed through the BB pool. Version 0.4.0 adds experimental Devin Local CLI proxying with server-side PAT storage and an isolated launcher for `devin -p` and ACP: see [external clients and standalone setup](plugins/account-pool-balanced/docs/external-clients.md). Both modes start with your own accounts; no credentials are distributed. Cursor additionally requires an operator-configured ACP provider and wrapper; see [Cursor routing](plugins/account-pool-balanced/docs/cursor-paths.md). Devin cloud sessions continue to use their separate API.

## Install

Version 0.4.13 adds VPN-only provider switches and recovery from temporary network/auth-edge failures. **Claude, Codex, Cursor and Devin require a fresh, trusted VPN status file by default**, including login and quota refresh. Configure the status writer before upgrading, or explicitly opt out for your deployment. See [VPN policy and recovery](plugins/account-pool-balanced/docs/vpn-policy.md).

Version 0.4.12 unifies account settings, control sizing and responsive spacing. Schedule intervals fit in one row; day presets keep custom weekdays out of the default view.

Version 0.4.11 adds project-specific account roles and restrictions, project-bound clients and isolated project routing. See [Project routing](plugins/account-pool-balanced/docs/project-routing.md).

Version 0.4.10 permits manual quota refresh for disabled accounts without enabling routing. New individual account settings are prefilled from global quota protection and reserve timing; disabling overrides preserves their saved values.

Version 0.4.9 adds a generic Cursor RPC gateway and a public launcher that keeps pooled login out of local Keychain. New methods in Cursor RPC namespaces no longer need a route-list update. See [Cursor setup](plugins/account-pool-balanced/docs/cursor-paths.md).

Version 0.4.8 saves individual account settings automatically and keeps the card open until changes are saved or explicitly discarded. It explains that use-until-exhaustion overrides quota protection while preserving the schedule.

Version 0.4.7 adds per-account quota protection, availability schedules and reserve activation overrides.

Version 0.4.5 adds a per-account **Use until exhausted** switch: bypass pool caps for one cycle, then automatically return to normal routing at the first exhausted provider quota. See [one-shot draining](plugins/account-pool-balanced/docs/drain-once.md).

Version 0.4.4 also displays saved Claude usage-limit resets and shows exact expiry times (including seconds, in Moscow time) for both Claude and Codex. See [saved resets](plugins/account-pool-balanced/docs/saved-resets.md) for availability and refresh behavior.

Install BB 0.43.1+ and Node/npm first. The release is checked with BB 0.43.3 and Node 22.

```sh
bb marketplace add git:https://github.com/itfarrier/bb-plugins@main
bb plugin install account-pool-balanced@itfarrier-public
```

Or install the release directly:

```sh
bb plugin install git:https://github.com/itfarrier/bb-plugins.git@^0.5.0 --subdirectory plugins/account-pool-balanced --tag-prefix account-pool-balanced/
```

Do not enable BB's built-in `account-pool` at the same time: both register `bb pool` and provider routes. These install commands are for new installations. BB 0.43.3 rejects replacing an existing plugin's Git source. If migrating from another repository, keep the existing installation until you have a supported migration procedure with verified backup and restore; do not remove a live pool just to change its source.

Add accounts through the pool settings in BB or run `bb pool --help`. For example, `bb pool account add --provider codex --login` starts a device login. Follow the returned instructions, then repeat to add another account. `bb pool status` shows the resulting pool. Browser login can be completed on a different device from the BB server.

Access from a computer or phone is provided by BB and its authenticated remote access. The plugin does not ship a separate mobile app. See [setup guidance](docs/setup.md).

## Use from Orca, terminals and other applications

BB is optional: run the standalone server, or connect external clients to accounts already managed by BB. Claude Code uses Messages; Codex uses Responses. Other clients must support the corresponding native protocol and a configurable base URL/token.

The [external-client quickstart](plugins/account-pool-balanced/docs/external-clients.md) includes copyable Claude/Codex commands, standalone installation, remote access and troubleshooting. No private launcher or custom Orca plugin is required. BB-routed Claude Code threads preserve Opus 5.5's 1M context automatically. For external Claude Code clients, select `claude-opus-5-5[1m]` to avoid the client's 200K context default. Client usage screens do not aggregate pool balances.

Project-specific account roles and restrictions are described in [Project routing](plugins/account-pool-balanced/docs/project-routing.md).

## Update

```sh
bb marketplace refresh itfarrier-public
bb plugin update account-pool-balanced
```

Settings and account material stay in your BB instance. Updating a running pool can interrupt active streams; choose an idle moment.

## Development

```sh
cd plugins/account-pool-balanced
npm ci
npm run typecheck
npm test -- src/balancer.test.ts src/store.test.ts src/server.test.ts app.test.tsx
bb plugin build .
```

CI runs all plugin tests, typechecks and builds on standard GitHub-hosted runners. The repository also checks manifests and scans Git history for secrets. Accounts or live subscriptions are not required for CI.

## License

MIT. Derives from [OXI-717/bb-plugins](https://github.com/OXI-717/bb-plugins) and `get-bb/bb`; upstream attribution is preserved in [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Automation Catalog

An independent panel for inventory, source freshness and execution history across schedulers. It does not execute jobs or invoke models. See [development and source setup](plugins/automation-catalog/README.md). Install through `bb plugin install automation-catalog@oxi-public`, or use the release command in its README.

Per-account quota protection and availability: [Account policies](plugins/account-pool-balanced/docs/account-policies.md).

### Updating an existing pool

From a checkout on the BB server host, use the same command for every release:

```sh
bash scripts/upgrade-pool.sh --sandbox
bash scripts/upgrade-pool.sh --check
bash scripts/upgrade-pool.sh
```

See [checks, waiting, backups and recovery](scripts/UPGRADE-POOL.md).
