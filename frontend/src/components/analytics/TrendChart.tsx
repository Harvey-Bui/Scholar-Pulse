interface Props {
  data: { date: string; hours: number }[];
}

// Mirrors the dashboard's own weekly-productivity bar chart styling (today
// highlighted in a brighter accent, others in the muted accent-700) so the
// two charts read as the same visual system.
export function TrendChart({ data }: Props) {
  const width = 720;
  const height = 160;
  const barGap = 3;
  const barWidth = data.length ? (width - barGap * (data.length - 1)) / data.length : 0;
  const max = Math.max(3, ...data.map(d => d.hours));
  const today = new Date().toLocaleDateString('en-CA');
  const showLabels = data.length <= 31;

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full" role="img" aria-label="Study hours trend">
      {data.map((d, i) => {
        const barHeight = Math.max(2, (d.hours / max) * height);
        const x = i * (barWidth + barGap);
        const isToday = d.date === today;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill={isToday ? 'var(--color-accent-400)' : d.hours ? 'var(--color-accent-700)' : 'var(--color-neutral-900)'}
            >
              <title>{`${d.date}: ${d.hours}h`}</title>
            </rect>
            {showLabels && data.length <= 14 && (
              <text x={x + barWidth / 2} y={height + 14} fontSize="9" textAnchor="middle" fill="var(--color-neutral-600)">
                {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric' })}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
