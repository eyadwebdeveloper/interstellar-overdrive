# AURA — AstroVitals

A redesigned, local-first health workspace prototype for astronaut crews. The new interface uses a deep forest sidebar, warm paper surfaces, mint highlights, editorial typography, responsive layouts, focused task flows, gentle Framer Motion transitions and a built-in simple Three.js body figure. This is an interactive demonstration, not a connected clinical system.

## Run

Use Node.js 22.12+ (Node.js 24 recommended).

```bash
npm ci
npm run dev       # http://localhost:3000
npm run build     # TypeScript checks + production output in dist/
npm run preview   # Preview the production build
npm run lint      # oxlint
```

The app uses hash routing, so it can run on static hosting without server-side route rewrites. Example: `http://localhost:3000/#/dashboard`.

## Redesigned experiences

The overview brings together personal signals, a baseline chart, daily tasks, official alert review, body-system context and care links. My Health includes metric detail dialogs, confidence/update metadata, seven- and fourteen-day demo views, hazard filters and system detail. Alerts separates transparent rule notices from advisory patterns and reminders. Check-in includes a four-step flow, crew-specific draft restoration, exact sleep hours/minutes and saved summaries. Exercise includes equipment context, timers, pause/resume, sets, RPE and completed/partial records. The focused three-minute PVT measures browser reaction time, handles early taps and ≥500 ms lapses, and cancels on interruption. Support saves clearly simulated notes locally. Medical Event is a validated multi-step documentation flow with review and JSON export.

Search opens with the header control or Ctrl/Cmd+K. The profile dialog switches crew members and controls reduced motion. Keyboard focus, dialog focus trapping, Escape, visible focus indicators and mobile navigation are included.

## Training room — health-concept games

A "Training room" section (sidebar, search and the overview's context column) adds four short educational games that rehearse space-health concepts. Each game explains itself as it goes, keeps a best score per crew member in localStorage, and is reachable from `#/games`:

- **Fuel the crew** (`#/games/fuel`) — match six rations to the body system that needs them: calcium/vitamin D for unloading bone, iron for red-cell shifts, sodium/potassium for fluid balance, protein for muscle, omega-3s and antioxidants for immune and cell protection. Every pairing explains why it works.
- **Load bearing** (`#/games/load`) — plan twelve mission weeks of countermeasures on a tight budget of crew time across resistance, cardio and recovery. Bone, muscle, fitness and fatigue respond with different sensitivities; overtraining halves your gains, and mission events (cargo weeks, doubled EVAs, a solar particle event) bend the plan. The end summary compares your block against a no-countermeasures twin and quotes the real rates.
- **Keep the clock** (`#/games/clock`) — build one orbital day from seven decisions on light, caffeine, training slot, meals, schedule pressure, evening light and the sleep window. A 24-hour dial fills with your choices, an alignment meter tracks rhythm points, and a projected melatonin curve shows what the day does to the night.
- **Fact from fiction** (`#/games/facts`) — twelve myth-or-fact claims about the body in space (spinal elongation, fluid shift, SANS, ALARA, caffeine half-life, the sixteen-sunrise problem), each with the true explanation and a full review at the end.

Game mechanics are illustrative and labelled as such inside the games; figures quoted in the summaries (about 1–1.5% bone loss per month without countermeasures, roughly two hours of daily exercise on orbit, caffeine's ~5-hour half-life, sixteen sunrises per day) reflect public space-life-science findings. Games use the same tokens, panels and buttons as the rest of the redesign, respect the reduced-motion setting, and store results through `src/stores/appStore.ts` alongside the other workflows.

## Body view — Human-Atlas anatomy models

The body view shows the real Human-Atlas 3D anatomy models (not a schematic figure): the male BodyParts3D body, the female Human Reference Atlas body, and the Visible Human Female leg-muscle set. All three are interchangeable in the Body view (`#/body`) through the segmented control above the viewport, and the dashboard's body tab and each system page carry the same atlas.

The models stream as binary chunks (gzip, ~70 MB total across the three sets, loaded on demand per visible system), mount as zero-copy typed-array views, and render at a handful of draw calls while every one of the thousands of structures stays individually addressable. Interactions: drag to orbit, scroll or pinch to zoom, hover a structure for its name and system, tap a structure to bring its body system forward. The systems index beside the viewport lights the same region up on hover or keyboard focus.

`src/components/body/anatomyEngine.ts` holds the 3D engine; `src/components/body/AtlasBodyScene.tsx` maps the four workspace systems onto atlas systems; `src/lib/anatomy/` loads and lays out the model data. The geometry files live in `public/models/` (manifests plus `.bin.gz` chunks; the plain `.bin` twins of the original repository are not shipped — the runtime uses `DecompressionStream`, and browsers without it fall back to the systems index gracefully). Model data credits and licences: see `ATTRIBUTION.md`.

## Persistence and simulation boundaries

Crew-scoped check-ins, exercise records, PVT results, support notes and alert actions are stored in this browser's localStorage. Check-in drafts are also restored per crew member. Medical reports are separate recipient-labelled local queue entries and do not appear in Support's note list. Profile and motion preferences persist locally.

Vital values, baselines, chart series, conditioning scores, mission details, rule thresholds and confidence percentages are illustrative demo data. Crew profiles share the demo vital dataset. The indicated Earth delay is simulated: nothing is sent, delivered or monitored. Advisory patterns are static examples, not a live AI service. No clinician availability or treatment approval is claimed.

LocalStorage is not encrypted clinical storage. Do not enter real patient data. There is no server, authentication, telemetry feed, real communication link or clinical decision engine in this delivery.

## Source structure

- `src/components/AppShell.tsx`: responsive navigation, global search, crew settings.
- `src/components/ui/`: shared accessible primitives and charts.
- `src/components/motion.tsx`: shared Framer Motion helpers; every animation is gated by the in-app reduce-motion preference and the OS setting.
- `src/pages/`: the redesigned route screens.
- `src/pages/GamesHub.tsx` and `src/pages/games/`: the training-room games (hub, Fuel, Load, Clock, Facts) plus shared parts.
- `src/styles/games.css`: scoped training-room styles.
- `src/data/gamesData.ts`: the games' educational content and tuning constants.
- `src/components/body/`: the Human-Atlas 3D anatomy engine, the atlas scene, and the viewport container with error fallback.
- `src/styles/design-system.css`: shared tokens/layout; page styles use CSS `@scope` to prevent cross-route collisions.
- `src/stores/`: persistent crew, preference and workflow state.
- `src/data/vitalsData.ts`: clearly simulated product data.
- `_technical_support/redesign/`: implementation checks and diagnostic evidence.

Use current Chrome, Edge, Safari or Firefox with CSS `@scope` support. The original uploaded app was kept separately; obsolete screens and styling are not part of this clean redesign.
