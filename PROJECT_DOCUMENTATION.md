# AURA AstroVitals
## Project Documentation

### 1. Project Overview

AURA AstroVitals is a local-first web prototype for an astronaut crew health
workspace. It brings health metrics, daily check-ins, exercise, alerts, crew
profiles, educational games, and an interactive anatomy view into one
responsive interface.

The application is intended for demonstration and education. It is not a
clinical product and does not provide diagnosis, treatment recommendations,
real-time astronaut monitoring, or communication with clinicians.

### 2. Project Goals

- Present health-related information in a clear, accessible dashboard.
- Provide interactive workflows for check-ins, exercise, and medical-event
  documentation.
- Demonstrate a typed API connection to simulated health-model output.
- Continue to work with built-in sample data when the API is unavailable.
- Keep demo data local to the browser wherever possible.

### 3. Main Features

- **Overview and health dashboard:** sample vital metrics, personal ranges,
  trends, daily tasks, alerts, and body-system summaries.
- **Crew directory:** four demo profiles with profile-specific workflows.
- **Check-in and exercise:** guided check-ins, plans, session tracking, and
  locally saved records.
- **Alerts:** separates rule-based alerts from advisory patterns and reminders.
- **Body view:** interactive 3D anatomy models with system navigation.
- **Training room:** short educational games about nutrition, exercise,
  circadian rhythms, and space-health concepts.
- **Support and medical event workflows:** local demo notes and structured
  incident documentation.
- **Responsive navigation and accessibility:** keyboard navigation, focus
  styles, dialogs, reduced-motion support, and mobile navigation.

### 4. Technology

- React 19 and TypeScript
- Vite 8
- React Router using hash-based routes
- Zustand for application state and browser persistence
- Three.js for the anatomy viewer
- Framer Motion for transitions
- Python simulation and machine-learning pipeline for optional API snapshots

### 5. Application Architecture

The React application is served as a static single-page application. Hash-based
routes allow static hosting without server-side page rewrites.

The front end requests simulated snapshots through the API client in
`src/api/client.ts`. Responses are checked against the types and validators in
`src/api/contract.ts` and `src/api/adapters.ts`. The AURA store in
`src/stores/auraStore.ts` tracks loading, live, and fallback states. If the
backend is unavailable or returns invalid data, the application uses the
built-in snapshot data in `src/data/fallbackSnapshot.ts`.

The Python backend lives in its own repository, https://github.com/eyadwebdeveloper/backend (folder `backend/`). It is deployed on PythonAnywhere at https://eyad1ashraff.pythonanywhere.com. It runs the simulator and models once, then serves cached JSON snapshots. For local development it can also run with `python server.py` on `127.0.0.1:8000`.

### 6. API

The backend exposes these read-only endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Reports that the simulated API is ready. |
| `GET` | `/api/astronauts/{crewId}/snapshot` | Returns a simulated snapshot for `cmdr`, `med`, `eng`, or `sci`. |

Only Tier 0 rule alerts are presented as official alerts. Tier 1 notices and
Tier 2 risk/forecast data are advisory.

### 7. Running Locally

Requirements:

- Node.js 22.12 or later (Node.js 24 recommended)
- Python 3.10 or later

From the `wired-demo` directory, install the Python dependencies and start the
backend:

```powershell
cd backend\aura_ai_kit
python -m pip install -r requirements.txt
cd ..
python server.py
```

The backend runs the models at startup. The first run may take 10–30 seconds.
Wait for the message indicating that the API is ready.

In a second terminal, start the website:

```powershell
cd aura-astrovitals_interstellar-overdrive
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:3000`). Vite
forwards local `/api` requests to `http://127.0.0.1:8000`.

Useful project commands:

```powershell
npm run build
npx tsc --noEmit
npm run lint
npm run preview
```

### 8. Deployment

The front end can be deployed to Vercel as a static Vite application. The
Python backend must be deployed separately; it is not included in the front-end
repository and is not started by Vercel when the website is deployed.

The current backend binds to `127.0.0.1:8000` and runs the model pipeline at
startup. Before hosting it as a network service, configure it to bind to the
host-provided interface and port. Its startup cost should also be considered
when choosing a hosting platform.

For production API access, either:

1. Configure a Vercel rewrite from `/api/*` to the separately hosted backend,
   keeping the front end's default API base of `/api`; or
2. Set `VITE_AURA_API_BASE` in the Vercel build environment to the backend API
   base URL, including `/api`, and configure the backend to allow requests from
   the website's origin.

`VITE_AURA_API_BASE` is a public URL embedded in the built client; do not put
secrets in `VITE_` variables. The Vite proxy in `vite.config.ts` is for local
development and preview, not a replacement for production backend hosting.

### 9. Data and Safety

All health values and model results in this project are simulated. The demo
does not accept health-data submissions. Browser storage is not encrypted, so
do not enter real patient or astronaut data.

The project has no authentication, real wearable connection, live telemetry,
clinical decision engine. The optional live copilot (see README, AURA Intelligence) calls a language model only through a server function and only with simulated readings. Forecast bands and risk
scores are illustrative and are not medical predictions or recommendations.

### 10. Key Directories

| Path | Contents |
|---|---|
| `src/pages/` | Main application screens and workflow pages. |
| `src/components/` | Shared interface, navigation, and anatomy components. |
| `src/api/` | API client, response types, and data adapters. |
| `src/data/` | Demo and fallback datasets. |
| `src/stores/` | Zustand state and local persistence. |
| `src/styles/` | Global, design-system, and feature-specific styles. |
| `public/models/` | On-demand anatomy model assets. |
| `https://github.com/eyadwebdeveloper/backend` | Python simulation, model pipeline and API (separate repository, deployed on PythonAnywhere). |
