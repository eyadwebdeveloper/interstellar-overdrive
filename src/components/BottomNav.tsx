import { NavLink } from 'react-router-dom'
import { Home, Activity, AlertTriangle, Dumbbell, Plus, Siren } from 'lucide-react'

const ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: Activity, label: 'Health' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/exercise', icon: Dumbbell, label: 'Exercise' },
] as const

export default function BottomNav() {
  const link = ({ isActive }: { isActive: boolean }) => `aura-nav-item${isActive ? ' active' : ''}`
  return (
    <nav className="aura-nav" aria-label="Main navigation">
      {ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className={link}>
          <span className="aura-nav-icon"><Icon size={22} /></span>{label}
        </NavLink>
      ))}
      <NavLink to="/checkin" className="aura-nav-center" aria-label="Check-in"><Plus size={24} /></NavLink>
      {ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={link}>
          <span className="aura-nav-icon"><Icon size={22} /></span>{label}
        </NavLink>
      ))}
      <NavLink to="/medical-event" className="aura-nav-item aura-nav-sos">
        <span className="aura-nav-icon"><Siren size={20} /></span>Emergency
      </NavLink>
    </nav>
  )
}
