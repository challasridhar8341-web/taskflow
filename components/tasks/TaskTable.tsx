'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate, isOverdue, priorityColor, priorityLabel, statusColor, statusLabel, avatarColor, initials, cn } from '@/lib/utils'
import type { Task } from '@/types'
import { Calendar, X } from 'lucide-react'
import TaskOptionsMenu from '@/components/tasks/TaskOptionsMenu'

const FILTERS = ['All', 'My Tasks', 'In Progress', 'Overdue', 'Done']

const todayStr = () => new Date().toISOString().split('T')[0]
const weekEndStr = () => {
  const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]
}

export default function TaskTable({ tasks, currentUserId }: { tasks: Task[]; currentUserId: string }) {
  const [filter, setFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() || ''
  const supabase = createClient()

  const filtered = tasks.filter(t => {
    if (filter === 'My Tasks'   && t.assigned_to !== currentUserId) return false
    if (filter === 'In Progress' && t.status !== 'in_progress') return false
    if (filter === 'Overdue'    && !(t.due_date && isOverdue(t.due_date) && t.status !== 'done')) return false
    if (filter === 'Done'       && t.status !== 'done') return false
    if (dateFrom && (!t.due_date || t.due_date < dateFrom)) return false
    if (dateTo   && (!t.due_date || t.due_date > dateTo))   return false
    if (q && !t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
    return true
  })

  const hasDateFilter = dateFrom || dateTo

  function quickDate(type: 'today' | 'week' | 'overdue') {
    if (type === 'today')   { setDateFrom(todayStr());  setDateTo(todayStr()) }
    if (type === 'week')    { setDateFrom(todayStr());  setDateTo(weekEndStr()) }
    if (type === 'overdue') { setDateFrom('');          setDateTo(todayStr()) }
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'in_progress' : 'done'
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id)
    await supabase.from('activity').insert({ task_id: task.id, user_id: currentUserId, action: newStatus === 'done' ? 'marked as complete' : 'reopened' })
    router.refresh()
  }

  const isToday  = dateFrom === todayStr() && dateTo === todayStr()
  const isWeek   = dateFrom === todayStr() && dateTo === weekEndStr()
  const isOverdueFilter = !dateFrom && dateTo === todayStr()

  return (
    <div>
      {/* Status filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-full text-xs border transition-colors',
              filter === f ? 'bg-accent/15 border-accent text-accent2' : 'border-border2 text-gray-400 hover:text-white')}>
            {f}
          </button>
        ))}
      </div>

      {/* Date filter row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap p-3 bg-surface2/50 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 text-gray-400 mr-1">
          <Calendar size={13} />
          <span className="text-xs font-medium">Due date</span>
        </div>

        {/* Quick filters */}
        {(['today', 'week', 'overdue'] as const).map(type => (
          <button key={type} onClick={() => quickDate(type)}
            className={cn('px-2.5 py-1 rounded-lg text-xs border transition-colors capitalize',
              (type === 'today' && isToday) || (type === 'week' && isWeek) || (type === 'overdue' && isOverdueFilter)
                ? 'bg-accent/15 border-accent text-accent2'
                : 'border-border2 text-gray-400 hover:text-white hover:border-gray-500')}>
            {type === 'week' ? 'This Week' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}

        <span className="text-gray-600 text-xs mx-1">|</span>

        {/* Custom range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-surface border border-border2 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent transition-colors cursor-pointer"
          />
          <span className="text-gray-500 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-surface border border-border2 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent transition-colors cursor-pointer"
          />
        </div>

        {hasDateFilter && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors ml-1">
            <X size={12} /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-visible">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] px-4 py-2.5 bg-surface2 border-b border-border text-[10px] text-gray-500 uppercase tracking-widest font-medium rounded-t-xl">
          <div>Task</div><div>Assignee</div><div>Priority</div><div>Due</div><div>Status</div><div />
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">No tasks found</div>
        )}

        {filtered.map(task => {
          const done = task.status === 'done'
          const overdue = task.due_date && isOverdue(task.due_date) && !done
          return (
            <div key={task.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] px-4 py-3.5 border-b border-border last:border-b-0 items-center hover:bg-surface2/60 transition-colors group">
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={() => toggleDone(task)}
                  className={cn('w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    done ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-accent')}>
                  {done && <span className="text-white text-[9px] font-bold">✓</span>}
                </button>
                <span className={cn('text-sm font-medium truncate', done && 'line-through text-gray-500')}>{task.title}</span>
              </div>

              <div>
                {task.assignee && (
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold', avatarColor(task.assignee.full_name))}>
                      {initials(task.assignee.full_name)}
                    </div>
                    <span className="text-xs text-gray-400 truncate max-w-[70px]">{task.assignee.full_name.split(' ')[0]}</span>
                  </div>
                )}
              </div>

              <div>
                <span className={cn('badge', priorityColor(task.priority))}>{priorityLabel(task.priority)}</span>
              </div>

              <div className={cn('text-xs font-medium', overdue ? 'text-red-400' : 'text-gray-400')}>
                {task.due_date ? formatDate(task.due_date) : '—'}
                {overdue && <span className="ml-1">⚠</span>}
              </div>

              <div>
                <span className={cn('badge', statusColor(task.status))}>{statusLabel(task.status)}</span>
              </div>

              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end pr-1">
                <TaskOptionsMenu task={task} currentUserId={currentUserId} />
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
