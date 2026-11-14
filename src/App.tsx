import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import { PageTransition } from "./components/motion";
import HomePage from "./pages/HomePage";
import CrewPage from "./pages/CrewPage";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SystemDetailPage = lazy(() => import("./pages/SystemDetailPage"));
const BodyLab = lazy(() => import("./pages/BodyLab"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const ExercisePage = lazy(() => import("./pages/ExercisePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const PvtPage = lazy(() => import("./pages/PvtPage"));
const MedicalEventPage = lazy(() => import("./pages/MedicalEventPage"));
const GamesHub = lazy(() => import("./pages/GamesHub"));
const FuelGame = lazy(() => import("./pages/games/FuelGame"));
const LoadGame = lazy(() => import("./pages/games/LoadGame"));
const ClockGame = lazy(() => import("./pages/games/ClockGame"));
const FactsGame = lazy(() => import("./pages/games/FactsGame"));
function RoutedApp() {
  const location = useLocation();
  const { pathname } = location;
  useEffect(() => {
    window.scrollTo(0, 0);
    document
      .querySelector<HTMLElement>("#main")
      ?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="page">
            <div className="loading-state">
              <span />
              Preparing your workspace…
            </div>
          </div>
        }
      >
        <PageTransition routeKey={pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/body" element={<BodyLab />} />
          <Route path="/system/:systemId" element={<SystemDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/crew" element={<CrewPage />} />
          <Route path="/pvt" element={<PvtPage />} />
          <Route path="/medical-event" element={<MedicalEventPage />} />
          <Route path="/games" element={<GamesHub />} />
          <Route path="/games/fuel" element={<FuelGame />} />
          <Route path="/games/load" element={<LoadGame />} />
          <Route path="/games/clock" element={<ClockGame />} />
          <Route path="/games/facts" element={<FactsGame />} />
          <Route
            path="*"
            element={
              <div className="page empty-state">
                <h1>This page is out of orbit.</h1>
                <a href="#/" className="button primary">
                  Back to overview
                </a>
              </div>
            }
          />
          </Routes>
        </PageTransition>
      </Suspense>
    </AppShell>
  );
}
export default function App() {
  return (
    <HashRouter>
      <RoutedApp />
    </HashRouter>
  );
}
