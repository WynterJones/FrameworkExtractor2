# Framework Extractor (OverSkill MVP prototype)

Standalone, OverSkill-shaped port of the One2Many **Framework Extractor** module: a two-phase Creative Director interview that pulls a teachable framework out of an expert's head (Anchor → Origin Story → Hypothesis → Naming The Steps → Naming The Framework), then captures Story / Strategy / Tactics / Case Study per step and assembles a Framework Brief.

Local: `npm install && npm run dev` → http://localhost:8080
Checks: `npm run type-check && npm test && npm run build`
Deploy: Netlify site with base directory = this folder (`netlify.toml` included), or `npx netlify-cli deploy --prod --dir=dist`.

No backend. Data lives in localStorage (`src/lib/mock/entities.ts`), the Creative Director is a deterministic script (`src/lib/mock/interview.ts`). The production prompts are in `src/lib/framework/prompts.ts`, the `<fe-state>` contract in `src/lib/framework/protocol.ts`.

- `PROTOTYPE_BRIEF.md` — screen / entity / endpoint map (what is real, what is faked).
- `prd.md` — the product requirements document OverSkill rebuilds from.
- `handoff/` — first-build prompt and the ordered build messages for the OverSkill editor.
