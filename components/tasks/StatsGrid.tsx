interface Stats { total: number; inProgress: number; done: number; overdue: number }

export default function StatsGrid({ stats }: { stats: Stats }) {
  const completionPct = stats.total ? Math.round(stats.done / stats.total * 100) : 0
  const cards = [
    { label: 'Total Tasks',  value: stats.total,      sub: 'across all projects',          color: 'from-blue-500/20 to-transparent',   bar: 'bg-blue-500' },
    { label: 'In Progress',  value: stats.inProgress, sub: 'actively being worked on',     color: 'from-yellow-500/20 to-transparent', bar: 'bg-yellow-500' },
    { label: 'Completed',    value: stats.done,        sub: `${completionPct}% completion rate`, color: 'from-green-500/20 to-transparent',  bar: 'bg-green-500' },
    { label: 'Overdue',      value: stats.overdue,     sub: 'need attention',               color: 'from-red-500/20 to-transparent',    bar: 'bg-red-500' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="card p-5 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${c.color} pointer-events-none`} />
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
          <div className="relative">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">{c.label}</p>
            <p className="text-4xl font-bold tabular-nums mb-1 leading-none">{c.value}</p>
            <p className="text-xs text-gray-500 mt-2">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
