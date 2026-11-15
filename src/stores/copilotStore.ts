import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  answerLocally,
  askLive,
  getRemoteStatus,
  probeRemote,
  typeOut,
  type CopilotAction,
  type CopilotContext,
  type RemoteStatus,
} from "../ai/copilot";

export interface CopilotMessage {
  id: string;
  crewId: string;
  role: "user" | "assistant";
  content: string;
  source?: "live" | "on-device";
  evidence?: string[];
  actions?: CopilotAction[];
  followUps?: string[];
  pending?: boolean;
}

interface CopilotState {
  open: boolean;
  messages: CopilotMessage[];
  draft: string;
  remote: RemoteStatus;
  setOpen: (open: boolean) => void;
  openWith: (prompt?: string) => void;
  setDraft: (draft: string) => void;
  clear: (crewId: string) => void;
  checkRemote: () => void;
  ask: (text: string, ctx: CopilotContext, crewId: string) => Promise<void>;
  stop: () => void;
}

let controller: AbortController | null = null;
/** A prompt waiting for the panel to mount with a context. */
export let pendingPrompt: string | null = null;
export const takePendingPrompt = () => {
  const p = pendingPrompt;
  pendingPrompt = null;
  return p;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set, get) => ({
      open: false,
      messages: [],
      draft: "",
      remote: "unknown",
      setOpen: (open) => set({ open }),
      openWith: (prompt) => {
        if (prompt) pendingPrompt = prompt;
        set({ open: true });
      },
      setDraft: (draft) => set({ draft }),
      clear: (crewId) => set((s) => ({ messages: s.messages.filter((m) => m.crewId !== crewId) })),
      checkRemote: () => {
        if (getRemoteStatus() !== "unknown") return set({ remote: getRemoteStatus() });
        void probeRemote().then((remote) => set({ remote }));
      },
      stop: () => {
        controller?.abort();
        set((s) => ({ messages: s.messages.map((m) => (m.pending ? { ...m, pending: false } : m)) }));
      },
      ask: async (text, ctx, crewId) => {
        const question = text.trim().slice(0, 600);
        if (!question) return;
        controller?.abort();
        const ctrl = new AbortController();
        controller = ctrl;
        const answerId = uid();
        const history = get().messages.filter((m) => m.crewId === crewId && !m.pending);
        set((s) => ({
          draft: "",
          messages: [
            ...s.messages,
            { id: uid(), crewId, role: "user" as const, content: question },
            { id: answerId, crewId, role: "assistant" as const, content: "", pending: true },
          ].slice(-120),
        }));
        const patch = (p: Partial<CopilotMessage>) =>
          set((s) => ({ messages: s.messages.map((m) => (m.id === answerId ? { ...m, ...p } : m)) }));
        const append = (delta: string) =>
          set((s) => ({ messages: s.messages.map((m) => (m.id === answerId ? { ...m, content: m.content + delta } : m)) }));

        // The on-device answer is always computed: it supplies evidence chips and
        // action buttons even when the words come from the live model.
        const local = answerLocally(question, ctx);
        const emergency = local.actions.some((a) => a.to === "/medical-event") && local.evidence.length === 0 && local.followUps.length === 0;

        const remote = emergency ? "off" : await probeRemote();
        set({ remote });
        if (ctrl.signal.aborted) return;

        if (remote === "live") {
          try {
            const turns = [...history, { role: "user" as const, content: question }].map((m) => ({
              role: m.role,
              content: m.content,
            }));
            await askLive(turns, ctx, append, ctrl.signal);
            patch({ source: "live", pending: false, evidence: local.evidence, actions: local.actions, followUps: local.followUps });
            return;
          } catch {
            if (ctrl.signal.aborted) return;
            patch({ content: "" });
          }
        }
        patch({ source: "on-device", evidence: local.evidence, actions: local.actions, followUps: local.followUps });
        await typeOut(local.text, append, ctrl.signal);
        if (!ctrl.signal.aborted) patch({ pending: false });
      },
    }),
    {
      name: "aura-copilot",
      partialize: (s) => ({ messages: s.messages.filter((m) => !m.pending).slice(-60) }),
    },
  ),
);
