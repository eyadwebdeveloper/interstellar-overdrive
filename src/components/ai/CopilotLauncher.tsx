import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useCopilotStore } from "../../stores/copilotStore";
import "../../styles/ai.css";

/** Floating "Ask AURA" button. Pulses once for first-time visitors so the AI is impossible to miss. */
export default function CopilotLauncher() {
  const open = useCopilotStore((s) => s.open);
  const setOpen = useCopilotStore((s) => s.setOpen);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem("aura-copilot-hint") === "1";
    } catch {
      /* storage blocked */
    }
    if (seen) return;
    const t = window.setTimeout(() => setHint(true), 1800);
    const off = window.setTimeout(() => setHint(false), 12000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(off);
    };
  }, []);
  const dismiss = () => {
    setHint(false);
    try {
      localStorage.setItem("aura-copilot-hint", "1");
    } catch {
      /* storage blocked */
    }
  };
  if (open) return null;
  return (
    <div className="copilot-launcher-wrap">
      {hint && (
        <div className="copilot-hint" role="status">
          Ask AURA anything about your readings.
          <button type="button" onClick={dismiss} aria-label="Dismiss hint">
            ×
          </button>
        </div>
      )}
      <button
        type="button"
        className={`copilot-launcher ${hint ? "is-hinting" : ""}`}
        onClick={() => {
          dismiss();
          setOpen(true);
        }}
        aria-label="Open AURA Copilot (Ctrl or Cmd + J)"
      >
        <Sparkles size={18} aria-hidden="true" />
        <span>Ask AURA</span>
      </button>
    </div>
  );
}
