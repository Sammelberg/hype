---
name: case-study
description: Write or revise a project page (`/projekte/<slug>`) as a German case study for photo, film or design work — facts, rights, structure, Payload fields, alt texts. Use when a project is added, its text is written or improved, or its images are chosen and ordered.
---

# Case study

A project page shows prospective clients what working with the owner produced. The pictures carry the story; the text gives what they cannot show: the brief, the decisions, the conditions, the result. Everything is German, readers are addressed with „Sie“, and every claim is one the owner can back.

## Steps

1. **Collect the facts.** Ask the owner (for several open points, draft a questionnaire with `to-questionnaire` via `skill-router`): client and whether they may be named, the brief, the owner's exact role, team and partners, timeframe, where the work appeared, any feedback or result that can be shown. Fill gaps with a visible placeholder `[fehlt: …]`, never with invented clients, figures, quotes or awards. Done when every sentence you will write traces to an answer or a placeholder.
2. **Clear the rights.** Confirm, per image and clip: the client agreed to publication; recognisable people consented (KUG/DSGVO) or are not identifiable; music, fonts and third-party footage in a film are licensed for the web; buildings and artworks are covered (Panoramafreiheit only from public ground). Done when each item in `cover` and `gallery` is cleared or left out, and the owner has confirmed the open ones.
3. **Fill the Payload fields** (`src/cms/collections/Projects.ts`):
   - `title` — the project, not a slogan; `client` only with permission.
   - `summary` (≤ 280 characters) — what was made, for whom, in one or two plain sentences. It is the fallback page description for search results and link previews when the SEO tab is empty.
   - `role` — the owner's concrete part (Kamera, Regie, Schnitt, Colour Grading, Fotografie, Gestaltung, Entwicklung), not "verantwortlich für".
   - `year`, `tags` (medium and sector, e.g. „Imagefilm“, „Architektur“), `featured` only for work that should lead the homepage.
   - `cover` — the one frame that stands for the project; strong at small sizes and in the golden-ratio crop.
     Done when every required field is set and none holds a claim the facts do not support.
4. **Write `content`** as short sections under `h2` headings, in this order, dropping any the facts cannot fill:
   - **Ausgangslage** — the brief and what made it hard.
   - **Idee** or **Vorgehen** — the approach and the decisions behind it (look, light, location, rhythm, structure), each with its reason.
   - **Umsetzung** — the conditions: shooting days, team, equipment or technique only where they explain the result.
   - **Ergebnis** — what exists now and where it is used; figures and feedback only when proven (quote status as in `copywriting-de`).
     Then run the text through `copywriting-de` and `vermenschlichen`. Done when each section is a few short paragraphs and every factual sentence traces to step 1.
5. **Order the gallery as a sequence**, not a pile: establishing image, details, people at work or behind the scenes, the strongest frame last. Done when the order reads as the project's arc.
6. **Write alt texts** in German in the `alt` field of each Media item used as `cover` or in `gallery`: what the image shows and why it is in the story, one sentence, no „Bild von“. Done when no image has an empty or file-name alt.
7. **Check the page** in the running app: the summary reads well as a search snippet, images load in order without layout shift, and `pnpm test:e2e` still passes for the project's route. Done when the Definition of done in CLAUDE.md holds.
