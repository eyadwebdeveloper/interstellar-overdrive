import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Lightbulb,
  RotateCcw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, PageHeader, Panel } from "../../components/ui";
import { useAppStore } from "../../stores/appStore";
import { useCrewStore } from "../../stores/crewStore";
import { useMotionAllowed, EASE } from "../../components/motion";
import { FACT_DECK } from "../../data/gamesData";
import { Stars } from "./parts";
import "../../styles/games.css";

export default function FactsGame() {
  const member = useCrewStore((s) => s.getActiveMember());
  const results = useAppStore((s) => s.gameResults);
  const saveGameResult = useAppStore((s) => s.saveGameResult);
  const motionOk = useMotionAllowed();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() =>
    FACT_DECK.map(() => null),
  );
  const saved = useRef(false);

  const card = FACT_DECK[index];
  const finished = index >= FACT_DECK.length;
  const answered = answers[index] !== null && !finished;
  const correct = answers[index] === (card?.verdict === "fact");
  const score = answers.reduce(
    (sum, answer, i) =>
      answer !== null && answer === (FACT_DECK[i].verdict === "fact")
        ? sum + 1
        : sum,
    0,
  );
  const stars = score >= 11 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0;

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    saveGameResult({
      crewId: member.id,
      gameId: "facts",
      score,
      maxScore: FACT_DECK.length,
      stars,
      summary: `${score} of ${FACT_DECK.length} called right`,
    });
  }, [finished, member.id, score, saveGameResult, stars]);

  const answer = (saysFact: boolean) => {
    if (answered || finished) return;
    setAnswers((current) => {
      const copy = [...current];
      copy[index] = saysFact;
      return copy;
    });
  };

  const next = () => setIndex((n) => n + 1);

  const restart = () => {
    saved.current = false;
    setIndex(0);
    setAnswers(FACT_DECK.map(() => null));
  };

  const pastRuns = results.filter(
    (r) => r.crewId === member.id && r.gameId === "facts",
  );
  const best = pastRuns.reduce((top, r) => Math.max(top, r.score), 0);

  return (
    <div className="page games-page facts">
      <PageHeader
        eyebrow="Training room · Space health"
        title="Fact from fiction"
        description="Twelve claims about the body in space. Some are textbook, some are folklore — call each one, then read the truth of it."
        actions={
          <Link to="/games" className="button ghost small">
            <ArrowLeft size={15} /> Training room
          </Link>
        }
      />
      <div className="games-topbar">
        <div className="row">
          <Badge tone="info" dot>
            {FACT_DECK.length} claims
          </Badge>
          <Badge>3 minutes</Badge>
        </div>
        {pastRuns.length > 0 && (
          <span className="game-card-best">
            <Stars
              value={best >= 11 ? 3 : best >= 9 ? 2 : best >= 6 ? 1 : 0}
            />{" "}
            Best {best}/{FACT_DECK.length}
          </span>
        )}
      </div>
      <div className="game-layout">
        <Panel
          className="facts"
          title={finished ? "The full deck, called" : "Make the call"}
          subtitle={
            finished
              ? `${score} of ${FACT_DECK.length} judged right`
              : `Claim ${index + 1} of ${FACT_DECK.length}`
          }
        >
          <div className="facts-progress" aria-label="Round progress">
            {FACT_DECK.map((c, i) => (
              <span
                key={c.id}
                className={`load-dot ${
                  i < index
                    ? answers[i] === (FACT_DECK[i].verdict === "fact")
                      ? "right"
                      : "wrong"
                    : ""
                }`}
              />
            ))}
            <span className="facts-count">
              {Math.min(index + 1, FACT_DECK.length)} / {FACT_DECK.length}
            </span>
          </div>
          {!finished && card && (
            <>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  className="facts-claim"
                  key={card.id}
                  initial={motionOk ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={motionOk ? { opacity: 0, y: -10 } : undefined}
                  transition={
                    motionOk ? { duration: 0.22, ease: EASE } : { duration: 0 }
                  }
                >
                  <span className="facts-topic">{card.topic}</span>
                  <blockquote>{card.claim}</blockquote>
                </motion.div>
              </AnimatePresence>
              <div className="facts-choices">
                <motion.button
                  type="button"
                  className={`facts-choice ${
                    answers[index] === true ? (correct ? "chosen" : "dimmed") : answers[index] !== null ? "dimmed" : ""
                  }`}
                  onClick={() => answer(true)}
                  disabled={answered}
                  whileTap={motionOk ? { scale: 0.96 } : undefined}
                >
                  <Check size={19} /> Fact
                </motion.button>
                <motion.button
                  type="button"
                  className={`facts-choice ${
                    answers[index] === false ? (correct ? "chosen" : "dimmed") : answers[index] !== null ? "dimmed" : ""
                  }`}
                  onClick={() => answer(false)}
                  disabled={answered}
                  whileTap={motionOk ? { scale: 0.96 } : undefined}
                >
                  <X size={19} /> Myth
                </motion.button>
              </div>
              {answered && (
                <motion.div
                  className={`facts-verdict ${correct ? "" : "myth"}`}
                  role="status"
                  aria-live="polite"
                  initial={motionOk ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    motionOk ? { duration: 0.28, ease: EASE } : { duration: 0 }
                  }
                >
                  {correct ? (
                    <Check size={19} aria-hidden="true" />
                  ) : (
                    <X size={19} aria-hidden="true" />
                  )}
                  <div>
                    <strong>
                      {correct ? "Called it right. " : "Not quite. "}
                      It’s a {card.verdict}.
                    </strong>
                    <p>{card.why}</p>
                    <div className="facts-next">
                      <button
                        type="button"
                        className="button primary small"
                        onClick={next}
                      >
                        {index + 1 === FACT_DECK.length
                          ? "See the score"
                          : "Next claim"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          {finished && (
            <>
              <div className="games-result">
                <span className="eyebrow-result">
                  Deck complete · {member.name}
                </span>
                <h2>
                  {stars === 3
                    ? "A steady hand for folklore."
                    : stars === 2
                      ? "Mostly steady — a few claims got past you."
                      : "Space keeps its secrets better than that."}
                </h2>
                <Stars value={stars} />
                <p>
                  {score} of {FACT_DECK.length} claims judged right. Saved for
                  this profile.
                </p>
                <div className="games-result-actions">
                  <button
                    type="button"
                    className="button primary"
                    onClick={restart}
                  >
                    <RotateCcw size={16} /> Deal again
                  </button>
                  <Link to="/games" className="button secondary">
                    Back to the training room
                  </Link>
                </div>
              </div>
              <div className="facts-review">
                {FACT_DECK.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className={`facts-review-row ${
                      answers[i] === (c.verdict === "fact") ? "" : "wrong"
                    }`}
                    initial={motionOk ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      motionOk
                        ? { duration: 0.3, delay: i * 0.03, ease: EASE }
                        : { duration: 0 }
                    }
                  >
                    {answers[i] === (c.verdict === "fact") ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      <Lightbulb size={15} aria-hidden="true" />
                    )}
                    <p>
                      <strong>“{c.claim}”</strong>
                      <br />
                      <small>
                        {c.verdict === "fact" ? "Fact" : "Myth"} — {c.why}
                      </small>
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </Panel>
        <aside className="game-side">
          <Panel title="This round" subtitle="Not saved until the deck is done">
            <div className="game-status neutral">
              <span>Called right</span>
              <strong>{score}</strong>
            </div>
            <div className="game-status neutral">
              <span>Remaining</span>
              <strong>
                {FACT_DECK.length -
                  (finished
                    ? FACT_DECK.length
                    : index + (answers[index] !== null ? 1 : 0))}
              </strong>
            </div>
          </Panel>
          <Panel title="Recent rounds" subtitle="This crew member only">
            {pastRuns.length ? (
              <div className="clock-log">
                {pastRuns.slice(0, 4).map((r) => (
                  <div className="clock-log-row" key={r.id}>
                    <Brain size={15} aria-hidden="true" />
                    <strong>
                      {new Date(r.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="clock-log-points">
                      {r.score}/{r.maxScore}
                    </span>
                    <Stars value={r.stars} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small-text">
                No finished rounds yet — a completed deck saves here.
              </p>
            )}
          </Panel>
          <div className="games-quiet">
            <Brain size={17} />
            <p>
              Every claim here is chosen to be checkable: spine unloading,
              fluid shift, SANS, ALARA, caffeine half-life, the sixteen-sunrise
              problem. If a claim sounds surprising, that's exactly the one to
              go and verify afterwards — this round is a starting point, not a
              textbook.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
