import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Avatar, Badge, PageHeader, Panel } from "../components/ui";
import { useCrewStore } from "../stores/crewStore";
import { useAppStore } from "../stores/appStore";
export default function CrewPage() {
  const crew = useCrewStore((s) => s.crew);
  const member = useCrewStore((s) => s.getActiveMember());
  const switchCrew = useCrewStore((s) => s.setActiveCrewId);
  const checkins = useAppStore((s) => s.checkins);
  return (
    <div className="page">
      <PageHeader
        eyebrow="CONNECTED CARE"
        title="Your people, in orbit."
        description="A small crew. A shared mission. Know who’s close by."
        actions={<Badge tone="info">Demo crew directory</Badge>}
      />
      <div className="crew-grid">
        {crew.map((c) => (
          <Panel key={c.id} className="crew-card">
            <div className="spread">
              <Avatar name={c.name} size="lg" />
              {member.id === c.id && (
                <Badge tone="success" dot>
                  Active profile
                </Badge>
              )}
            </div>
            <h2>{c.name}</h2>
            <p className="muted">{c.role}</p>
            <div className="crew-specialties">
              {c.specialties.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <div className="crew-last-log">
              <ShieldCheck size={16} />
              {checkins.some((x) => x.crewId === c.id)
                ? "Has a locally saved check-in"
                : "No saved check-ins yet"}
            </div>
            <button
              className={`button full ${member.id === c.id ? "secondary" : "primary"}`}
              onClick={() => switchCrew(c.id)}
              disabled={member.id === c.id}
            >
              {member.id === c.id ? (
                <>
                  <Check size={16} />
                  Viewing this profile
                </>
              ) : (
                <>
                  View demo profile
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </Panel>
        ))}
      </div>
      <div className="notice notice-info">
        <ShieldCheck size={20} />
        <p>
          Profiles share illustrative vital data. Saved check-ins, sessions and
          alert actions remain separate for each member. This prototype is not a
          live crew-monitoring system.
        </p>
      </div>
      <Link className="button secondary" to="/support">
        Open the care workspace
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
