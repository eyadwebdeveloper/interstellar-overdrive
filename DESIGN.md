# AURA — Orbital care

The confirmed blueprint is implemented as a fresh clinical-editorial workspace. It retains the original calm health-app intent while replacing the lavender mobile-only shell, stacked cards, fonts, navigation and screen composition.

## Identity

AURA is personal health support for people far from Earth: composed, human and precise. The signature colour is orbital mint (#c1ebc9), anchored by deep forest (#173c35), warm paper (#f7f8f3) and ink (#20342e). Status colours are reserved for actual status and always paired with words. A custom orbit/cross mark and spaced lowercase wordmark establish a quiet, ownable identity.

## Layout and interaction

A forest sidebar anchors desktop navigation. The light workspace uses asymmetrical main-content and context columns, not a stretched mobile layout. A slim utility header holds search and crew selection. Mobile uses a compact header and bottom navigation. Oversized headings contrast with small uppercase clinical labels, structured chart panels and generous negative space. Cards use restrained 18–24px corners, thin warm-grey borders and almost no shadows.

Use Bricolage Grotesque for display headings and Atkinson Hyperlegible for UI text and numbers. Transitions are 150–220ms; reduced motion disables nonessential movement. Modal dialogs trap focus, support Escape, restore focus and prevent background interaction. Destructive/dismissal decisions remain reversible when feasible.

All clinical data and communication queues are demo data. Baseline changes are informational rather than diagnoses. Official rule cards and pattern advisories must remain distinct. No asset generation is needed for this internal dashboard; the existing visual health-app reference guides tone. A small external search reference set was inspected for navigation density, not copied or embedded. No external health factual claims are added.

## Code structure

`components/ui` owns reusable page headers, badges, icons, avatar, dialogs, charts and panels. `components/AppShell.tsx` owns responsive navigation, search and settings. `pages` owns the individual product workflows. `stores/appStore.ts` owns persistent demo acknowledgements, check-ins and session logs keyed by crew. `components/body` owns the optional GLB stage. `styles/design-system.css` owns all new tokens and shared primitives; page-specific styles live separately. The React/Vite application remains static and uses hash routing for source portability.
