import { avatarColor, initials } from '@/lib/utils'
import type { Profile, Task } from '@/types'

export default function TeamWorkload({ profiles, tasks }: { profiles: Profile[]; tasks: Task[] }) {
  const maxTasks = Math.max(...profiles.map(p => tasks.filter(t => t.assigned_to === p.id && t.status !== 'done').length), 1)

  return (
    <div className="card p-4">
      <h3 className="font-display font-bold text-sm mb-4">Team Workload</h3>
      <div className="space-y-3">
        {profiles.map(p => {
          const count = tasks.filter(t => t.assigned_to === p.id && t.status !== 'done').length
          const pct = Math.round(count / maxTasks * 100)
          const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
          return (
            <div key={p.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${avatarColor(p.full_name)}`}>
                  {initials(p.full_name)}
                </div>
                <span className="text-xs text-gray-300 flex-1 truncate">{p.full_name.split(' ')[0]}</span>
                <span className="text-xs text-gray-500 font-display font-bold">{count}</span>
              </div>
              <div className="h-1 bg-surface2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
