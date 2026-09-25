import { NavLink } from 'react-router-dom'
import { Map, Camera, FileText, CircleHelp } from 'lucide-react'

const links = [
  { to: '/', icon: Map, label: 'Map', end: true },
  { to: '/capture', icon: Camera, label: 'Report' },
  { to: '/my-reports', icon: FileText, label: 'Mine' },
  { to: '/help', icon: CircleHelp, label: 'Help' },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors duration-150',
                isActive ? 'text-accent' : 'text-text-secondary',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                <span className="leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
