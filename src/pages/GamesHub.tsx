import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bone, Brain, Gamepad2, Moon, Salad, Sparkles, type LucideIcon } from "lucide-react";
import { Badge, PageHeader, Panel } from "../components/ui";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import { GAMES } from "../data/gamesData";
import { Stars } from "./games/parts";
import { FadeIn, useMotionAllowed, EASE } from "../components/motion";
import "../styles/games.css";

const MotionLink = motion.create(Link);

const GAME_ICONS: Record<string, LucideIcon> = {
  salad: Salad,
  bone: Bone,
  moon: Moon,
  brain: Brain,
};

export default function GamesHub() {
  const member = useCrewStore((s) => s.getActiveMember());
  const results = useAppStore((s) => s.gameResults);
  const crewResults = results.filter((r) => r.crewId === member.id);
  const recent = crewResults.slice(0, 5);
  const played = new Set(crewResults.map((r) => r.gameId));
  const motionOk = useMotionAllowed();

  return (
    <div className="page games-page">
      <PageHeader
        eyebrow="Training room"
        title="Learn by playing"
        description="Four short rounds that rehearse how the body actually behaves far from Earth — nutrition, countermeasures, the body clock, and the folklore."
        actions={
          <Badge tone="success" dot>
            {played.size} of {GAMES.length} games tried
          </Badge>
        }
      />
      <section className="games-intro">
        <FadeIn className="games-intro-copy" delay={0.05}>
          <div className="eyebrow">
            <Sparkles size={13} /> MICROGRAVITY SCHOOL
          </div>
          <h2>
            Small games.
            <br />
            Steady instincts.
          </h2>
          <p>
            Countermeasures only work when the reasoning is second nature.
            Each round takes a few quiet minutes, explains itself as it goes,
            and keeps your best result on this profile.
          </p>
        </FadeIn>
        <span className="games-intro-badge">
          <Gamepad2 size={16} /> Scores stay in this browser · demo workspace
        </span>
      </section>
      <div className="games-grid">
        {GAMES.map((game, i) => {
          const Icon = GAME_ICONS[game.icon];
          const runs = crewResults.filter((r) => r.gameId === game.id);
          const bestRun = runs.length
            ? runs.reduce((top, r) => (r.score > top.score ? r : top))
            : null;
          return (
            <MotionLink
              key={game.id}
              to={game.route}
              className="game-card"
              initial={motionOk ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                motionOk
                  ? { duration: 0.45, delay: 0.15 + i * 0.07, ease: EASE }
                  : { duration: 0 }
              }
              whileTap={motionOk ? { scale: 0.97 } : undefined}
            >
              <div className="game-card-top">
                <span className="game-card-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <Badge>{game.minutes} min</Badge>
              </div>
              <h3>{game.title}</h3>
              <p className="game-card-short">{game.short}</p>
              <div className="game-card-teaches">
                <span>YOU PRACTISE</span>
                <strong>{game.teaches}</strong>
              </div>
              <div className="game-card-foot">
                {bestRun ? (
                  <span className="game-card-best">
                    <Stars value={bestRun.stars} />
                    Best {bestRun.score}
                    {game.id === "facts" ? " of 12" : ""}
                  </span>
                ) : (
                  <span className="game-card-best empty">Not played yet</span>
                )}
                <span className="text-link">Play</span>
              </div>
            </MotionLink>
          );
        })}
      </div>
      {recent.length > 0 && (
        <Panel
          title="Recent rounds"
          subtitle={`${member.name} · this browser only`}
        >
          <div className="clock-log">
            {recent.map((r) => {
              const game = GAMES.find((g) => g.id === r.gameId);
              return (
                <div className="clock-log-row" key={r.id}>
                  <Sparkles size={15} aria-hidden="true" />
                  <strong>{game ? game.title : r.gameId}</strong>
                  <span className="clock-log-points">
                    {game?.id === "facts" ? `${r.score}/${r.maxScore}` : `${r.score} pts`}
                  </span>
                  <span className="small-text muted">
                    {new Date(r.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Stars value={r.stars} />
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      <div className="games-quiet">
        <Gamepad2 size={17} />
        <p>
          These rounds are educational demos in the same spirit as the rest of
          this workspace: mechanics are simplified for play, figures quoted in
          the summaries are real, and nothing here is clinical advice. Switch
          profiles from the header to keep scores per crew member.
        </p>
      </div>
    </div>
  );
}
