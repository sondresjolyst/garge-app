# Docs — Garge frontend (`garge-app`)

**Compliance & governance docs** (Records of Processing / DPIA / Legitimate Interest Assessment) live in the **`garge` umbrella repo** at [`docs/compliance/`](https://github.com/sondresjolyst/garge/tree/main/docs/compliance) — they describe processing across all services, so they are maintained centrally.

**User-facing legal pages** stay in this repo (they are rendered pages, not documents):
- Privacy policy — `src/app/privacy/page.tsx`
- Terms — `src/app/terms/page.tsx`
- Cookie policy — `src/app/cookies/`

When a change here alters data processing (new field, retention, lawful basis, sub-processor), update the relevant doc in the umbrella repo in the same change-set — see its `docs/compliance/README.md` checklist.
