# Second Chair: handoff for GitHub Copilot

## Apply
1. Copy `src/` from this folder over the repo. Delete `src/App.css`, `src/index.css`, `src/assets/hero.png`, `src/assets/react.svg` (unused).
2. `npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/kumbh-sans`
3. Do NOT import `styles/globals.css` or `styles/animations.css`. `styles/stowage.css` is the design system; it aliases the old `--sc-*` variables so existing utils keep working.
4. `tsc -b` and `vite build` pass on this state. Done so far: design system, shell, Today, Body lab (Human-Atlas 3D anatomy models — male / female / leg muscles with a switcher; replaces the old procedural figure).

## Rules for every page you write (so it matches)
- Use only tokens in `stowage.css` (`--panel`, `--ink`, `--cobalt`, `--tape`, `--mint`, `--flag`). Both lighting modes must work: test with "Dim the lights".
- Reuse patterns: `.strip` (row with colored tab), `.sheet` (layer button), `.window` (segmented control), `.info` (side panel). Add new classes to `stowage.css`; never inline colors.
- No emoji icons, no glass/blur/gradients, no all-caps labels, no "Trains X" claims. Sentence case. Buttons say what happens ("Start review", "Send to crew").
- Motion only in response to a click. Respect `prefers-reduced-motion`. Visible focus. Keyboard-operable.
- All state in the existing zustand stores. Nothing leaves the device.

## Tasks (in order; each ends when its acceptance line is true)
1. **Drills** (`src/pages/Drills.tsx`, route `/drills`). Player for `MEDICAL_MODULES[].scenarios`. Per step: narrative, question, options. After a choice show feedback, then a simulated "Ground replies in 18 min" line that appears at the end of the scenario and may differ from the crew's choice; end with a debrief listing each choice and its feedback. Call `markModuleComplete`, `addQuizAttempt`. *Accept:* finish `cpr-scenario-1` start to end, and it appears in progress.
2. **Academy** (`/academy`). Modules grouped with `getModulesByCategory`; review mode shows `skill.question`, reveals answer + explanation, then self-rate 0–5 into `updateSkillAfterReview`. Show retention with `skillDecay` helpers (text label + bar, not color alone). *Accept:* the "Refresh" count on Today drops after a review.
3. **Crew table** (`/crew`). Daily question (`getDailyQuestion`) with a private journal (`addJournalEntry`), plus ONE two-window co-op puzzle over `BroadcastChannel`: each window sees half the clues; rotate the partner by day. No scores, no leaderboard. *Accept:* two tabs solve it together.
4. **Quiet room** (`/quiet`). Dims the lights automatically, slow breathing circle (CSS only), a timer that ends on its own, no score. *Accept:* nothing prompts the user for 5 minutes.
5. **Sleep guard.** After 22:00 or before 05:00 (already in Today) show a one-line banner on Drills/Academy/Crew table suggesting the Quiet room; never block.
6. **Content audit (important for credibility).** In `anatomyData.ts` and `medicalModules.ts` add a `source: string` field per claim. Remove or cite every unsourced number (examples to verify: "wounds heal ~60% slower", "back pain ~50%", "space motion sickness 60–80%", "heart loses ~9% of mass", "1–2% bone loss per month", "soleus up to 30%"). Add a fixed banner on Academy/Drills: "Training use only. Follow official procedures in a real emergency." No treatment instructions beyond cited, public sources.
7. **Mind Gym** is cut as a section. If time remains, fold one warm-up into Crew table. Reword copy: no "trains working memory".
8. **Crew data.** In `crewStore.ts` replace emoji avatars with two-letter initials in a `.tab`-style patch; rename placeholder crew.
9. **Offline.** Add `vite-plugin-pwa`; precache app shell and fonts; test in airplane mode.
10. **Accessibility.** In Body lab add a visible `<ul>` of structures in the active layer as an alternative to clicking the 3D model; check contrast in both lighting modes.
11. **Tests.** Vitest for `skillDecay` and `progressStore`; one Playwright smoke test per route.
12. **Submission.** README (what is real vs simulated, what it will not do), 3-minute demo script, and license notes.

