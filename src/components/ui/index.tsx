import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bone,
  Brain,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Dumbbell,
  Flame,
  Heart,
  HeartPulse,
  Moon,
  Scale,
  Shield,
  ShieldAlert,
  Thermometer,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  activity: Activity,
  heart: Heart,
  "heart-pulse": HeartPulse,
  bone: Bone,
  brain: Brain,
  shield: Shield,
  "shield-alert": ShieldAlert,
  moon: Moon,
  scale: Scale,
  thermometer: Thermometer,
  wind: Wind,
  flame: Flame,
  zap: Zap,
  dumbbell: Dumbbell,
  "clipboard-check": ClipboardCheck,
};
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name] || Activity;
  return <Component size={size} className={className} aria-hidden="true" />;
}
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="10"
        transform="rotate(-45 20 20)"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M20 11v18M11 20h18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </header>
  );
}
export function Panel({
  children,
  className = "",
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";
export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  );
}
export function Status({ level, label }: { level: string; label?: string }) {
  const tone: BadgeTone =
    level === "normal" ? "success" : level === "watch" ? "warning" : "danger";
  return (
    <Badge tone={tone} dot>
      {label ||
        (level === "normal"
          ? "Within baseline"
          : level === "watch"
            ? "Worth a look"
            : "Needs attention")}
    </Badge>
  );
}
export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const clean = name.replace(/Commander |Engineer |Dr\. /g, "");
  const initials = clean
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`avatar avatar-${size} ${className}`} aria-label={name}>
      {initials}
    </span>
  );
}
export function Tabs({
  items,
  value,
  onChange,
  label = "Views",
}: {
  items: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          className={value === item.value ? "selected" : ""}
          onClick={() => onChange(item.value)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  icon = "shield",
  children,
}: {
  title: string;
  description: string;
  icon?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Delta({ value, unit = "" }: { value: number; unit?: string }) {
  return (
    <span className="delta">
      {value > 0 ? (
        <ArrowUp size={12} />
      ) : value < 0 ? (
        <ArrowDown size={12} />
      ) : null}
      {Math.abs(value)}
      {unit}
    </span>
  );
}
export function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="select-wrap">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}
export function Dialog({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = document.getElementById("app-shell");
    if (background) background.inert = true;
    const target = ref.current;
    target
      ?.querySelector<HTMLElement>(
        'button, input, textarea, select, [tabindex="0"]',
      )
      ?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !target) return;
      const nodes = [
        ...target.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea, select, [tabindex="0"]',
        ),
      ].filter((x) => x.offsetParent !== null);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = before;
      if (background) background.inert = false;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <div className={`notice notice-${tone}`}>
      <CircleHelp size={17} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function SuccessMark() {
  return (
    <div className="success-mark">
      <Check size={32} />
    </div>
  );
}
export function LineChart({
  values,
  color = "var(--forest)",
  range,
  compact = false,
  label = "Demo trend",
  unit = "",
  dates = ["14 days ago", "7 days ago", "Today"],
}: {
  values: number[];
  color?: string;
  range?: [number, number];
  compact?: boolean;
  label?: string;
  unit?: string;
  dates?: string[];
}) {
  const id = useId().replace(/:/g, "");
  const w = 640;
  const h = compact ? 70 : 190;
  const p = compact ? 6 : 16;
  const min = Math.min(...values, ...(range || []));
  const max = Math.max(...values, ...(range || []));
  const margin = Math.max((max - min) * 0.2, 0.5);
  const lo = min - margin;
  const hi = max + margin;
  const y = (v: number) => h - p - ((v - lo) / (hi - lo)) * (h - p * 2);
  const coords = values.map((v, i) => [
    p + (i / Math.max(values.length - 1, 1)) * (w - p * 2),
    y(v),
  ]);
  const d = coords.map((c, i) => `${i ? "L" : "M"} ${c[0]},${c[1]}`).join(" ");
  const end = coords[coords.length - 1] || [0, 0];
  const fmt = (value: number) =>
    max < 2
      ? value.toFixed(2)
      : hi - lo < 10
        ? value.toFixed(1)
        : String(Math.round(value));
  return (
    <div className={`line-chart ${compact ? "compact" : ""}`}>
      <div className="chart-frame">
        {!compact && (
          <div className="chart-scale" aria-hidden="true">
            <span>{fmt(hi)}</span>
            <span>{fmt((hi + lo) / 2)}</span>
            <span>{fmt(lo)}</span>
          </div>
        )}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={label}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={color} stopOpacity=".09" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {!compact &&
            [0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1={p}
                x2={w - p}
                y1={p + (i * (h - p * 2)) / 3}
                y2={p + (i * (h - p * 2)) / 3}
                stroke="var(--line)"
                strokeDasharray="3 5"
              />
            ))}
          {range && (
            <rect
              x={p}
              y={y(range[1])}
              width={w - p * 2}
              height={Math.max(0, y(range[0]) - y(range[1]))}
              fill="var(--mint-soft)"
            />
          )}
          <path
            d={`${d} L ${end[0]},${h} L ${p},${h} Z`}
            fill={`url(#${id})`}
          />
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={compact ? 2 : 2.5}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={end[0]} cy={end[1]} r={compact ? 3 : 4} fill={color} />
        </svg>
      </div>
      {!compact && (
        <div className="chart-dates">
          {dates.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      )}
      {!compact && (
        <div className="chart-caption-row">
          {range && (
            <span className="chart-baseline-legend">
              <i />
              Own baseline{" "}
              {range
                .map((v) =>
                  v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                )
                .join("–")}
              {unit ? ` ${unit}` : ""}
            </span>
          )}
          <details className="chart-values">
            <summary>View values</summary>
            <p>{label}</p>
            <ol>
              {values.map((v, i) => (
                <li key={i}>
                  Point {i + 1}:{" "}
                  {v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  {unit ? ` ${unit}` : ""}
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
    </div>
  );
}
