import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ClipboardCheck,
  Command,
  Dumbbell,
  Gamepad2,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar, Badge, BrandMark, Dialog } from "./ui";
import { useCrewStore } from "../stores/crewStore";
import { TEXT_SCALE, useSettingsStore } from "../stores/settingsStore";
import { useAppStore } from "../stores/appStore";
import { isOpenOfficial } from "../utils/alerts";
import { useAlerts, useAuraSync } from "../hooks/useAura";
import CopilotPanel from "./ai/CopilotPanel";
import CopilotLauncher from "./ai/CopilotLauncher";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/intelligence", label: "AURA Intelligence", icon: Sparkles, ai: true },
  { to: "/dashboard", label: "My health", icon: Activity },
  { to: "/checkin", label: "Check-in & tests", icon: ClipboardCheck },
  { to: "/exercise", label: "Exercise", icon: Dumbbell },
  { to: "/alerts", label: "Alerts", icon: Bell },
];
const SEARCH = [
  {
    to: "/intelligence",
    title: "AURA Intelligence",
    detail: "AI readiness, patterns, forecasts and what-if simulator",
  },
  {
    to: "/",
    title: "Overview",
    detail: "Your health, daily tasks and care team",
  },
  {
    to: "/dashboard",
    title: "Health metrics",
    detail: "Heart rate, blood pressure, sleep and trends",
  },
  {
    to: "/body",
    title: "Body systems",
    detail: "Interactive 3D figure and system detail",
  },
  {
    to: "/checkin",
    title: "Daily check-in",
    detail: "Mood, energy, sleep and notes",
  },
  {
    to: "/pvt",
    title: "Vigilance test",
    detail: "Three-minute reaction-time test",
  },
  {
    to: "/exercise",
    title: "Exercise plan",
    detail: "Sessions, equipment and weekly plan",
  },
  {
    to: "/alerts",
    title: "Alerts and advisories",
    detail: "Rules, patterns and reminders",
  },
  {
    to: "/support",
    title: "Support",
    detail: "Your crew clinician and Earth care team",
  },
  {
    to: "/medical-event",
    title: "Medical event",
    detail: "Guided incident report",
  },
  {
    to: "/crew",
    title: "Crew directory",
    detail: "Switch profile and view team roles",
  },
  {
    to: "/games",
    title: "Training room",
    detail: "Four short health-concept games",
  },
  {
    to: "/games/fuel",
    title: "Fuel the crew",
    detail: "Nutrition matching game · 3 minutes",
  },
  {
    to: "/games/load",
    title: "Load bearing",
    detail: "Bone and muscle countermeasure planner",
  },
  {
    to: "/games/clock",
    title: "Keep the clock",
    detail: "Circadian rhythm scheduling game",
  },
  {
    to: "/games/facts",
    title: "Fact from fiction",
    detail: "Space-health myth or fact round",
  },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const member = useCrewStore((s) => s.getActiveMember());
  const crew = useCrewStore((s) => s.crew);
  const switchCrew = useCrewStore((s) => s.setActiveCrewId);
  const day = useCrewStore((s) => s.getMissionDay());
  const settings = useSettingsStore();
  const store = useAppStore();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState(false);
  useAuraSync();
  const textSize = settings.textSize;
  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SCALE[textSize] ?? "100%";
  }, [textSize]);
  const openAlerts = useAlerts().filter((a) =>
    isOpenOfficial(a, member.id, store, clock),
  ).length;
  const focus = ["/pvt", "/medical-event"].includes(location.pathname);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const section =
    location.pathname.startsWith("/system") || location.pathname === "/body"
      ? "My health"
      : location.pathname.startsWith("/games")
        ? "Training room"
        : SEARCH.find((x) => x.to === location.pathname)?.title || "Overview";
  const navigation = (
    <>
      <div className="nav-caption">YOUR WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            onClick={() => setMenu(false)}
            className={({ isActive }) =>
              isActive ||
              (n.to === "/dashboard" &&
                (location.pathname.startsWith("/system") ||
                  location.pathname === "/body"))
                ? "nav-link active"
                : "nav-link"
            }
          >
            <n.icon size={19} />
            <span>{n.label}</span>
            {"ai" in n && n.ai && <span className="nav-ai">AI</span>}
            {n.to === "/alerts" && openAlerts > 0 && (
              <span className="nav-count">{openAlerts}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="nav-caption secondary-caption">TRAINING ROOM</div>
      <nav className="sidebar-nav" aria-label="Training room navigation">
        <NavLink
          to="/games"
          onClick={() => setMenu(false)}
          className={() =>
            location.pathname.startsWith("/games") ? "nav-link active" : "nav-link"
          }
        >
          <Gamepad2 size={19} />
          Health games
        </NavLink>
      </nav>
      <div className="nav-caption secondary-caption">CONNECTED CARE</div>
      <nav className="sidebar-nav" aria-label="Care navigation">
        <NavLink
          to="/crew"
          onClick={() => setMenu(false)}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Users size={19} />
          Crew directory
        </NavLink>
        <NavLink
          to="/support"
          onClick={() => setMenu(false)}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <HeartHandshake size={19} />
          Support
        </NavLink>
      </nav>
    </>
  );
  return (
    <>
      <div
        id="app-shell"
        className={`workspace ${focus ? "focus-mode" : ""}`}
        data-motion={!settings.animationsEnabled ? "reduced" : "full"}
      >
        <a
          href="#main"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus();
          }}
        >
          Skip to content
        </a>
        {!focus && (
          <aside className="sidebar">
            <Link to="/" className="brand">
              <BrandMark />
              <span>
                aura<span className="brand-sub">ASTROVITALS</span>
              </span>
            </Link>
            {navigation}
            <div className="sidebar-bottom">
              <div className="mission-card">
                <div className="mission-card-title">
                  <i className="connection-dot" />
                  ARCADIA MISSION
                </div>
                <strong>
                  Far from Earth.
                  <br />
                  Never on your own.
                </strong>
                <div className="mission-orbit" aria-hidden="true">
                  <span />
                  <i />
                  <b />
                </div>
                <div className="mission-meta">
                  <span>Mission day</span>
                  <b>{String(day).padStart(3, "0")}</b>
                </div>
                <div className="mission-meta">
                  <span>Earth link · demo</span>
                  <b>20 min</b>
                </div>
              </div>
              <Link to="/medical-event" className="sidebar-emergency">
                <Siren size={18} />
                Report medical event
                <ArrowUpRight size={15} />
              </Link>
              <button
                className="sidebar-settings"
                onClick={() => setPreferences(true)}
              >
                <Settings size={17} />
                Settings
              </button>
            </div>
          </aside>
        )}
        <div className="workspace-body">
          {!focus && (
            <header className="topbar">
              <div className="topbar-left">
                <button
                  className="icon-button mobile-menu"
                  aria-label="Open navigation"
                  onClick={() => setMenu(true)}
                >
                  <Menu size={22} />
                </button>
                <Link to="/" className="mobile-brand">
                  <BrandMark size={29} />
                  <span>aura</span>
                </Link>
                <div className="topbar-breadcrumb">
                  <span>Workspace</span>
                  <span>/</span>
                  <strong>{section}</strong>
                </div>
              </div>
              <div className="topbar-actions">
                <button
                  className="search-launch"
                  onClick={() => setSearch(true)}
                >
                  <Search size={16} />
                  <span>Find anything</span>
                  <kbd>
                    <Command size={10} />K
                  </kbd>
                </button>
                <span className="demo-label">
                  <i />
                  Demo workspace
                </span>
                <Link
                  to="/alerts"
                  className="icon-button notification"
                  aria-label={`${openAlerts} active official alerts`}
                >
                  <Bell size={19} />
                  {openAlerts > 0 && <b />}
                </Link>
                <button
                  className="profile-button"
                  onClick={() => setPreferences(true)}
                  aria-label="Open profile and settings"
                >
                  <Avatar name={member.name} />
                  <ChevronDown size={14} />
                </button>
              </div>
            </header>
          )}
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          {!focus && (
            <footer className="workspace-footer">
              <span>
                <ShieldCheck size={13} />
                Local-first prototype. Your demo data stays in this browser.
              </span>
              <span>AURA / AstroVitals</span>
            </footer>
          )}
        </div>
        {!focus && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <NavLink to="/" end>
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/dashboard">
              <Activity size={20} />
              <span>Health</span>
            </NavLink>
            <NavLink to="/checkin" className="mobile-checkin">
              <Plus size={22} />
              <span>Check-in</span>
            </NavLink>
            <NavLink to="/exercise">
              <Dumbbell size={20} />
              <span>Exercise</span>
            </NavLink>
            <NavLink to="/alerts">
              <Bell size={20} />
              <span>Alerts</span>
            </NavLink>
          </nav>
        )}
      </div>
      {!focus && <CopilotLauncher />}
      <CopilotPanel />
      <Dialog
        open={menu}
        onClose={() => setMenu(false)}
        title="Your workspace"
        className="mobile-navigation-dialog"
      >
        {navigation}
        <Link
          className="button secondary"
          to="/medical-event"
          onClick={() => setMenu(false)}
        >
          <Siren size={16} />
          Medical event
        </Link>
        <button
          className="button ghost"
          onClick={() => {
            setMenu(false);
            setPreferences(true);
          }}
        >
          <Settings size={16} />
          Settings
        </button>
      </Dialog>
      <Dialog
        open={search}
        onClose={() => {
          setSearch(false);
          setQuery("");
        }}
        title="Find your way"
      >
        <label className="global-search-field">
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics, tests, support…"
            aria-label="Search the workspace"
            autoFocus
          />
          <kbd>ESC</kbd>
        </label>
        <div className="search-results">
          {SEARCH.filter((x) =>
            `${x.title} ${x.detail}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ).map((x) => (
            <button
              key={x.to}
              onClick={() => {
                setSearch(false);
                setQuery("");
                navigate(x.to);
              }}
            >
              <div>
                <strong>{x.title}</strong>
                <span>{x.detail}</span>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
          {SEARCH.filter((x) =>
            `${x.title} ${x.detail}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ).length === 0 && (
            <p className="muted">
              No results. Try “sleep”, “exercise” or “support”.
            </p>
          )}
        </div>
      </Dialog>
      <Dialog
        open={preferences}
        onClose={() => setPreferences(false)}
        title="Your profile & preferences"
      >
        <p className="muted small-text">
          Switch the demo profile. Saved check-ins, sessions and
          acknowledgements are scoped to the selected crew member.
        </p>
        <div className="profile-options">
          {crew.map((c) => (
            <button
              key={c.id}
              className={member.id === c.id ? "selected" : ""}
              onClick={() => switchCrew(c.id)}
            >
              <Avatar name={c.name} />
              <div>
                <strong>{c.name}</strong>
                <span>{c.role}</span>
              </div>
              {member.id === c.id && <Check size={19} />}
            </button>
          ))}
        </div>
        <div className="preference-row">
          <div>
            <strong>Reduce motion</strong>
            <p>Keep the interface still and focused.</p>
          </div>
          <button
            className={`switch ${!settings.animationsEnabled ? "on" : ""}`}
            role="switch"
            aria-label="Reduce motion"
            aria-checked={!settings.animationsEnabled}
            onClick={() =>
              settings.setAnimationsEnabled(!settings.animationsEnabled)
            }
          >
            <span />
          </button>
        </div>
        <div className="preference-row text-size-row">
          <div>
            <strong>Text size</strong>
            <p>Make everything easier to read. Applies across the whole app.</p>
          </div>
          <div className="text-size-options" role="group" aria-label="Text size">
            {(
              [
                ["standard", "Standard"],
                ["large", "Large"],
                ["xl", "Extra large"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={settings.textSize === id}
                onClick={() => settings.setTextSize(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="privacy-note">
          <ShieldCheck size={18} />
          <p>
            Browser storage is not encrypted clinical storage. Do not enter real
            patient data in this demo.
          </p>
        </div>
        <Badge tone="info">
          Prototype · No live telemetry or clinician connection
        </Badge>
      </Dialog>
    </>
  );
}
