import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** Small marker that tells people a piece of the interface is AI-driven. */
export function AiBadge({ children = "AI", title }: { children?: ReactNode; title?: string }) {
  return (
    <span className="ai-badge" title={title}>
      <Sparkles size={11} aria-hidden="true" />
      {children}
    </span>
  );
}

export function ReadinessRing({ value, size = 132, label }: { value: number; size?: number; label?: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? "good" : value >= 70 ? "ok" : value >= 55 ? "low" : "bad";
  return (
    <div className={`ai-ring tone-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`Readiness ${value} out of 100. ${label ?? ""}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="ai-ring-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="ai-ring-value"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div>
        <strong>{value}</strong>
        <small>{label ?? "readiness"}</small>
      </div>
    </div>
  );
}

/** Renders the copilot's tiny markdown subset: **bold**, *italic*, "- " bullets and "1. " lists. */
export function RichText({ text }: { text: string }) {
  const inline = (s: string, k: string) =>
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${k}${i}`}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={`${k}${i}`}>{part.slice(1, -1)}</em>;
      return part;
    });
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${bi}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${bi}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={bi}>{inline(lines.join(" "), String(bi))}</p>;
      })}
    </>
  );
}
