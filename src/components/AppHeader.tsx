import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Settings, Check, X } from 'lucide-react'
import { useCrewStore } from '../stores/crewStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAlerts } from '../hooks/useAura'

interface HeaderProps {
  showBack?: boolean
  backTo?: string
  title?: string
  showLogo?: boolean
}

const initialsOf = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2)

export default function AppHeader({ showLogo = true, title }: HeaderProps) {
  const member = useCrewStore((s) => s.getActiveMember())
  const crew = useCrewStore((s) => s.crew)
  const setActive = useCrewStore((s) => s.setActiveCrewId)
  const animations = useSettingsStore((s) => s.animationsEnabled)
  const setAnimations = useSettingsStore((s) => s.setAnimationsEnabled)
  const [open, setOpen] = useState(false)

  const unacknowledged = useAlerts().filter((a) => !a.acknowledged).length

  return (
    <>
      <header className="aura-header">
        <div className="aura-header-left">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {showLogo && (
              <>
                <span className="aura-logo">AURA</span>
                <span className="aura-logo-sub">AstroVitals</span>
              </>
            )}
            {title && !showLogo && (
              <span className="aura-logo" style={{ color: 'var(--aura-text)' }}>{title}</span>
            )}
          </Link>
        </div>
        <div className="aura-header-right">
          <Link
            to="/alerts"
            className="aura-header-btn"
            aria-label={`Alerts, ${unacknowledged} unacknowledged`}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unacknowledged > 0 && (
              <span className="aura-badge" style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, fontSize: 10 }}>
                {unacknowledged}
              </span>
            )}
          </Link>
          <button className="aura-header-btn" aria-label="Settings" aria-expanded={open} onClick={() => setOpen(true)}>
            <Settings size={18} />
          </button>
          <button
            className="aura-avatar"
            style={{ background: member.color, border: 0 }}
            title={member.name}
            aria-label={`Profile: ${member.name}. Open settings`}
            onClick={() => setOpen(true)}
          >
            {initialsOf(member.name)}
          </button>
        </div>
      </header>

      {open && (
        <div className="rf-sheet-scrim" role="dialog" aria-modal="true" aria-label="Settings" onClick={() => setOpen(false)}>
          <div className="rf-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="rf-sheet-handle" />
            <div className="rf-spread">
              <h2>Settings</h2>
              <button className="aura-header-btn" onClick={() => setOpen(false)} aria-label="Close settings"><X size={18} /></button>
            </div>

            <div>
              <div className="rf-eyebrow" style={{ marginBottom: 8 }}>Viewing as</div>
              <div className="rf-list">
                {crew.map((c) => (
                  <button
                    key={c.id}
                    className="rf-row-card"
                    style={{ textAlign: 'left', borderColor: c.id === member.id ? 'rgba(124,92,252,.45)' : undefined }}
                    onClick={() => { setActive(c.id); setOpen(false) }}
                    aria-pressed={c.id === member.id}
                  >
                    <div className="aura-avatar" style={{ background: c.color }}>{initialsOf(c.name)}</div>
                    <div className="rf-row-main">
                      <div className="rf-row-title">{c.name}</div>
                      <div className="rf-row-sub">{c.role}</div>
                    </div>
                    {c.id === member.id && <Check size={16} style={{ color: 'var(--aura-purple)' }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="rf-sheet-row">
                <div>
                  <div className="rf-row-title">Motion</div>
                  <div className="rf-row-sub">Animate the body view and transitions</div>
                </div>
                <button
                  className="rf-switch"
                  role="switch"
                  aria-checked={animations}
                  aria-label="Motion"
                  onClick={() => setAnimations(!animations)}
                />
              </div>
              <div className="rf-sheet-row">
                <div>
                  <div className="rf-row-title">Data stays on device</div>
                  <div className="rf-row-sub">Nothing is sent to Earth unless you choose to send it.</div>
                </div>
              </div>
            </div>

            <p className="rf-note">Training use only. In a real emergency, follow official procedures.</p>
          </div>
        </div>
      )}
    </>
  )
}
