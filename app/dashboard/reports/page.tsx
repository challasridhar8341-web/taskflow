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
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name), project:projects(name)')
    .or(`assigned_to.eq.${user!.id},assigned_by.eq.${user!.id}`)
    .order('created_at', { ascending: false })

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

  // Split: tasks assigned TO me vs tasks I assigned to others
  const myTasks      = all.filter(t => t.assigned_to === user!.id)
  const assignedByMe = all.filter(t => t.assigned_by === user!.id && t.assigned_to !== user!.id)

  const kpis = [
    { label: 'My Tasks',    value: total,           sub: 'tasks you\'re involved in',   color: 'from-blue-500/20 to-transparent',   bar: 'bg-blue-500' },
    { label: 'Completed',   value: `${completionPct}%`, sub: `${done} of ${total} done`, color: 'from-green-500/20 to-transparent', bar: 'bg-green-500' },
    { label: 'In Progress', value: inProgress,      sub: 'being worked on now',          color: 'from-yellow-500/20 to-transparent', bar: 'bg-yellow-500' },
    { label: 'Overdue',     value: overdue,         sub: 'past their due date',          color: 'from-red-500/20 to-transparent',    bar: 'bg-red-500' },
  ]

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
              {high > 0 ? `${Math.round(high/total*100)}% of your tasks are high priority` : 'No high-priority tasks'}
            </p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">My Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Assigned to me</span>
              <span className="text-sm font-bold text-white tabular-nums">{myTasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Assigned by me</span>
              <span className="text-sm font-bold text-white tabular-nums">{assignedByMe.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Completed</span>
              <span className="text-sm font-bold text-green-400 tabular-nums">{done}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Overdue</span>
              <span className={`text-sm font-bold tabular-nums ${overdue > 0 ? 'text-red-400' : 'text-gray-500'}`}>{overdue}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Completion rate</span>
              <span className="text-xs font-bold text-accent">{completionPct}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
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
