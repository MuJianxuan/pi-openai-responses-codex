// pi-openai-responses-codex
//
// A standalone pi extension package that clones pi's built-in `openai-responses`
// transport into a self-contained, modifiable provider.
//
// Unlike `pi-openai-instructions-provider` (which *wraps* the built-in transport
// via `onPayload`), this package *vendors* the full transport pipeline under
// `src/transport/` + `src/utils/` so every layer — message conversion, stream
// processing, `buildParams`, client construction — is editable in place.
//
// The vendored transport is a faithful copy of
// `@earendil-works/pi-ai/dist/api/openai-responses.js` (and its dependency
// closure), adapted only to (a) import identity-stable core types from the
// public `@earendil-works/pi-ai` entry and (b) register the new provider id
// `openai-responses-codex` in the tool-call-providers set so multi-turn tool
// use behaves identically to the built-in `openai` provider.

import { getBuiltinModels } from "@earendil-works/pi-ai/providers/all";
import { streamSimple } from "./transport/openai-responses.js";

const PROVIDER_ID = "openai-responses-codex";
const API_ID = "openai-responses-codex";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

function readEnv(name, fallback) {
  const value = process.env[name];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function buildApiKeyConfig() {
  const envName = readEnv("PI_OPENAI_RESPONSES_CODEX_API_KEY_ENV", "OPENAI_API_KEY");
  return `$${envName}`;
}

// Reuse the built-in `openai` model catalog, filtered to the models that ship
// on the `openai-responses` transport. We deliberately OMIT `api` and `provider`
// from each model: the extension registry stamps `provider: PROVIDER_ID` and
// `api: modelDef.api || config.api`, so omitting `api` makes them inherit our
// `api: API_ID` and route to the vendored `streamSimple` below.
function selectModels() {
  const builtinModels = getBuiltinModels("openai");
  return builtinModels
    .filter((model) => model.api === "openai-responses")
    .map((model) => ({
      id: model.id,
      name: `${model.name} (codex)`,
      reasoning: model.reasoning,
      thinkingLevelMap: model.thinkingLevelMap,
      input: model.input,
      cost: model.cost,
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
      compat: model.compat,
    }));
}

export default function registerOpenAIResponsesCodexProvider(pi) {
  const models = selectModels();

  pi.registerProvider(PROVIDER_ID, {
    name: "OpenAI Responses (Codex)",
    baseUrl: readEnv("PI_OPENAI_RESPONSES_CODEX_BASE_URL", DEFAULT_BASE_URL),
    apiKey: buildApiKeyConfig(),
    api: API_ID,
    models,
    streamSimple,
  });
}
