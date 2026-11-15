import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, Eraser, Square, X } from "lucide-react";
import { SUGGESTED_PROMPTS } from "../../ai/copilot";
import { useCopilotContext } from "../../hooks/useIntelligence";
import { takePendingPrompt, useCopilotStore } from "../../stores/copilotStore";
import { useCrewStore } from "../../stores/crewStore";
import { AiBadge, ReadinessRing, RichText } from "./parts";
import "../../styles/ai.css";

export default function CopilotPanel() {
  const open = useCopilotStore((s) => s.open);
  const setOpen = useCopilotStore((s) => s.setOpen);
  const all = useCopilotStore((s) => s.messages);
  const draft = useCopilotStore((s) => s.draft);
  const setDraft = useCopilotStore((s) => s.setDraft);
  const ask = useCopilotStore((s) => s.ask);
  const stop = useCopilotStore((s) => s.stop);
  const clear = useCopilotStore((s) => s.clear);
  const remote = useCopilotStore((s) => s.remote);
  const checkRemote = useCopilotStore((s) => s.checkRemote);
  const member = useCrewStore((s) => s.getActiveMember());
  const ctx = useCopilotContext();
  const location = useLocation();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const messages = all.filter((m) => m.crewId === member.id);
  const busy = messages.some((m) => m.pending);

  useEffect(() => {
    checkRemote();
  }, [checkRemote]);

  // Open from anywhere with Ctrl/Cmd + J, or "/" when not typing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? "") || (e.target as HTMLElement)?.isContentEditable;
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        useCopilotStore.getState().setOpen(!useCopilotStore.getState().open);
      }
      if (e.key === "Escape" && useCopilotStore.getState().open) useCopilotStore.getState().setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // A prompt handed over by "Ask AURA" buttons elsewhere in the app.
  useEffect(() => {
    if (!open) return;
    const p = takePendingPrompt();
    if (p) void ask(p, ctxRef.current, member.id);
    else window.setTimeout(() => input.current?.focus(), 60);
  }, [open, ask, member.id]);

  const lastLength = messages.at(-1)?.content.length ?? 0;
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, lastLength]);

  const send = (text: string) => void ask(text, ctxRef.current, member.id);
  const live = remote === "live";

  return (
    <aside
      className={`copilot ${open ? "is-open" : ""}`}
      aria-label="AURA Copilot"
      aria-hidden={!open}
      inert={!open}
    >
      <header className="copilot-head">
        <div>
          <h2>
            AURA Copilot <AiBadge>{live ? "Claude · live" : "On-device"}</AiBadge>
          </h2>
          <p>
            {live
              ? "Answers by Claude, grounded in your simulated readings."
              : "Answers built on this device from your readings. Works offline."}
          </p>
        </div>
        <div className="copilot-head-actions">
          {messages.length > 0 && (
            <button type="button" className="icon-btn" onClick={() => clear(member.id)} aria-label="Clear conversation">
              <Eraser size={16} />
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close copilot">
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="copilot-scroll" ref={scroller} role="log" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? (
          <div className="copilot-welcome">
            <ReadinessRing value={ctx.intel.readiness} size={104} label={ctx.intel.readinessLabel.toLowerCase()} />
            <h3>{ctx.intel.headline}</h3>
            <p>{ctx.intel.summary}</p>
            <div className="copilot-prompts" role="group" aria-label="Suggested questions">
              {SUGGESTED_PROMPTS.map((p) => (
                <button type="button" key={p} onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`copilot-msg ${m.role}`}>
              {m.role === "assistant" ? (
                <>
                  <div className="copilot-bubble">
                    {m.content ? <RichText text={m.content} /> : <span className="copilot-typing" aria-label="AURA is thinking"><i /><i /><i /></span>}
                  </div>
                  {!m.pending && m.evidence && m.evidence.length > 0 && (
                    <ul className="copilot-evidence" aria-label="Based on">
                      {m.evidence.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                  {!m.pending && m.actions && m.actions.length > 0 && (
                    <div className="copilot-actions">
                      {m.actions.map((a) => (
                        <Link key={a.to + a.label} to={a.to} onClick={() => setOpen(false)}>
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {!m.pending && m.followUps && m.followUps.length > 0 && m.id === messages.at(-1)?.id && (
                    <div className="copilot-prompts small">
                      {m.followUps.map((p) => (
                        <button type="button" key={p} onClick={() => send(p)}>
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {!m.pending && m.source && <small className="copilot-source">{m.source === "live" ? "Written by Claude from your readings" : "Built on this device from your readings"}</small>}
                </>
              ) : (
                <div className="copilot-bubble">{m.content}</div>
              )}
            </div>
          ))
        )}
      </div>

      <form
        className="copilot-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && draft.trim()) send(draft);
        }}
      >
        <textarea
          ref={input}
          rows={1}
          value={draft}
          maxLength={600}
          placeholder="Ask about your sleep, heart, forecast…"
          aria-label="Ask AURA"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && draft.trim()) send(draft);
            }
          }}
        />
        {busy ? (
          <button type="button" className="copilot-send" onClick={stop} aria-label="Stop answering">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" className="copilot-send" disabled={!draft.trim()} aria-label="Send">
            <ArrowUp size={18} />
          </button>
        )}
      </form>
      <p className="copilot-foot">
        Simulated data. Advisory only, not a diagnosis, and it can’t raise official alerts.
        {location.pathname !== "/intelligence" && (
          <>
            {" "}
            <Link to="/intelligence" onClick={() => setOpen(false)}>
              How it works
            </Link>
          </>
        )}
      </p>
    </aside>
  );
}
