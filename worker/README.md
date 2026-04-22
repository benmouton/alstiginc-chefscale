# ChefScale API — Cloudflare Worker

Replacement for `chef-scale.replit.app`, living at `api.chefscale.alstiginc.com`.

Part of [ALS-24](/ALS/issues/ALS-24) Phase 2 pilot (pattern replay of MC Phase 1).

## Endpoints (parity with Replit version)

- `POST /api/ocr-recipe` — GPT-4o vision OCR for recipe images
- `POST /api/parse-recipe-text` — GPT-4o parse for pre-extracted OCR text
- `POST /api/validate-recipe` — GPT-4o recipe validation + suggestions
- `POST /api/parse-price` — GPT-4o-mini freetext-price → structured cost
- `GET /health` — liveness check

## Local dev

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars  # fill in OPENAI_API_KEY
npm run dev
```

## Deploy

```bash
# one-time secret setup
wrangler secret put OPENAI_API_KEY --name chefscale-api
# (optional) wrangler secret put AI_GATEWAY_BASE_URL --name chefscale-api

# deploy
npm run deploy
```

## Notes

- Prompts in `src/prompts.ts` locked to byte-for-byte parity with `alstiginc-chefscale/server/routes.ts`. Parity test enforces shape.
- OpenAI calls optionally route through Cloudflare AI Gateway via `AI_GATEWAY_BASE_URL`.
- Two model tiers: `OPENAI_MODEL_HEAVY` (gpt-4o) for vision + full recipe parse; `OPENAI_MODEL_LIGHT` (gpt-4o-mini) for price parsing.
- CS still calls `restaurantai.consulting` for price-lookup (see `PRICE_API_BASE` in the mobile app) — that belongs to TRC and stays on Replit until Phase 5.
