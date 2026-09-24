// Shared share-button row (WA / IG / FB / TikTok / X).
// Props: title (location text), path (e.g. `/r/8`), compact (28px buttons).
// IG & TikTok have no web share intent → copy link instead.
export default function ShareButtons({ title = 'Road damage', path = '/', compact = false }) {
  const url = window.location.origin + path
  const enc = encodeURIComponent(`${title} via Mat(a)Mu ${url}`)
  const s = compact ? 28 : 34

  const glyph = inner =>
    `<svg width="${compact ? 14 : 16}" height="${compact ? 14 : 16}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

  const items = [
    {
      href: `https://wa.me/?text=${enc}`,
      bg: '#25D366',
      g: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
      label: 'Share to WhatsApp',
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      bg: '#1877F2',
      g: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
      label: 'Share to Facebook',
    },
    {
      href: `https://twitter.com/intent/tweet?text=${enc}`,
      bg: '#111311',
      g: '<path d="M4 4l16 16M20 4L4 20"/>',
      label: 'Share to X',
    },
  ]

  const copyBtn = (name, bg, initials) => (
    <button
      key={name}
      title={`Copy link for ${name}`}
      aria-label={`Copy link for ${name}`}
      onClick={() => navigator.clipboard?.writeText(url)}
      style={{
        width: s, height: s, borderRadius: '50%', background: bg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: compact ? 9 : 10, fontWeight: 800,
      }}
    >
      {initials}
    </button>
  )

  return (
    <div>
      <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-text-primary mb-1.5`}>Share it</p>
      <div className="flex gap-1.5 items-center">
        {items.map(it => (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener"
            title={it.label}
            aria-label={it.label}
            style={{
              width: s, height: s, borderRadius: '50%', background: it.bg,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
            dangerouslySetInnerHTML={{ __html: glyph(it.g) }}
          />
        ))}
        {copyBtn('Instagram', '#E1306C', 'IG')}
        {copyBtn('TikTok', '#111311', 'TT')}
      </div>
    </div>
  )
}
