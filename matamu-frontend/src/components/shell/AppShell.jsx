import { Outlet } from 'react-router-dom'
import NavRail from './NavRail'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Desktop: icon rail (left) */}
      <NavRail />

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>

      {/* Mobile: bottom nav */}
      <BottomNav />
    </div>
  )
}
