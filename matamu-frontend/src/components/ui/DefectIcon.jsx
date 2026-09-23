// Centralized road-defect icon mapping. Artwork: public/icons/*.svg (line-art, currentColor).
// Usage: <DefectIcon type="pothole" size={20} />
const defectIcons = {
  pothole: '/icons/pothole.svg',
  longitudinal_crack: '/icons/longitudinal-crack.svg',
  alligator_crack: '/icons/alligator-crack.svg',
  rutting: '/icons/rutting.svg',
  flooding: '/icons/flooding.svg',
  surface_degradation: '/icons/surface-degradation.svg',
}

const VALID_SIZES = [16, 20, 24, 32]

export default function DefectIcon({ type, size = 20, className = '' }) {
  const src = defectIcons[type]
  if (!src) return null
  const s = VALID_SIZES.includes(size) ? size : 20
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={s}
      height={s}
      className={['shrink-0', className].join(' ')}
      style={{ width: s, height: s }}
    />
  )
}

export { defectIcons }
