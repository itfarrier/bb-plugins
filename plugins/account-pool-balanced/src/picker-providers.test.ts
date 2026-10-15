import { describe, expect, it } from "vitest";
import {
  PICKER_PROVIDER_DEFS,
  desiredPickerProviders,
  modelIdsFromCatalog,
  opencodeConfigContent,
  pickerFallbackModels,
} from "./picker-providers.js";

describe("picker providers", () => {
  it("gives every definition a unique picker id and matching pool provider", () => {
    const ids = PICKER_PROVIDER_DEFS.map((definition) => definition.pickerId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const definition of PICKER_PROVIDER_DEFS) {
      expect(definition.pickerId).toBe(`pool-${definition.provider}`);
      expect(definition.pickerId).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  it("selects only providers that are enabled with accounts", () => {
    const enabled = new Set(["openrouter", "groq"]);
    expect(
      desiredPickerProviders(enabled).map((definition) => definition.pickerId),
    ).toEqual(["pool-openrouter", "pool-groq"]);
    expect(desiredPickerProviders(new Set())).toEqual([]);
  });

  it("builds inline OpenCode config referencing the injected env vars", () => {
    const definition = PICKER_PROVIDER_DEFS.find(
      (entry) => entry.pickerId === "pool-openrouter",
    )!;
    const parsed = JSON.parse(
      opencodeConfigContent(definition, ["openai/gpt-4o-mini", "z-ai/glm-4.6"]),
    );
    const entry = parsed.provider["pool-openrouter"];
    expect(entry.npm).toBe("@ai-sdk/openai-compatible");
    expect(entry.options.apiKey).toBe("{env:OPENROUTER_API_KEY}");
    expect(entry.options.baseURL).toBe("{env:OXI_OPENROUTER_BASE_URL}");
    expect(Object.keys(entry.models)).toEqual([
      "openai/gpt-4o-mini",
      "z-ai/glm-4.6",
    ]);
  });

  it("falls back to a default model entry when the catalog is empty", () => {
    const definition = PICKER_PROVIDER_DEFS.find(
      (entry) => entry.pickerId === "pool-groq",
    )!;
    const parsed = JSON.parse(opencodeConfigContent(definition, []));
    expect(Object.keys(parsed.provider["pool-groq"].models)).toEqual([
      "default",
    ]);
  });

  it("marks exactly one fallback model as default and caps the ladder", () => {
    const definition = PICKER_PROVIDER_DEFS[0];
    const fallbacks = pickerFallbackModels(
      definition,
      Array.from({ length: 80 }, (_, index) => `model-${index}`),
    );
    expect(fallbacks).toHaveLength(50);
    expect(fallbacks.filter((model) => model.isDefault)).toHaveLength(1);
    expect(fallbacks[0]?.isDefault).toBe(true);
    expect(fallbacks[0]?.supportedReasoningEfforts.length).toBeGreaterThan(0);
  });

  it("extracts model ids from a hub /models response", () => {
    expect(
      modelIdsFromCatalog({
        data: [{ id: "a" }, { id: "b" }, { nope: true }, "junk"],
      }),
    ).toEqual(["a", "b"]);
    expect(modelIdsFromCatalog(null)).toEqual([]);
    expect(modelIdsFromCatalog({ error: {} })).toEqual([]);
  });
});
