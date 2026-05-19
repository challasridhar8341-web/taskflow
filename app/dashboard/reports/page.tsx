import { createClient } from '@/lib/supabase/server'

interface BarProps { label: string; value: number; max: number; color: string }
function StatBar({ label, value, max, color }: BarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm font-bold tabular-nums text-white">{value}</span>
          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name), project:projects(name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email'),
  ])

  const all = tasks || []
  const total      = all.length
  const todo       = all.filter(t => t.status === 'todo').length
  const inProgress = all.filter(t => t.status === 'in_progress').length
  const inReview   = all.filter(t => t.status === 'in_review').length
  const done       = all.filter(t => t.status === 'done').length
  const high       = all.filter(t => t.priority === 'high').length
  const medium     = all.filter(t => t.priority === 'medium').length
  const low        = all.filter(t => t.priority === 'low').length
  const overdue    = all.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0

  const kpis = [
    { label: 'Total Tasks',   value: total,           sub: 'across all projects',    color: 'from-blue-500/20 to-transparent',   bar: 'bg-blue-500' },
    { label: 'Completed',     value: `${completionPct}%`, sub: `${done} of ${total} tasks`, color: 'from-green-500/20 to-transparent', bar: 'bg-green-500' },
    { label: 'In Progress',   value: inProgress,      sub: 'being worked on now',    color: 'from-yellow-500/20 to-transparent', bar: 'bg-yellow-500' },
    { label: 'Overdue',       value: overdue,         sub: 'past their due date',    color: 'from-red-500/20 to-transparent',    bar: 'bg-red-500' },
  ]

  const memberStats = (profiles || []).map(p => ({
    name: p.full_name,
    total: all.filter(t => t.assigned_to === p.id).length,
    done:  all.filter(t => t.assigned_to === p.id && t.status === 'done').length,
  })).filter(m => m.total > 0)

  const statusColors: Record<string, string> = {
    todo: 'text-gray-400 bg-gray-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    in_review: 'text-purple-400 bg-purple-400/10',
    done: 'text-green-400 bg-green-400/10',
  }
  const priorityColors: Record<string, string> = {
    high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400',
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(c => (
          <div key={c.label} className="card p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} pointer-events-none`} />
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
            <div className="relative">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">{c.label}</p>
              <p className="text-4xl font-bold tabular-nums leading-none mb-2">{c.value}</p>
              <p className="text-xs text-gray-500">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">By Status</h3>
          <StatBar label="To Do"       value={todo}       max={total} color="bg-gray-500" />
          <StatBar label="In Progress" value={inProgress} max={total} color="bg-blue-500" />
          <StatBar label="In Review"   value={inReview}   max={total} color="bg-purple-500" />
          <StatBar label="Done"        value={done}       max={total} color="bg-green-500" />
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">By Priority</h3>
          <StatBar label="High"   value={high}   max={total} color="bg-red-500" />
          <StatBar label="Medium" value={medium} max={total} color="bg-yellow-500" />
          <StatBar label="Low"    value={low}    max={total} color="bg-green-500" />
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-gray-500">
              {high > 0 ? `${Math.round(high/total*100)}% of tasks are high priority` : 'No high-priority tasks'}
            </p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Team Performance</h3>
          {memberStats.length === 0
            ? <p className="text-xs text-gray-500">No team data yet</p>
            : memberStats.map(m => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{m.name.split(' ')[0]}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{m.done}/{m.total} done</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: m.total > 0 ? `${Math.round(m.done / m.total * 100)}%` : '0%' }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Tasks</h3>
          <span className="text-xs text-gray-500">{all.length} total</span>
        </div>
        {all.length === 0
          ? <div className="py-10 text-center text-gray-500 text-sm">No tasks yet</div>
          : (
            <>
              <div className="grid grid-cols-[2fr_1fr_80px_100px] px-5 py-2.5 bg-surface2 text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                <div>Task</div><div>Assignee</div><div>Priority</div><div>Status</div>
              </div>
              {all.slice(0, 10).map(task => (
                <div key={task.id}
                  className="grid grid-cols-[2fr_1fr_80px_100px] px-5 py-3 border-t border-border items-center hover:bg-surface2/60 transition-colors">
                  <span className="text-sm font-medium truncate pr-4">{task.title}</span>
                  <span className="text-xs text-gray-400">{task.assignee?.full_name?.split(' ')[0] ?? '—'}</span>
                  <span className={`text-xs font-medium capitalize ${priorityColors[task.priority]}`}>{task.priority}</span>
                  <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </>
          )
        }
      </div>
    </div>
  )
}
