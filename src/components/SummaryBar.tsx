import type { Summary } from '../lib/stats'

/** Explains the bar colours once, above a list of bars without legends. */
export function BarKey() {
  return (
    <p className="legend small faint bar-key">
      <span>
        <i className="dot known" /> known: right twice in a row
      </span>
      <span>
        <i className="dot learning" /> learning: tried, not yet known
      </span>
      <span>
        <i className="dot new" /> new
      </span>
    </p>
  )
}

/** A bar split into known, learning and new questions, with a legend. */
export function SummaryBar({ summary, showLegend = true }: { summary: Summary; showLegend?: boolean }) {
  const width = (count: number) => `${(count / Math.max(1, summary.total)) * 100}%`
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div
        className="summary-bar"
        role="img"
        aria-label={`${summary.known} known, ${summary.learning} learning, ${summary.new} new`}
      >
        <span className="known" style={{ width: width(summary.known) }} />
        <span className="learning" style={{ width: width(summary.learning) }} />
      </div>
      {showLegend && (
        <div className="legend small">
          <span>
            <i className="dot known" /> {summary.known} known
          </span>
          <span>
            <i className="dot learning" /> {summary.learning} learning
          </span>
          <span>
            <i className="dot new" /> {summary.new} new
          </span>
        </div>
      )}
    </div>
  )
}
