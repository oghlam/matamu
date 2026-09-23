import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import PublicMap from './pages/warga/PublicMap'
import Capture from './pages/warga/Capture'
import MyReports from './pages/warga/MyReports'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<PublicMap />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/my-reports" element={<MyReports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
