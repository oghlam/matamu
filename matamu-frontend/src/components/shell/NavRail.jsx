import { NavLink } from 'react-router-dom'
import { Map, Camera, FileText } from 'lucide-react'

const links = [
  { to: '/', icon: Map, label: 'Map' },
  { to: '/capture', icon: Camera, label: 'Report' },
  { to: '/my-reports', icon: FileText, label: 'My Reports' },
]

export default function NavRail() {
  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex flex-col items-center gap-1 w-[76px] py-6 bg-surface border-r border-line shrink-0"
    >
      {/* Logo / brand mark */}
      <img
        src="/logo.png"
        alt="Mat(a)Mu"
        className="w-10 h-10 rounded-xl object-cover mb-4 shrink-0 shadow-card"
      />

      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          title={label}
          aria-label={label}
          className={({ isActive }) =>
            [
              'group relative flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-150 transition-spatial',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
            ].join(' ')
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {/* Tooltip */}
          <span className="pointer-events-none absolute left-14 whitespace-nowrap bg-dark text-white text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
