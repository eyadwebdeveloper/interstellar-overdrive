import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Salad,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, PageHeader, Panel } from "../../components/ui";
import { useAppStore } from "../../stores/appStore";
import { useCrewStore } from "../../stores/crewStore";
import { useMotionAllowed, EASE } from "../../components/motion";
import { FUEL_PAIRS, type FuelPair } from "../../data/gamesData";
import { Stars, shuffle, starsFromThresholds } from "./parts";
import "../../styles/games.css";

interface Board {
  needs: FuelPair[];
  rations: FuelPair[];
}

const START_NOTE =
  "Pick a body need on the left, then tap the ration that answers it.";

export default function FuelGame() {
  const member = useCrewStore((s) => s.getActiveMember());
  const results = useAppStore((s) => s.gameResults);
  const saveGameResult = useAppStore((s) => s.saveGameResult);
  const motionOk = useMotionAllowed();
  const [board, setBoard] = useState<Board>(() => ({
    needs: shuffle(FUEL_PAIRS),
    rations: shuffle(FUEL_PAIRS),
  }));
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [feed, setFeed] = useState<FuelPair[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<{ need: string | null; ration: string | null } | null>(null);
  const [statusNote, setStatusNote] = useState(START_NOTE);
  const saved = useRef(false);

  const done = matched.length === FUEL_PAIRS.length;
  const score = Math.max(0, 100 - 14 * mistakes);
  const stars = starsFromThresholds(score, 86, 58, 30);

  useEffect(() => {
    if (!done || saved.current) return;
    saved.current = true;
    saveGameResult({
      crewId: member.id,
      gameId: "fuel",
      score,
      maxScore: 100,
      stars,
      summary:
        mistakes === 0
          ? "Every ration matched, no misses."
          : `${FUEL_PAIRS.length} matched with ${mistakes} mistap${mistakes === 1 ? "" : "s"}.`,
    });
  }, [done, member.id, mistakes, saveGameResult, score, stars]);

  useEffect(() => {
    if (!wrong) return;
    const id = window.setTimeout(() => setWrong(null), 600);
    return () => window.clearTimeout(id);
  }, [wrong]);

  const pickNeed = (id: string) => {
    if (matched.includes(id) || done) return;
    setSelectedNeed((current) => (current === id ? null : id));
    setStatusNote("Now tap the ration on the right that answers this need.");
  };

  const pickRation = (pair: FuelPair) => {
    if (matched.includes(pair.id) || done) return;
    if (!selectedNeed) {
      setStatusNote("Choose a body need first — the ration needs its why.");
      setWrong({ need: null, ration: pair.id });
      return;
    }
    if (pair.id === selectedNeed) {
      const next = [...matched, pair.id];
      setMatched(next);
      setFeed((items) => [...items, pair]);
      setSelectedNeed(null);
      setStatusNote(
        next.length === FUEL_PAIRS.length
          ? "All systems fuelled."
          : `${next.length} of ${FUEL_PAIRS.length} matched — keep going.`,
      );
      return;
    }
    setMistakes((n) => n + 1);
    setWrong({ need: selectedNeed, ration: pair.id });
    setStatusNote(
      "Not the strongest pairing for that need — look again at what that system is really asking for.",
    );
  };

  const restart = () => {
    saved.current = false;
    setBoard({
      needs: shuffle(FUEL_PAIRS),
      rations: shuffle(FUEL_PAIRS),
    });
    setSelectedNeed(null);
    setMatched([]);
    setFeed([]);
    setMistakes(0);
    setWrong(null);
    setStatusNote(START_NOTE);
  };

  const pastRuns = results.filter(
    (r) => r.crewId === member.id && r.gameId === "fuel",
  );
  const best = pastRuns.reduce((top, r) => Math.max(top, r.score), 0);

  return (
    <div className="page games-page fuel">
      <PageHeader
        eyebrow="Training room · Nutrition"
        title="Fuel the crew"
        description="Six body systems are talking. Six rations answer. Connect each need to the ration that actually meets it — and read why it works."
        actions={
          <Link to="/games" className="button ghost small">
            <ArrowLeft size={15} /> Training room
          </Link>
        }
      />
      <div className="games-topbar">
        <div className="row">
          <Badge tone="info" dot>
            6 pairings
          </Badge>
          <Badge>3 minutes · calm pace</Badge>
        </div>
        {pastRuns.length > 0 && (
          <span className="game-card-best">
            <Stars value={starsFromThresholds(best, 86, 58, 30)} /> Best {best}
          </span>
        )}
      </div>
      <div className="game-layout">
        <Panel
          className="fuel"
          title="The board"
          subtitle="Needs on the left · rations on the right"
        >
          {!done ? (
            <>
              <div
                className={`game-status ${wrong ? "warn" : ""}`}
                role="status"
                aria-live="polite"
              >
                <span>{statusNote}</span>
                <span>
                  {matched.length}/{FUEL_PAIRS.length} · {mistakes} miss
                  {mistakes === 1 ? "" : "es"}
                </span>
              </div>
              <div className="fuel-columns">
                <div className="fuel-column" aria-label="Body needs">
                  <span className="fuel-column-label">The body asks</span>
                  {board.needs.map((pair) => {
                    const isMatched = matched.includes(pair.id);
                    const isSelected = selectedNeed === pair.id;
                    return (
                      <motion.button
                        key={pair.id}
                        type="button"
                        className={`fuel-need ${isMatched ? "matched" : isSelected ? "selected" : ""} ${
                          wrong?.need === pair.id ? "wrong" : ""
                        }`}
                        onClick={() => pickNeed(pair.id)}
                        disabled={isMatched}
                        aria-pressed={isSelected}
                        animate={
                          motionOk
                            ? wrong?.need === pair.id
                              ? { x: [0, -7, 6, -4, 3, 0] }
                              : isMatched
                                ? { scale: [1, 1.06, 1] }
                                : { x: 0, scale: 1 }
                            : undefined
                        }
                        transition={
                          motionOk
                            ? { duration: 0.4, ease: "easeInOut" }
                            : undefined
                        }
                        whileTap={motionOk ? { scale: 0.97 } : undefined}
                      >
                        <span className="fuel-mark" aria-hidden="true">
                          {isMatched ? (
                            <Check size={16} />
                          ) : (
                            pair.system.charAt(0)
                          )}
                        </span>
                        <span>{pair.need}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="fuel-column" aria-label="Rations">
                  <span className="fuel-column-label">The galley answers</span>
                  {board.rations.map((pair) => {
                    const isMatched = matched.includes(pair.id);
                    return (
                      <motion.button
                        key={pair.id}
                        type="button"
                        className={`fuel-ration ${isMatched ? "matched" : ""} ${
                          wrong?.ration === pair.id ? "wrong" : ""
                        }`}
                        onClick={() => pickRation(pair)}
                        disabled={isMatched}
                        animate={
                          motionOk
                            ? wrong?.ration === pair.id
                              ? { x: [0, -7, 6, -4, 3, 0] }
                              : isMatched
                                ? { scale: [1, 1.05, 1] }
                                : { x: 0, scale: 1 }
                            : undefined
                        }
                        transition={
                          motionOk
                            ? { duration: 0.4, ease: "easeInOut" }
                            : undefined
                        }
                        whileTap={motionOk ? { scale: 0.97 } : undefined}
                      >
                        <span className="fuel-mark" aria-hidden="true">
                          {isMatched ? <Check size={16} /> : <Salad size={15} />}
                        </span>
                        <span className="fuel-ration-body">
                          <strong>{pair.ration}</strong>
                          <small>{pair.rationNote}</small>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div className="fuel-feed" aria-live="polite">
                {feed.map((pair) => (
                  <motion.div
                    className="fuel-feed-item"
                    key={pair.id}
                    initial={motionOk ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      motionOk ? { duration: 0.3, ease: EASE } : { duration: 0 }
                    }
                  >
                    <UtensilsCrossed size={16} aria-hidden="true" />
                    <div>
                      <strong>
                        {pair.ration} → {pair.system.toLowerCase()}
                      </strong>
                      <p>{pair.explain}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="games-result">
              <span className="eyebrow-result">
                Round complete · {member.name}
              </span>
              <h2>
                {mistakes === 0
                  ? "Every system fuelled, first try."
                  : mistakes <= 2
                    ? "The crew eats well tonight."
                    : "Fed — with a few mixed rations."}
              </h2>
              <Stars value={stars} />
              <p>
                Score {score} of 100 · {mistakes} mistap
                {mistakes === 1 ? "" : "s"} across {FUEL_PAIRS.length}{" "}
                pairings. Saved for this profile.
              </p>
              <div className="games-result-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={restart}
                >
                  <RotateCcw size={16} /> Play again
                </button>
                <Link to="/games/facts" className="button secondary">
                  Next: Fact from fiction
                </Link>
              </div>
            </div>
          )}
        </Panel>
        <aside className="game-side">
          <Panel
            title="This run"
            subtitle="Not saved until every pair is matched"
          >
            <div className="game-status neutral">
              <span>Matched</span>
              <strong>
                {matched.length}/{FUEL_PAIRS.length}
              </strong>
            </div>
            <div className="game-status neutral">
              <span>Mistaps</span>
              <strong>{mistakes}</strong>
            </div>
          </Panel>
          <Panel title="Recent rounds" subtitle="This crew member only">
            {pastRuns.length ? (
              <div className="clock-log">
                {pastRuns.slice(0, 4).map((r) => (
                  <div className="clock-log-row" key={r.id}>
                    <Check size={15} aria-hidden="true" />
                    <strong>
                      {new Date(r.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="clock-log-points">{r.score} pts</span>
                    <Stars value={r.stars} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small-text">
                No finished rounds yet — a completed board saves here.
              </p>
            )}
          </Panel>
          <div className="games-quiet">
            <Salad size={17} />
            <p>
              Pairings reflect standard space-nutrition thinking: calcium and
              vitamin D support bone, iron supports red cells, electrolytes
              support fluid balance, protein supports muscle, omega-3s and
              antioxidants are studied for immune and cell protection. Menu
              planning is a real countermeasure discipline — this round is a
              friendly simplification.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
