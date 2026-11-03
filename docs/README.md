# Docs — Garge frontend (`garge-app`)

**Compliance & governance docs** (Records of Processing / DPIA / Legitimate Interest Assessment) live in the **`garge` umbrella repo** at [`docs/compliance/`](https://github.com/sondresjolyst/garge/tree/main/docs/compliance) — they describe processing across all services, so they are maintained centrally.

**User-facing legal pages** stay in this repo (they are rendered pages, not documents):
- Privacy policy — `src/app/privacy/page.tsx`
- Terms — `src/app/terms/page.tsx`
- Cookie policy — `src/app/cookies/`

**Printable manual** is `docs/manual/garge-manual.html`, with its images in `public/help/`. Edit the HTML and run `docs/manual/render.sh` to write `public/garge-manual.pdf`. To print from a browser, use A4, margins None and Background graphics on.

When a change here alters data processing (new field, retention, lawful basis, sub-processor), update the relevant doc in the umbrella repo in the same change-set — see its `docs/compliance/README.md` checklist.
