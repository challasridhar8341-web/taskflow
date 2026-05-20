interface Stats { total: number; inProgress: number; done: number; overdue: number }

export default function StatsGrid({ stats }: { stats: Stats }) {
  const completionPct = stats.total ? Math.round(stats.done / stats.total * 100) : 0
  const cards = [
    { label: 'Total Tasks',  value: stats.total,       sub: 'across all projects',           bar: '#2575fc', icon: '📋', from: '#eef6ff', to: '#e0f0ff' },
    { label: 'In Progress',  value: stats.inProgress,  sub: 'actively being worked on',      bar: '#f59e0b', icon: '🔄', from: '#fffbeb', to: '#fef3c7' },
    { label: 'Completed',    value: stats.done,        sub: `${completionPct}% completion rate`, bar: '#06d6a0', icon: '✅', from: '#f0fdf9', to: '#d1fae5' },
    { label: 'Overdue',      value: stats.overdue,     sub: 'need attention',                bar: '#ef4444', icon: '⚠️', from: '#fff1f2', to: '#ffe4e6' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="card p-5 relative overflow-hidden" style={{background:`linear-gradient(135deg,${c.from},${c.to})`}}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{background:c.bar}} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#64748b] uppercase tracking-wider font-semibold">{c.label}</p>
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className="text-4xl font-bold tabular-nums mb-1 leading-none text-accent">{c.value}</p>
            <p className="text-xs text-[#94a3b8] mt-2">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
