import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Activity } from '@/types'

const dotColor = (action: string) => {
  if (action.includes('complete') || action.includes('done')) return 'bg-green-500'
  if (action.includes('creat')) return 'bg-indigo-500'
  if (action.includes('assign')) return 'bg-blue-500'
  if (action.includes('priority')) return 'bg-yellow-500'
  if (action.includes('reopen')) return 'bg-red-500'
  return 'bg-purple-500'
}

export default function ActivityFeed({ activity }: { activity: Activity[] }) {
  return (
    <div className="card p-4">
      <h3 className="font-display font-bold text-sm mb-4">Activity</h3>
      {activity.length === 0 && <p className="text-gray-500 text-xs">No activity yet</p>}
      <div className="space-y-0">
        {activity.map((a, i) => (
          <div key={a.id} className="flex gap-3 pb-3 relative">
            {i < activity.length - 1 && <div className="absolute left-3 top-7 bottom-0 w-px bg-white/5" />}
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor(a.action)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-white font-medium">{a.user?.full_name || 'Someone'}</span>{' '}
                {a.action}
                {a.task && <span className="text-gray-500"> on <span className="text-gray-300">"{a.task.title}"</span></span>}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
