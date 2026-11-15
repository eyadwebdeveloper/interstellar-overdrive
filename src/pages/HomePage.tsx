import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bone,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Dumbbell,
  Gamepad2,
  Heart,
  HeartHandshake,
  Moon,
  Radio,
  Salad,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Delta,
  Icon,
  LineChart,
  PageHeader,
  Panel,
  Progress,
  Status,
} from "../components/ui";
import {
  getBodySystems,
  getSimulatedVitals,
} from "../data/vitalsData";
import { useAlerts } from "../hooks/useAura";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import { isOpenOfficial } from "../utils/alerts";
import AiHero from "../components/ai/AiHero";
import { FadeIn, useMotionAllowed, EASE } from "../components/motion";
import "../styles/home.css";

const MotionLink = motion.create(Link);
const PLAN = [
  {
    time: "07:30",
    title: "Morning vitals",
    detail: "Wearable sync",
    icon: Activity,
    to: "/dashboard",
    kind: "vitals",
  },
  {
    time: "12:00",
    title: "Daily check-in",
    detail: "1 minute · make space for yourself",
    icon: ClipboardCheck,
    to: "/checkin",
    kind: "checkin",
  },
  {
    time: "14:30",
    title: "Vigilance test",
    detail: "3 minutes · reaction and focus",
    icon: Zap,
    to: "/pvt",
    kind: "pvt",
  },
  {
    time: "16:00",
    title: "Resistance session",
    detail: "45 minutes · lower body",
    icon: Dumbbell,
    to: "/exercise",
    kind: "exercise",
  },
];
export default function HomePage() {
  const member = useCrewStore((s) => s.getActiveMember());
  const day = useCrewStore((s) => s.getMissionDay());
  const store = useAppStore();
  const [today] = useState(() => new Date());
  const [range, setRange] = useState("14");
  const vitals = getSimulatedVitals();
  const hr = vitals[0];
  const sleep = vitals.find((x) => x.id === "sleep")!;
  const hrv = vitals.find((x) => x.id === "hrv")!;
  const normal = vitals.filter((x) => x.status === "normal").length;
  const systems = getBodySystems();
  const rules = useAlerts().filter((x) =>
    isOpenOfficial(x, member.id, store, today.getTime()),
  );
  const checkedIn = store.checkins.some(
    (x) =>
      x.crewId === member.id &&
      new Date(x.at).toDateString() === today.toDateString(),
  );
  const tested = store.pvt.some(
    (x) =>
      x.crewId === member.id &&
      new Date(x.at).toDateString() === today.toDateString(),
  );
  const exercised = store.sessions.some(
    (x) =>
      x.crewId === member.id &&
      new Date(x.at).toDateString() === today.toDateString(),
  );
  const complete = (kind: string) =>
    kind === "vitals" ||
    (kind === "checkin" && checkedIn) ||
    (kind === "pvt" && tested) ||
    (kind === "exercise" && exercised);
  const done = PLAN.filter((p) => complete(p.kind)).length;
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const motionOk = useMotionAllowed();
  return (
    <div className="page home-page">
      <PageHeader
        eyebrow={`PERSONAL HEALTH / MISSION DAY ${day}`}
        title={`${greeting}, ${member.name.split(" ").pop()}.`}
        description="A little perspective. A plan for today. Your people, close by."
        actions={
          <div className="date-label">
            <CalendarDays size={16} />
            {today.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        }
      />
      <AiHero />
      <div className="home-layout">
        <div className="home-main">
          <section className="wellbeing-hero">
            <FadeIn className="hero-copy" delay={0.05}>
              <div className="eyebrow">YOUR HEALTH, IN PERSPECTIVE</div>
              <h2>
                Steady signals.
                <br />A few things to watch.
              </h2>
              <p>
                {normal} of {vitals.length} demo readings are within your usual
                range. Let’s give sleep and recovery a little more attention.
              </p>
              <Link to="/dashboard" className="button forest">
                Explore my health
                <ArrowUpRight size={17} />
              </Link>
            </FadeIn>
            <div
              className="hero-orbit"
              aria-label={`${normal} of ${vitals.length} readings in usual range`}
            >
              <svg viewBox="0 0 220 220" aria-hidden="true">
                <circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke="#abd9b4"
                  strokeWidth="1"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  fill="none"
                  stroke="#aad7b3"
                  strokeWidth="8"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  fill="none"
                  stroke="#23483c"
                  strokeWidth="8"
                  strokeDasharray={`${(normal / vitals.length) * 503} 503`}
                  transform="rotate(-90 110 110)"
                  strokeLinecap="round"
                />
                <circle cx="110" cy="15" r="5" fill="#23483c" />
              </svg>
              <div>
                <Heart size={23} />
                <strong>
                  {normal}
                  <span>/{vitals.length}</span>
                </strong>
                <small>WITHIN BASELINE</small>
              </div>
            </div>
          </section>
          <div className="home-metric-strip">
            {[hr, sleep, hrv].map((v, i) => (
              <MotionLink
                key={v.id}
                to="/dashboard"
                className="snapshot"
                initial={motionOk ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  motionOk
                    ? { duration: 0.4, delay: 0.22 + i * 0.07, ease: EASE }
                    : { duration: 0 }
                }
              >
                <div className="snapshot-label">
                  <Icon name={v.icon} size={17} />
                  {v.id === "heart-rate" ? "Resting heart rate" : v.label}
                </div>
                <div className="snapshot-value">
                  {v.display || v.value}
                  <span>{v.unit}</span>
                  {v.delta !== undefined && (
                    <Delta value={v.delta} unit={v.id === "sleep" ? "h" : ""} />
                  )}
                </div>
                <div className="snapshot-status">
                  <Status level={v.status} label={v.statusLabel} />
                </div>
              </MotionLink>
            ))}
          </div>
          <Panel
            title="Your heart, over time"
            subtitle="Resting heart rate · compared with your own baseline"
            className="heart-chart-panel"
            action={
              <div className="mini-segment" aria-label="Heart chart range">
                {["7", "14"].map((x) => (
                  <button
                    key={x}
                    aria-pressed={range === x}
                    className={range === x ? "active" : ""}
                    onClick={() => setRange(x)}
                  >
                    {x} days
                  </button>
                ))}
              </div>
            }
          >
            <div className="chart-summary">
              <div>
                <strong>
                  {hr.value}
                  <span>bpm</span>
                </strong>
                <span className="small-text muted">
                  Latest demo reading · {hr.updated}
                </span>
              </div>
              <div className="baseline-key">
                <i />
                Your usual range: {hr.baseline}
              </div>
            </div>
            <LineChart
              unit="bpm"
              values={range === "7" ? hr.spark.slice(-7) : hr.spark}
              range={[58, 68]}
              label={`${range}-day resting heart rate demo chart; latest 64 bpm`}
              dates={[
                `${range} days ago`,
                range === "7" ? "3 days ago" : "7 days ago",
                "Today",
              ]}
            />
            <div className="chart-footnote">
              <span>
                <Radio size={13} />
                Wearable connection simulated
              </span>
              <Link to="/dashboard" className="text-link">
                All metrics
                <ArrowRight size={14} />
              </Link>
            </div>
          </Panel>
          <div className="attention-inline">
            <div className="attention-icon">
              <TriangleAlert size={22} />
            </div>
            <div>
              <strong>
                {rules.length
                  ? `${rules.length} official alert needs a review`
                  : "Official alerts reviewed"}
              </strong>
              <p>
                {rules.length
                  ? "A previous elevated heart-rate event is waiting for acknowledgement. Current readings are a separate snapshot."
                  : "Your acknowledgement is saved for this profile. Advisory notices remain informational."}
              </p>
            </div>
            <Link className="button small secondary" to="/alerts">
              Review
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <Panel
            title="The bigger picture"
            subtitle="Your body systems, connected to your daily habits."
            action={
              <Link className="text-link" to="/body">
                Open body view
                <ArrowUpRight size={14} />
              </Link>
            }
          >
            <div className="system-overview">
              {systems.slice(0, 3).map((s) => (
                <Link to={`/system/${s.id}`} key={s.id}>
                  <span className="system-mini-icon">
                    <Icon name={s.icon} />
                  </span>
                  <div>
                    <strong>{s.name}</strong>
                    <span>{s.statusLabel} · demo conditioning</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
        <aside className="home-context">
          <Panel
            title="Your day, at a glance"
            subtitle={`${done} of ${PLAN.length} daily tasks complete`}
            className="today-panel"
            action={
              <span className="tiny-calendar">
                <CalendarDays size={18} />
              </span>
            }
          >
            <Progress
              value={(done / PLAN.length) * 100}
              label="Daily task progress"
            />
            <div className="daily-timeline">
              {PLAN.map((p) => (
                <Link
                  to={p.to}
                  key={p.time}
                  className={`timeline-item ${complete(p.kind) ? "is-done" : ""}`}
                >
                  <span className="timeline-marker">
                    {complete(p.kind) ? (
                      <Check size={13} />
                    ) : (
                      <p.icon size={14} />
                    )}
                  </span>
                  <div>
                    <time>{p.time}</time>
                    <strong>{p.title}</strong>
                    <small>
                      {complete(p.kind) ? "Completed in this demo" : p.detail}
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
            <Link to="/checkin" className="button primary full">
              <ClipboardCheck size={16} />
              {checkedIn ? "View your check-in" : "Make a little time for you"}
            </Link>
          </Panel>
          <section className="learn-strip">
            <div className="eyebrow">
              <Gamepad2 size={13} />
              TRAINING ROOM
            </div>
            <h3>Learn by playing.</h3>
            <p>Four short rounds that turn countermeasures into instinct.</p>
            <div className="learn-strip-links">
              {[
                { to: "/games/fuel", icon: Salad, title: "Fuel the crew", detail: "Nutrition · 3 min" },
                { to: "/games/load", icon: Bone, title: "Load bearing", detail: "Bone & muscle · 5 min" },
                { to: "/games/clock", icon: Moon, title: "Keep the clock", detail: "Body rhythm · 3 min" },
                { to: "/games/facts", icon: Brain, title: "Fact from fiction", detail: "Myths · 3 min" },
              ].map((game, i) => (
                <MotionLink
                  key={game.to}
                  to={game.to}
                  initial={motionOk ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    motionOk
                      ? { duration: 0.4, delay: 0.3 + i * 0.06, ease: EASE }
                      : { duration: 0 }
                  }
                >
                  <strong>
                    <game.icon size={12} aria-hidden="true" />
                    {game.title}
                  </strong>
                  <span>{game.detail}</span>
                </MotionLink>
              ))}
            </div>
            <Link to="/games" className="learn-strip-footer">
              Open the training room
              <ArrowUpRight size={13} />
            </Link>
          </section>
          <section className="care-team-panel">
            <div className="care-team-top">
              <HeartHandshake size={21} />
              <Badge tone="success" dot>
                YOUR CARE CIRCLE
              </Badge>
            </div>
            <h2>
              Distance doesn’t
              <br />
              mean disconnection.
            </h2>
            <p>Your crew clinician and Earth care team, in one place.</p>
            <div className="care-contact">
              <Avatar name="Dr. Mo'men Ashraf" />
              <div>
                <strong>Dr. Mo'men</strong>
                <span>Crew flight surgeon</span>
              </div>
              <i className="connection-dot" />
            </div>
            <div className="care-contact">
              <Avatar name="Earth Care" className="earth-avatar" />
              <div>
                <strong>Earth care team</strong>
                <span>20 min one-way · simulated</span>
              </div>
              <Clock3 size={15} />
            </div>
            <Link to="/support" className="button secondary full">
              Find support
              <ArrowUpRight size={16} />
            </Link>
            <span className="care-disclaimer">
              Demo contacts · no live connection
            </span>
          </section>
          <section className="quiet-tip">
            <div className="eyebrow">
              <Sparkles size={13} />A SMALL REMINDER
            </div>
            <h3>
              Progress isn’t always
              <br />a straight line.
            </h3>
            <p>Keep an eye on your own trends, not someone else’s numbers.</p>
            <div>
              <Moon size={17} />
              <span>Take care of your downtime, too.</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
