import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, BrainCircuit, CircleAlert, LineChart as LineIcon, MessageSquare, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { formatSignal, whatIf, type SignalInsight } from "../ai/engine";
import { useAuraSource, useForecast, useRisk } from "../hooks/useAura";
import { useCopilotContext, useIntelligence } from "../hooks/useIntelligence";
import { useCopilotStore } from "../stores/copilotStore";
import { PageHeader, Panel, Badge } from "../components/ui";
import { AiBadge, ReadinessRing } from "../components/ai/parts";
import { useAlerts } from "../hooks/useAura";
import { getSimulatedVitals } from "../data/vitalsData";
import "../styles/ai.css";

const AtlasStage = lazy(() => import("../components/body/AtlasStage"));

function Spark({ s }: { s: SignalInsight }) {
  const W = 168;
  const H = 46;
  const all = [...s.history, ...s.forecast];
  const lo = Math.min(...all, ...s.forecast.map((v, i) => v - s.band[i]));
  const hi = Math.max(...all, ...s.forecast.map((v, i) => v + s.band[i]));
  const span = hi - lo || 1;
  const n = all.length;
  const x = (i: number) => 2 + (i / (n - 1)) * (W - 4);
  const y = (v: number) => 3 + (1 - (v - lo) / span) * (H - 6);
  const h0 = s.history.length - 1;
  const hist = s.history.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const fc = [s.history[h0], ...s.forecast].map((v, i) => `${i ? "L" : "M"}${x(h0 + i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const up = s.forecast.map((v, i) => `${x(h0 + 1 + i).toFixed(1)},${y(v + s.band[i]).toFixed(1)}`);
  const dn = s.forecast.map((v, i) => `${x(h0 + 1 + i).toFixed(1)},${y(v - s.band[i]).toFixed(1)}`).reverse();
  const bandY = [y(s.baseline + s.baselineSpread), y(s.baseline - s.baselineSpread)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ai-spark" role="img" aria-label={`${s.label}: 14 days recorded, then a 7-day forecast`}>
      <rect x="0" width={W} y={Math.min(...bandY)} height={Math.abs(bandY[0] - bandY[1])} className="ai-spark-base" />
      <polygon points={[...up, ...dn].join(" ")} className="ai-spark-band" />
      <path d={hist} className="ai-spark-line" fill="none" />
      <path d={fc} className="ai-spark-fc" fill="none" />
      <line x1={x(h0)} x2={x(h0)} y1="0" y2={H} className="ai-spark-now" />
    </svg>
  );
}

const DIRECTION_TEXT = { worse: "Moving away", better: "Improving", steady: "Steady" } as const;

export default function IntelligencePage() {
  const intel = useIntelligence();
  const ctx = useCopilotContext();
  const navigate = useNavigate();
  const location = useLocation();
  const openWith = useCopilotStore((s) => s.openWith);
  const remote = useCopilotStore((s) => s.remote);
  const checkRemote = useCopilotStore((s) => s.checkRemote);
  const { source } = useAuraSource();
  const risk = useRisk();
  const forecast = useForecast();
  const alerts = useAlerts();
  const hr = getSimulatedVitals().find((v) => v.id === "heart-rate")?.value ?? 64;
  const [sleepHours, setSleepHours] = useState(8);
  const [aerobic, setAerobic] = useState(20);
  const sim = useMemo(() => whatIf(intel, { sleepHours, aerobicMinutes: aerobic }), [intel, sleepHours, aerobic]);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => checkRemote(), [checkRemote]);
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, [location.hash]);

  const officialCount = alerts.filter((a) => a.kind === "rule").length;
  const gain = sim.readiness - sim.readinessIfNothingChanges;
  const live = remote === "live";

  const stages = [
    {
      n: "Tier 0",
      title: "Rules",
      icon: ShieldCheck,
      body: "Fixed, transparent thresholds. The only layer allowed to raise an official alert.",
      stat: `${officialCount} on record`,
      state: "Deterministic",
    },
    {
      n: "Tier 1",
      title: "Patterns",
      icon: Waves,
      body: "Compares every signal with your own first-week baseline and looks for signals drifting together.",
      stat: `${intel.patterns.length} found now`,
      state: "On this device",
    },
    {
      n: "Tier 2",
      title: "Forecast & risk",
      icon: LineIcon,
      body: "Projects the next 7 days with an uncertainty band, and scores deconditioning risk.",
      stat: risk ? `${risk.band} pattern · ${Math.round(risk.confidence * 100)}%` : "7-day outlook",
      state: source === "live" ? (forecast?.backend === "gru" ? "Neural model (backend)" : "Backend model") : "Trend model on device",
    },
    {
      n: "Copilot",
      title: "Explains it",
      icon: MessageSquare,
      body: "Answers questions in plain language using only the numbers above. It explains; it never decides.",
      stat: live ? "Claude · live" : "On-device engine",
      state: live ? "Language model" : "Grounded, offline-ready",
    },
  ];

  return (
    <div className="page ai-page">
      <PageHeader
        eyebrow="AURA / intelligence"
        title="How AURA reads your body"
        description="Everything the AI notices, why it noticed it, and what would change it. Built to be checked, not trusted blindly."
        actions={<AiBadge>Advisory only</AiBadge>}
      />

      {/* Readiness + copilot */}
      <section className="ai-grid-top">
        <Panel className="ai-readiness" title="Readiness today" subtitle="A single number built from seven signals, against your own baseline">
          <div className="ai-readiness-body">
            <ReadinessRing value={intel.readiness} size={150} label={intel.readinessLabel.toLowerCase()} />
            <div className="ai-readiness-drivers">
              {intel.drivers.map((d) => (
                <div key={d.id} className="ai-driver dark-on-light">
                  <span>{d.label}</span>
                  <div className="ai-driver-bar" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (-d.points / 12) * 100)}%` }} />
                  </div>
                  <b>{d.points === 0 ? "0" : d.points}</b>
                </div>
              ))}
              <p className="small-text muted">Points taken from a starting 92 when a signal drifts the wrong way. Readiness is guidance, not a medical score.</p>
            </div>
          </div>
        </Panel>

        <Panel className="ai-next" title="Best next steps" subtitle="Ranked by how much they should move readiness">
          <ol className="ai-recs">
            {intel.recommendations.slice(0, 3).map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.title}</strong>
                  <p>{r.why}</p>
                </div>
                <Link to={r.to} className="button small secondary">
                  {r.cta}
                  <ArrowUpRight size={14} />
                </Link>
              </li>
            ))}
          </ol>
          <button type="button" className="button small forest" onClick={() => openWith("What should I do before tonight?")}>
            <Sparkles size={14} /> Ask AURA to walk me through it
          </button>
        </Panel>
      </section>

      {/* Pipeline */}
      <section aria-labelledby="pipeline-h" className="ai-section">
        <h2 id="pipeline-h">Four layers, kept apart on purpose</h2>
        <div className="ai-pipeline">
          {stages.map((s, i) => (
            <div key={s.title} className="ai-stage">
              <span className="ai-stage-n">{s.n}</span>
              <s.icon size={20} aria-hidden="true" />
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <b>{s.stat}</b>
              <small>{s.state}</small>
              {i < stages.length - 1 && <i className="ai-stage-arrow" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <p className="ai-note">
          <CircleAlert size={14} aria-hidden="true" /> Authority rule: only Tier 0 rules can create an official alert. Everything the AI produces is labelled advisory and shows its evidence.
        </p>
      </section>

      {/* Body */}
      <section id="body" aria-labelledby="body-h" className="ai-section ai-body-section">
        <div className="ai-body-copy">
          <h2 id="body-h">The AI, on the body</h2>
          <p>The real Human-Atlas anatomy, with AURA’s findings pinned to the structures they concern. Hover a system on the left to bring it forward; tap a label to open it.</p>
          <ul className="ai-systems">
            {Object.entries(intel.systemFindings).map(([id, f]) => (
              <li key={id} className={focus === id ? "on" : ""}>
                <button type="button" onClick={() => navigate(`/system/${id}`)} onMouseEnter={() => setFocus(id)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(id)} onBlur={() => setFocus(null)}>
                  <span className={`ai-dot lvl-${f.level}`} aria-hidden="true" />
                  <span>
                    <b>{f.label}</b>
                    <small>{f.detail}</small>
                  </span>
                  <Badge tone={f.level === "normal" ? "success" : f.level === "watch" ? "warning" : "danger"}>{f.level === "normal" ? "Steady" : f.level === "watch" ? "Watch" : "Drifting"}</Badge>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/body" className="button small secondary">
            Open the full anatomy atlas <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="ai-hero-stage solo">
          <Suspense fallback={<div className="atlas-stage-loading">Opening the anatomy atlas…</div>}>
            <AtlasStage intel={intel} heartRate={hr} activeSystemId={focus} onSelectSystem={(id) => navigate(`/system/${id}`)} />
          </Suspense>
          <div className="ai-stage-caption">
            <span>
              <i /> Drag to orbit · scroll to zoom · hover a structure for its name
            </span>
          </div>
        </div>
      </section>

      {/* Signals */}
      <section id="signals" aria-labelledby="signals-h" className="ai-section">
        <h2 id="signals-h">Signal by signal</h2>
        <p className="ai-sub">Shaded band: your own first-week range. Solid line: recorded. Dashed: where it’s heading, with an uncertainty band.</p>
        <div className="ai-signals">
          {intel.signals.map((s) => (
            <article key={s.id} className={`ai-signal dir-${s.direction}`}>
              <header>
                <h3>{s.label}</h3>
                <Badge tone={s.direction === "worse" ? "warning" : s.direction === "better" ? "success" : "neutral"}>{DIRECTION_TEXT[s.direction]}</Badge>
              </header>
              <Spark s={s} />
              <dl>
                <div>
                  <dt>Now</dt>
                  <dd>{formatSignal(s.current, s.unit)}</dd>
                </div>
                <div>
                  <dt>Your baseline</dt>
                  <dd>{formatSignal(s.baseline, s.unit)}</dd>
                </div>
                <div>
                  <dt>In 7 days</dt>
                  <dd>
                    {formatSignal(s.forecast[6], s.unit)} <small>± {formatSignal(s.band[6], s.unit)}</small>
                  </dd>
                </div>
              </dl>
              <p>{s.sentence}</p>
              <button type="button" className="text-link" onClick={() => openWith(`Explain my ${s.label.toLowerCase()} trend`)}>
                Ask AURA why <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Patterns */}
      <section id="patterns" aria-labelledby="patterns-h" className="ai-section">
        <h2 id="patterns-h">Patterns across signals</h2>
        {intel.patterns.length === 0 ? (
          <p className="muted">No cross-signal patterns against your baseline right now.</p>
        ) : (
          <div className="ai-patterns">
            {intel.patterns.map((p) => (
              <article key={p.id} className="ai-pattern">
                <header>
                  <h3>{p.title}</h3>
                  <span className="ai-conf" title="How strongly the data supports this pattern, not a probability of illness">
                    {Math.round(p.confidence * 100)}% support
                  </span>
                </header>
                <p>{p.detail}</p>
                <details>
                  <summary>Evidence used</summary>
                  <ul>
                    {p.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </details>
                <button type="button" className="button small secondary" onClick={() => openWith(p.ask)}>
                  <Sparkles size={14} /> Explain this to me
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* What-if */}
      <section id="what-if" aria-labelledby="whatif-h" className="ai-section ai-whatif">
        <div>
          <h2 id="whatif-h">What if?</h2>
          <p className="ai-sub">Change your next week and see where AURA’s model says readiness could go.</p>
          <div className="ai-sliders">
            <label>
              <span>
                Sleep per night <b>{Math.floor(sleepHours)}h {String(Math.round((sleepHours % 1) * 60)).padStart(2, "0")}m</b>
              </span>
              <input type="range" min={5} max={9} step={0.25} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} aria-label="Hours of sleep per night" />
            </label>
            <label>
              <span>
                Extra aerobic time <b>{aerobic} min/day</b>
              </span>
              <input type="range" min={0} max={40} step={5} value={aerobic} onChange={(e) => setAerobic(Number(e.target.value))} aria-label="Extra aerobic minutes per day" />
            </label>
          </div>
          <p className="small-text muted">{sim.note}</p>
        </div>
        <div className="ai-whatif-out" aria-live="polite">
          <div className="ai-whatif-score">
            <ReadinessRing value={sim.readiness} size={118} label="projected" />
            <div>
              <strong>{gain >= 0 ? `+${gain}` : gain}</strong>
              <span>vs. if nothing changes ({sim.readinessIfNothingChanges})</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Reaction time</dt>
              <dd>{Math.round(sim.pvt)} ms</dd>
            </div>
            <div>
              <dt>HRV</dt>
              <dd>{Math.round(sim.hrv)} ms</dd>
            </div>
            <div>
              <dt>Resting HR</dt>
              <dd>{Math.round(sim.restingHr)} bpm</dd>
            </div>
          </dl>
          <button type="button" className="button small forest" onClick={() => openWith(`What happens if I sleep ${sleepHours} hours all week?`)}>
            <BrainCircuit size={14} /> Have AURA explain this
          </button>
        </div>
      </section>

      <Panel className="ai-limits" title="What AURA will not do" subtitle="Honesty about the limits is part of the design">
        <ul>
          <li>It does not diagnose, treat, or replace your crew medical officer or official procedures.</li>
          <li>It cannot create, escalate, or dismiss an official alert. Only the Tier 0 rules can.</li>
          <li>Every reading is simulated. The copilot is told to use only the numbers shown here and to say when it doesn’t know.</li>
          <li>The sleep effects in the what-if come from your own 14 days; the aerobic effect is an assumption. Confidence and bands are not clinical intervals.</li>
        </ul>
        <small className="muted">Copilot mode: {live ? "live Claude model via a server function (your key stays on the server)" : "on-device engine. Add ANTHROPIC_API_KEY on the server to switch to a live model."} · Context shared: {Object.keys(ctx).length ? "simulated readings only" : ""}</small>
      </Panel>
    </div>
  );
}
