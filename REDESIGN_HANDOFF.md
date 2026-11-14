# Redesign handoff

This delivery replaces the original interface rather than layering another recolor on top. All active screens use the new shell and visual system. Obsolete screens, duplicate CSS and procedural body models were removed from the clean source tree; the originally uploaded application remains preserved separately.

## Product and design changes

A forest sidebar and mint/paper visual language establish a consistent workspace. Home now prioritizes personal status, daily tasks, the individual's baseline, alerts and care connections. The health dashboard offers readable scales, baseline bands, metric detail and hazard filters. New focused task flows handle check-in, PVT, exercise logging and medical documentation. Crew switching, local records and alert actions are persisted and scoped per profile. Search and reduced-motion settings work from the shared shell.

## GLB integration

No model was generated or bundled. Add `public/models/body.glb` or set `VITE_BODY_MODEL_URL`. The asset adapter validates the GLB and loads the Three.js renderer only when an asset is available. Orbit/zoom and automatic framing are included. System links remain usable while the model is absent. Your model's mesh/node-specific highlighting can be added later in `GLBRenderer.tsx`; the current context views do not imply anatomical mesh selection.

## Confirmed issues corrected during review

Page CSS is isolated with `@scope`, preventing lazy-route styling from changing Home or shared dialogs. Snoozed and dismissed alerts now leave the overview and navigation count. The PVT elapsed timer is independent of stimulus timers, including after an early tap; active trials accept keyboard responses. Check-in drafts restore per crew member. Support queues react to crew switching and exclude medical-report JSON. Other-symptom descriptions are required. Exercise history distinguishes partial/completed sessions and records selected equipment. A phone check-in width overflow and chart inset clipping were corrected.

## Demonstration boundaries

Vitals, mission details, personal baselines, confidence percentages, conditioning scores, thresholds and advisory patterns are static illustrative data. Crew profiles share that vital dataset. Notes and reports are browser-local, never real transmissions. No medical approval, clinician availability, clinical diagnosis or guaranteed reply is claimed. LocalStorage is not encrypted clinical storage, and real patient information should not be entered.

## Development

`npm ci`, `npm run dev` (port3000), `npm run build`, `npm run lint`. Use modern browsers supporting CSS `@scope`. See README for architecture, model configuration and hosting details. Diagnostic scripts are under `_technical_support/redesign/`; screenshots are excluded from the saved source checkpoint.