## Known limits (say them out loud in the demo)
- The body view shows real open anatomical reference models (BodyParts3D / Human Reference Atlas, CC BY 4.0 — see ATTRIBUTION.md), but coverage is not complete: the female set borrows 180 male bones and 76 donor leg muscles, both labelled as such in the interface.
- Mission day, crew, and "ground reply" are simulated. Skill-decay parameters are assumptions, not spaceflight-validated.
- Learning and well-being benefits are not evaluated. Do not claim any.

## Design pass (latest)

Applied on top of the state above. Build, `tsc -b`, `oxlint` and a Playwright route sweep (mobile 390×844 and desktop 1440×900) are green.

- **New layer:** `src/styles/aura-refine.css` (imported last in `main.tsx`). Tokens for line, shadow and background wash; classes `.rf-page`, `.rf-card`, `.rf-tile`, `.rf-pill`, `.rf-hazard`, `.rf-seg`, `.rf-chips`, `.rf-alert`, `.rf-advisory`, `.rf-hero`, `.rf-sheet`.
- **Components:** `Sparkline` (banded 14-day trend) and `StatusPill` (colour + dot + word). `MetricCard` now shows value, delta with direction, sparkline, status and confidence.
- **No model downloads:** `BodyScene` no longer calls `useGLTF`. Skeletal and muscular layers are procedural capsules with hover/pick. This removed a 404 + JSON parse error on `/dashboard` (body tab).
- **Home:** removed the wave emoji, solid hero card, 2×2 vitals grid (no clipped scroll rows), 3-column task grid with working routes, care team card, tip card.
- **Dashboard:** hazard filters, segmented control, corrected blood pressure (`118/76`), plausible VO₂ max (41.8), status pills on system rows.
- **Alerts:** two explicit lanes. Official cards show rule id, observed value, threshold and action; advisory cards are dashed and labelled "Advisory only" with a confidence bar. Acknowledge and dismiss work.
- **System detail:** neutral ring colour (amber only when below plan), hazard chips, linked actions, education card with a source caveat.
- **Exercise:** palette-consistent hero, copy fixed ("4 sets × 8 reps · 70–80% 1RM · RPE 7"), working session runner with timer and set tracking, volume-load chart with plan note, week plan and history.
- **Check-in:** removed dead pills (PVT/PSAM/Symptoms), save persists to `localStorage`, tests moved to their own section.
- **Medical event:** flat 2D body map (keyboard operable) plus chips; the map selection feeds the wizard.
- **Header:** settings sheet with crew switcher and motion toggle (profile and gear both open it).
- **Desktop:** content capped at 1080px, nav capped at 760px, focus flows capped at 560px.

Still open from the original task list: Vitest/Playwright test files, PWA offline caching, the Academy/Drills/Crew table/Quiet room routes, and the content source audit for `anatomyData.ts` and `medicalModules.ts`.

## Backend wiring (frontend side)

- `vite.config.ts`: `/api` proxies to `AURA_API_TARGET` (default `http://127.0.0.1:8000`) in dev and preview.
- `src/api/contract.ts`, `client.ts` (typed fetch, 4 s timeout), `adapters.ts` (Tier 0 -> official `rule` alerts only; Tier 1 notices and Tier 2 risk -> `advisory`).
- `src/stores/auraStore.ts` (live / fallback / loading), `src/hooks/useAura.ts` (`useAuraSync`, `useAlerts`, `useRisk`, `useForecast`).
- `src/data/fallbackSnapshot.ts`: original demo alerts plus static forecast and risk when the backend is unreachable.
- UI: `SimulatedBanner`, `RiskCard`, `ForecastPanel` on Dashboard; banner on Alerts.
- The backend lives at https://github.com/eyadwebdeveloper/backend (deployed at https://eyad1ashraff.pythonanywhere.com). It contains a local Python HTTP server, the AURA runtime copy, and snapshot export. It runs the simulator/models once at startup and serves cached snapshots matching `contract.ts`; the first start takes about 10-30 seconds. The demo crew IDs map to virtual astronaut IDs.
- Start the backend with `cd ../backend/aura_ai_kit; python -m pip install -r requirements.txt; cd ..; python server.py`, wait for its ready message, then run Vite. Full steps are in the backend repository README (https://github.com/eyadwebdeveloper/backend).
- Checks: `_technical_support/aura-integration/` (`proxy_check.sh`, `run_adapter_test.sh`, `mock_backend.py`, `test_integration.py` needs Chromium).
