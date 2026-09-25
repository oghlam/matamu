import { Camera, MapPin, Smartphone, ShieldCheck, Info, Layers } from 'lucide-react'
import DefectIcon from '../../components/ui/DefectIcon'

const LEGEND = [
  { type: 'pothole', name: 'Pothole', desc: 'Depression / hole — sharp edge, risk to tires' },
  { type: 'longitudinal_crack', name: 'Longitudinal Crack', desc: 'Long linear crack along road direction' },
  { type: 'alligator_crack', name: 'Alligator Crack', desc: 'Interconnected cracking — resembles alligator skin' },
  { type: 'rutting', name: 'Rutting', desc: 'Wheel-path deformation — groove in lane' },
  { type: 'flooding', name: 'Flooding', desc: 'Standing / flowing water covering surface' },
  { type: 'surface_degradation', name: 'Surface Degradation', desc: 'Worn / fragmented / raveling surface' },
]

export default function Help() {
  return (
    <div className="flex-1 overflow-y-auto p-3 pb-24 md:pb-3 space-y-3">
      <header className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-dark text-white flex items-center justify-center shrink-0">
          <Info size={16} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-text-primary leading-none">Help & Guide</h1>
          <p className="text-[11px] text-text-secondary leading-none mt-0.5">Take shot & icon legend</p>
        </div>
      </header>

      {/* 1. Take shot + GPS */}
      <section className="bg-surface rounded-lg shadow-card p-3 space-y-2">
        <h2 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <Camera size={14} className="text-accent" /> How to take a valid shot
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-text-secondary leading-relaxed">
          <li>Open <span className="font-semibold text-text-primary">Report → Camera</span> (or Upload).</li>
          <li>Center damage in <span className="font-semibold">circle + crosshair</span> — 1–2 m distance.</li>
          <li>Hold steady, good light. Tap shutter or <span className="font-semibold">double-tap viewfinder</span>.</li>
          <li>Add small note if needed (e.g., “hole near drain”).</li>
          <li>Ensure <span className="font-semibold text-success">GPS active</span> before Save.</li>
        </ol>
        <div className="rounded-md bg-dark text-white px-2.5 py-2 flex items-center gap-1.5 text-[11px]">
          <ShieldCheck size={12} className="text-accent shrink-0" />
          <span>Faces auto-blurred (SFace) — privacy safe.</span>
        </div>
      </section>

      <section className="bg-surface rounded-lg shadow-card p-3 space-y-2">
        <h2 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <MapPin size={14} className="text-accent" /> Enable GPS & Save Location
        </h2>
        <p className="text-[11px] text-text-secondary leading-relaxed">No GPS = rejected. Enable for browser & camera.</p>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-line p-2.5 space-y-1.5">
            <p className="text-[11px] font-bold text-text-primary flex items-center gap-1"><Smartphone size={12} /> Android</p>
            <ol className="list-decimal list-inside text-[11px] text-text-secondary space-y-0.5 leading-relaxed">
              <li><span className="font-semibold">Settings → Location</span> ON, <span className="font-semibold">High accuracy</span>.</li>
              <li>Browser: Allow “Location” (Chrome → site settings).</li>
              <li>Camera: <span className="font-semibold">Settings → Save location</span> ON.</li>
              <li>PWA left vertical <span className="font-semibold">“GPS active”</span> + green dot.</li>
            </ol>
          </div>
          <div className="rounded-md border border-line p-2.5 space-y-1.5">
            <p className="text-[11px] font-bold text-text-primary flex items-center gap-1"><Smartphone size={12} /> iPhone (iOS)</p>
            <ol className="list-decimal list-inside text-[11px] text-text-secondary space-y-0.5 leading-relaxed">
              <li><span className="font-semibold">Settings → Privacy → Location Services</span> ON.</li>
              <li><span className="font-semibold">Camera → While Using</span> enable.</li>
              <li>Also for <span className="font-semibold">Safari/Chrome</span> → While Using.</li>
              <li>Same left vertical <span className="font-semibold text-success">active</span>.</li>
            </ol>
          </div>
        </div>
        <p className="text-[10px] text-text-muted bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 leading-relaxed">
          Tip: “GPS off/Searching…” → outdoors, High accuracy, Retry. Gallery &gt;500 m EXIF gap → human review.
        </p>
      </section>

      {/* 2. Icon legend */}
      <section className="bg-surface rounded-lg shadow-card p-3 space-y-2">
        <h2 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <Layers size={14} className="text-accent" /> Icon Legend
        </h2>
        <p className="text-[11px] text-text-secondary leading-relaxed">Same artwork as dashboard. Tap map filter to focus.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEGEND.map(i => (
            <div key={i.type} className="flex items-center gap-2.5 rounded-md border border-line p-2 bg-surface-2/50">
              <div className="w-8 h-8 rounded-md bg-white border border-line flex items-center justify-center shrink-0">
                <DefectIcon type={i.type} size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-text-primary leading-tight">{i.name}</p>
                <p className="text-[10px] text-text-secondary leading-tight line-clamp-1">{i.desc}</p>
                <p className="text-[9px] text-text-muted font-mono">{i.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[10px] text-text-muted text-center">Check map filter “All Types” to see clusters.</p>
    </div>
  )
}
