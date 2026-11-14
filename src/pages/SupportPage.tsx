import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Heart,
  MessageCircle,
  Pause,
  Play,
  RefreshCcw,
  Send,
  Wind,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Dialog,
  EmptyState,
  Notice,
  PageHeader,
  Panel,
} from "../components/ui";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import "../styles/response.css";

type Recipient = "CMO channel · demo" | "Earth psychologist channel · demo";

const CHANNELS: {
  recipient: Recipient;
  eyebrow: string;
  title: string;
  description: string;
  icon: "heart" | "message";
}[] = [
  {
    recipient: "CMO channel · demo",
    eyebrow: "Clinical coordination · demo",
    title: "CMO channel",
    description:
      "Prepare a private, local note for the crew medical workflow. This screen does not contact a clinician or show availability.",
    icon: "heart",
  },
  {
    recipient: "Earth psychologist channel · demo",
    eyebrow: "Human support · demo",
    title: "Earth psychologist channel",
    description:
      "Write what you want held in the communication queue. It is one-way demo communication; replies are not represented here.",
    icon: "message",
  },
];

function formatBreath(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

export default function SupportPage() {
  const member = useCrewStore((state) => state.getActiveMember());
  const activeCrewId = useCrewStore((state) => state.activeCrewId);
  const messages = useAppStore((state) => state.messages);
  const saveMessage = useAppStore((state) => state.saveMessage);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState<Recipient>(CHANNELS[0].recipient);
  const [draft, setDraft] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [breathing, setBreathing] = useState(false);
  const [breathSeconds, setBreathSeconds] = useState(60);

  const queue = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.crewId === activeCrewId &&
          CHANNELS.some((channel) => channel.recipient === message.recipient),
      ),
    [messages, activeCrewId],
  );

  useEffect(() => {
    if (!breathing) return undefined;
    const timer = window.setInterval(
      () =>
        setBreathSeconds((seconds) => {
          if (seconds <= 1) {
            setBreathing(false);
            return 60;
          }
          return seconds - 1;
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [breathing]);

  const openCompose = (nextRecipient: Recipient) => {
    setRecipient(nextRecipient);
    setDraft("");
    setSavedMessage(null);
    setComposeOpen(true);
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    saveMessage({ crewId: member.id, recipient, text });
    setSavedMessage("Saved locally to the demo communication queue.");
    setDraft("");
  };

  return (
    <section className="page response-page support-page">
      <PageHeader
        eyebrow="Home / Support"
        title={`Make room for the next minute, ${member.name.split(" ").pop() || member.name}.`}
        description="Support here is a calm place to pause, document, or prepare a message. It is not a live contact service and makes no promise of a reply."
      />

      <Notice tone="info">
        <strong>For an immediate or serious concern:</strong> follow the
        approved mission emergency procedure. This page is for support and
        documentation, not diagnosis or treatment. Demo communication is a
        20-minute, one-way training window with no promised reply.
      </Notice>

      <div className="support-hero panel">
        <div className="support-hero-mark">
          <Heart size={25} />
        </div>
        <div>
          <span className="eyebrow">
            You do not have to solve everything at once
          </span>
          <h2>Choose the kind of support that would feel useful.</h2>
          <p className="muted">
            Your note stays on this device as a training/demo record until your
            mission software provides an approved communication path.
          </p>
        </div>
      </div>

      <div className="support-grid">
        {CHANNELS.map((channel) => (
          <Panel
            key={channel.recipient}
            className="support-channel"
            title={channel.title}
            subtitle={channel.description}
          >
            <div className="channel-icon" aria-hidden="true">
              {channel.icon === "heart" ? (
                <Heart size={20} />
              ) : (
                <MessageCircle size={20} />
              )}
            </div>
            <div className="channel-foot">
              <Badge tone="neutral">Demo channel</Badge>
              <button
                className="button primary small"
                onClick={() => openCompose(channel.recipient)}
              >
                <MessageCircle size={15} /> Compose locally
              </button>
            </div>
          </Panel>
        ))}
      </div>

      <Panel
        title="A short on-device breathing pause"
        subtitle="A simple timing exercise, not a clinical intervention. Stop whenever you want."
      >
        <div className="breath-layout">
          <div
            className={`breath-orb${breathing ? " is-active" : ""}`}
            aria-hidden="true"
          >
            <Wind size={28} />
          </div>
          <div className="breath-copy">
            <span className="eyebrow">
              Optional · {formatBreath(breathSeconds)} remaining
            </span>
            <h3>In for four, out for six.</h3>
            <p className="small-text muted">
              Let the circle guide a comfortable pace. No result is recorded.
            </p>
            <div className="row">
              <button
                className="button primary small"
                onClick={() => setBreathing((value) => !value)}
              >
                {breathing ? <Pause size={15} /> : <Play size={15} />}
                {breathing ? "Pause" : "Start pause"}
              </button>
              <button
                className="button ghost small"
                onClick={() => {
                  setBreathing(false);
                  setBreathSeconds(60);
                }}
              >
                <RefreshCcw size={15} /> Reset
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Local demo queue"
        subtitle="These records are saved on this device for demonstration. They are not sent, delivered, or monitored."
      >
        {queue.length ? (
          <div className="queue-list">
            {queue.slice(0, 4).map((message) => (
              <article className="queue-item" key={message.id}>
                <div className="row spread">
                  <div className="row">
                    <Avatar name={member.name} size="sm" />
                    <strong>{message.recipient}</strong>
                  </div>
                  <span className="small-text muted">
                    {new Date(message.at).toLocaleString()}
                  </span>
                </div>
                <p>{message.text}</p>
                <span className="small-text muted">
                  Saved locally · one-way demo record
                </span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="message-circle"
            title="Nothing saved yet"
            description="A locally composed note will appear here without implying a live connection."
          />
        )}
      </Panel>

      <Dialog
        className="response-dialog"
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose a local demo note"
      >
        <form className="dialog-body stack" onSubmit={submitMessage}>
          <div className="compose-recipient">
            <Avatar name={recipient} size="md" />
            <div>
              <span className="eyebrow">Recipient label</span>
              <strong>{recipient}</strong>
            </div>
          </div>
          <Notice tone="info">
            This 20-minute demo communication window is one-way and local. No
            actual contact is made, no availability is shown, and no reply is
            promised.
          </Notice>
          <label className="field">
            <span className="field-label">Your note</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write what you want recorded…"
              rows={6}
              autoFocus
            />
          </label>
          {savedMessage && (
            <p className="form-success">
              <Send size={15} /> {savedMessage}
            </p>
          )}
          <div className="row dialog-actions">
            <button
              type="button"
              className="button ghost"
              onClick={() => setComposeOpen(false)}
            >
              <X size={16} /> Close
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!draft.trim()}
            >
              <Send size={16} /> Save to demo queue
            </button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
