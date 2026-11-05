/** Set smooth when the value is updated every frame, so the width transition does not lag behind. */
export function ProgressBar({ value, label, smooth = false }: { value: number; label?: string; smooth?: boolean }) {
  const fraction = Math.max(0, Math.min(1, value))
  const percent = Math.round(fraction * 100)
  return (
    <div
      className={smooth ? 'progress smooth' : 'progress'}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${fraction * 100}%` }} />
    </div>
  )
}
