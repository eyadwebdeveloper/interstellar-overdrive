# Redesign validation

Validated the integrated application on 13 November 2026.

## Passed

- Clean npm dependency installation, TypeScript compilation and production Vite build.
- Desktop and390px phone checks of all11 route patterns/examples; no page runtime errors. The detected check-in horizontal overflow was fixed and the affected phone layout rechecked.
- Search and Escape dismissal.
- Alert snoozing removes the overview/navigation open count; changing crew keeps the action scoped to the original profile.
- Check-in draft restoration after reload, review and final local save.
- Explicit partial exercise session save and recorded history.
- Support composition, local queue save and reactive queue switching between crew profiles.
- Medical event Other-symptom validation, correctly displayed blood pressure, review, local save, and isolation from the support-note queue.
- Metric detail dialog and Escape closure.
- Full three-minute PVT completion after an early/false-start tap and a keyboard response; no page errors across targeted workflows.

The integration test is `_technical_support/redesign/test_flows.py`. Its clock advances three minutes of browser time; the repaired elapsed clock completes even when a false start reschedules the stimulus.

## Known, intentional limits

A supplied GLB is not yet present, so its anatomical fidelity/mesh-specific behavior is not verified. The defensive asset adapter and missing-asset state are implemented. The Three.js renderer remains a separate lazy chunk. Static vitals, thresholds, personal baselines, confidence and advisory patterns are demonstration data. There is no clinical backend or live communication.

Oxlint reports no errors and one non-blocking React compiler optimization warning for restoring the crew-specific check-in draft state in an effect. The production build notes the size of the optional GLB renderer chunk; it is not loaded by the normal health dashboard until an asset is available.
