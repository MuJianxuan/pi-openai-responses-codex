# pi-openai-responses-codex

A standalone, installable pi extension package that **clones pi's built-in
`openai-responses` transport** into a self-contained, modifiable provider.

> Faithful copy first — modify later. The vendored transport reproduces the
> built-in `openai-responses` behavior byte-for-behavior; nothing is rewritten,
> no `onPayload` trick is applied. You get the full transport pipeline as
> editable source so you can change any layer (message conversion, stream
> processing, `buildParams`, client construction) and publish independently.

## What it is

- **Provider id:** `openai-responses-codex` (new — coexists with the built-in
  `openai` / `openai-codex` providers, zero collision).
- **API id:** `openai-responses-codex` (distinct from `openai-responses` and
  `openai-codex-responses`).
- **Endpoint:** `https://api.openai.com/v1` (override via env).
- **Auth:** API key (`$OPENAI_API_KEY` by default; override the env var name).
- **Models:** reuses the built-in `openai` model catalog, filtered to the models
  that ship on the `openai-responses` transport (e.g. `gpt-5`, `gpt-5.1`,
  `o3`, …), each re-exposed under this provider with an `(codex)` name suffix.

## How it differs from the sibling packages

| Package | Approach |
|---|---|
| `pi-openai-responses-patcher` | Rewrites the built-in `pi-ai` file in place (fragile, breaks on upgrade). |
| `pi-openai-instructions-provider` | **Wraps** the built-in transport via `onPayload` — thin, but you can only touch the finalized payload. |
| **`pi-openai-responses-codex`** | **Vendors** the full transport pipeline as local source — every layer is editable, no patching, no built-in file modified. |

## Architecture

The package vendors the complete dependency closure of
`@earendil-works/pi-ai/dist/api/openai-responses.js`:

```
src/
  index.js                          # extension entry: registerProvider(...)
  transport/
    openai-responses.js             # transport: stream / streamSimple / buildParams / createClient
    openai-responses-shared.js      # message conversion + Responses SSE stream processing
    openai-prompt-cache.js          # prompt_cache_key clamping
    simple-options.js               # buildBaseOptions, maxTokens clamping
    github-copilot-headers.js       # copilot dynamic headers (faithful; inert for this provider)
    transform-messages.js           # context-message transformation
  utils/
    error-body.js                   # provider error normalization
    headers.js                      # Headers → record
    provider-env.js                 # env resolution (Bun-sandbox fallback)
    hash.js                         # shortHash
    sanitize-unicode.js             # unpaired-surrogate stripping
    estimate.js                     # context token estimation
```

**Import strategy.** pi-ai's `exports` map only exposes `./api/*`,
`./providers/*`, `./compat`, `./oauth` and the main entry. The transport's
stable, identity-critical core types (`AssistantMessageEventStream`,
`calculateCost`, `clampThinkingLevel`, `parseStreamingJson`) ARE re-exported by
the main entry, so those are imported from `@earendil-works/pi-ai` (keeping the
stream type identity-compatible with pi's consumer). Everything else the
transport depends on (`error-body`, `headers`, `provider-env`, `hash`,
`sanitize-unicode`, `estimate`) is **not** publicly exported, so it is vendored
verbatim under `src/utils/` — this is what makes the package self-contained
against the published `pi-ai` package.

**Adaptations made to the vendored copy** (the only deltas from a byte-for-byte
copy — everything else is verbatim):

1. `transport/openai-responses.js` and `transport/openai-responses-shared.js`
   rewire the three non-exported-core imports (`../models.js`,
   `../utils/event-stream.js`, `../utils/json-parse.js`) to
   `@earendil-works/pi-ai`.
2. `transport/openai-responses.js` adds `"openai-responses-codex"` to the
   `OPENAI_TOOL_CALL_PROVIDERS` set. This set gates the `call_id|item_id`
   two-part tool-call id convention; the built-in `openai` provider is in it,
   and our clone uses the same transport + same models, so it must be in it too
   — otherwise multi-turn tool use would corrupt tool-call ids on replay.

## Configuration (env)

| Variable | Default | Purpose |
|---|---|---|
| `PI_OPENAI_RESPONSES_CODEX_BASE_URL` | `https://api.openai.com/v1` | Override the API endpoint (e.g. a proxy/gateway). |
| `PI_OPENAI_RESPONSES_CODEX_API_KEY_ENV` | `OPENAI_API_KEY` | Name of the env var holding the API key. |

## Install

```bash
# from a local checkout
pi install ./pi-openai-responses-codex

# or, once published
pi install pi-openai-responses-codex
```

Then select a model from the new provider, e.g. `openai-responses-codex/gpt-5`.

## Local development

```bash
npm run check:syntax   # node --check on every source file
npm run pack:check     # npm pack --dry-run (verify published file set)
```

## Notes for future modification

- To change request shaping (instructions, `prompt_cache_key`, headers), edit
  `buildParams()` in `src/transport/openai-responses.js`.
- To change how Responses SSE events become content blocks, edit
  `processResponsesStream()` in `src/transport/openai-responses-shared.js`.
- To change how context messages map to Responses `input`, edit
  `convertResponsesMessages()` / `transform-messages.js`.
- The `github-copilot-headers.js` branch is inert for this provider
  (`model.provider === "github-copilot"` never matches) — kept for fidelity,
  safe to delete if you want to slim the copy.
