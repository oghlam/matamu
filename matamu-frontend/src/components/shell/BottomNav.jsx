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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-line shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center px-2">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className="flex-1 flex flex-col items-center justify-center py-2 group relative"
          >
            {({ isActive }) => (
              <>
                {/* Top indicator bar - iOS style */}
                <div
                  className={[
                    'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ease-out',
                    isActive ? 'w-12 bg-accent opacity-100' : 'w-0 bg-accent opacity-0',
                  ].join(' ')}
                />

                {/* Icon container with background */}
                <div className="relative">
                  {/* Active background pill */}
                  <div
                    className={[
                      'absolute inset-0 rounded-2xl transition-all duration-300 ease-out',
                      isActive
                        ? 'bg-accent/10 scale-100 opacity-100'
                        : 'bg-transparent scale-90 opacity-0 group-active:scale-95 group-active:opacity-100 group-active:bg-accent/5',
                    ].join(' ')}
                    style={{ width: '56px', height: '32px', left: '-20px', top: '-4px' }}
                  />

                  {/* Icon with scale animation */}
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={[
                      'relative z-10 transition-all duration-300 ease-out',
                      isActive
                        ? 'text-accent scale-100'
                        : 'text-text-secondary scale-90 group-active:scale-95',
                    ].join(' ')}
                    style={{
                      filter: isActive ? 'drop-shadow(0 2px 4px rgba(244, 169, 0, 0.2))' : 'none',
                    }}
                  />
                </div>

                {/* Label with smooth fade */}
                <span
                  className={[
                    'text-[11px] font-semibold leading-none mt-1 transition-all duration-300 ease-out',
                    isActive
                      ? 'text-accent opacity-100 translate-y-0'
                      : 'text-text-secondary opacity-70 translate-y-0.5 group-active:opacity-100',
                  ].join(' ')}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
