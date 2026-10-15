import { describe, expect, it } from "vitest";
import {
  COMPATIBLE_ENV_SUMMARY,
  COMPATIBLE_PROVIDER_IDS,
  COMPATIBLE_PROVIDERS,
  compatibleProvider,
  parseEnvFile,
  scanCompatibleProviderKeys,
} from "./compatible-providers.js";

describe("compatible providers registry", () => {
  it("keeps ids unique and aligned with the definition list", () => {
    expect(new Set(COMPATIBLE_PROVIDER_IDS).size).toBe(
      COMPATIBLE_PROVIDER_IDS.length,
    );
    expect(COMPATIBLE_PROVIDERS.map((definition) => definition.id)).toEqual([
      ...COMPATIBLE_PROVIDER_IDS,
    ]);
  });

  it("looks providers up by id and returns null for unknown ones", () => {
    expect(compatibleProvider("openrouter")?.title).toBe("OpenRouter");
    expect(compatibleProvider("claude")).toBeNull();
    expect(compatibleProvider("nope")).toBeNull();
  });

  it("scans one account per present key, in registry order", () => {
    const found = scanCompatibleProviderKeys({
      GROQ_API_KEY: "gsk_one",
      OPENCODE_API_KEY: "oc_first",
      OPENCODE_API_KEY_2: "oc_second",
      NVIDIA_API_KEY: "   ",
      UNRELATED: "value",
    });
    expect(
      found.map((entry) => [entry.definition.id, entry.envName] as const),
    ).toEqual([
      ["groq", "GROQ_API_KEY"],
      ["opencode", "OPENCODE_API_KEY"],
      ["opencode", "OPENCODE_API_KEY_2"],
    ]);
    expect(found.map((entry) => entry.apiKey)).toEqual([
      "gsk_one",
      "oc_first",
      "oc_second",
    ]);
  });

  it("returns no accounts when no known keys are present", () => {
    expect(scanCompatibleProviderKeys({})).toEqual([]);
  });

  it("lists every scanned environment variable for diagnostics", () => {
    const listed = COMPATIBLE_ENV_SUMMARY.split(/,\s*/u);
    for (const definition of COMPATIBLE_PROVIDERS) {
      for (const envName of definition.keyEnvs) {
        expect(listed).toContain(envName);
      }
    }
  });

  it("builds the Cloudflare URL from the account id env", () => {
    const cloudflare = compatibleProvider("cloudflare");
    expect(cloudflare).not.toBeNull();
    expect(
      cloudflare!.defaultBaseUrl({
        CLOUDFLARE_ACCOUNT_ID: "abc123",
      }),
    ).toBe("https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1");
  });
});

describe("parseEnvFile", () => {
  it("parses plain, quoted, exported, and commented lines", () => {
    expect(
      parseEnvFile(
        [
          "# comment",
          "",
          "PLAIN=value",
          'export QUOTED="quoted value"',
          "SINGLE='single'",
          "TRAILING=value # trailing comment",
          "URL=https://api.example.com/v1",
          "not a line",
        ].join("\n"),
      ),
    ).toEqual({
      PLAIN: "value",
      QUOTED: "quoted value",
      SINGLE: "single",
      TRAILING: "value",
      URL: "https://api.example.com/v1",
    });
  });

  it("keeps hash characters inside quoted values", () => {
    expect(parseEnvFile('KEY="a#b"')).toEqual({ KEY: "a#b" });
  });

  it("feeds parsed keys into the scanner like real environment variables", () => {
    const parsed = parseEnvFile("GROQ_API_KEY=gsk_test");
    const found = scanCompatibleProviderKeys(parsed);
    expect(found).toHaveLength(1);
    expect(found[0]?.definition.id).toBe("groq");
    expect(found[0]?.apiKey).toBe("gsk_test");
  });
});
