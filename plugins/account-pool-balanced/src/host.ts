// The plugin's `bb.host` artifact. BB builds this into dist/host.js, ships it
// to every enrolled host, and runs it as the provider bridge for the agent
// providers this plugin registers. The pool's picker providers are ACP agents
// (OpenCode), so the bridge is the SDK's generic ACP bridge: the agent launch
// spec arrives per command in the registration's bridge options.
export { experimental_acpProviderBridge as experimental_providerBridge } from "@get-bb/plugin-sdk/provider-bridge/acp";
