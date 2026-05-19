'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const priorityStyle = (p: string) =>
  p === 'high'   ? 'bg-red-500/20 text-red-300 border-red-500/30' :
  p === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                   'bg-green-500/20 text-green-300 border-green-500/30'

const priorityDot = (p: string) =>
  p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500'

const statusStyle = (s: string) =>
  s === 'done'        ? 'text-green-400 bg-green-400/10' :
  s === 'in_progress' ? 'text-blue-400 bg-blue-400/10'  :
  s === 'in_review'   ? 'text-purple-400 bg-purple-400/10' :
                        'text-gray-400 bg-gray-400/10'

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<number | null>(null)

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  // Index tasks by day for this month
  const byDay: Record<number, Task[]> = {}
  tasks.forEach(t => {
    if (!t.due_date) return
    const d = new Date(t.due_date + 'T00:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(t)
    }
  })

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelected(null)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelected(null)
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const totalCells = firstWeekday + daysInMonth
  const trailingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const selectedTasks = selected ? (byDay[selected] || []) : []

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="btn-ghost p-2"><ChevronLeft size={15} /></button>
          <h3 className="font-display font-bold text-xl w-44 text-center">{MONTH_NAMES[month]} {year}</h3>
          <button onClick={next} className="btn-ghost p-2"><ChevronRight size={15} /></button>
        </div>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today.getDate()) }}
          className="btn-ghost text-xs px-3 py-1.5">
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-surface2">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-3 text-center text-[11px] text-gray-500 font-medium uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pre-${i}`} className="min-h-[110px] border-b border-r border-border bg-surface2/20" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1
            const dayTasks = byDay[day] || []
            const col      = (firstWeekday + i) % 7
            const isLast   = col === 6
            const isSel    = selected === day
            const tod      = isToday(day)
            const hasOver  = dayTasks.some(t => t.status !== 'done')

            return (
              <div
                key={day}
                onClick={() => setSelected(isSel ? null : day)}
                className={cn(
                  'min-h-[110px] border-b border-border p-2 cursor-pointer transition-colors flex flex-col',
                  !isLast && 'border-r',
                  isSel ? 'bg-accent/8' : 'hover:bg-surface2/50'
                )}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    tod ? 'bg-accent text-white' : 'text-gray-400'
                  )}>
                    {day}
                  </span>
                  {hasOver && dayTasks.length > 0 && (
                    <span className="text-[10px] text-gray-600">{dayTasks.length}</span>
                  )}
                </div>

                {/* Task pills */}
                <div className="space-y-0.5 flex-1">
                  {dayTasks.slice(0, 3).map(t => (
                    <div
                      key={t.id}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border leading-tight truncate',
                        priorityStyle(t.priority),
                        t.status === 'done' && 'opacity-50 line-through'
                      )}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Trailing empty cells */}
          {Array.from({ length: trailingCells }).map((_, i) => (
            <div key={`post-${i}`} className={cn(
              'min-h-[110px] border-b border-border bg-surface2/20',
              i < trailingCells - 1 && 'border-r'
            )} />
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">
              {MONTH_NAMES[month]} {selected}, {year}
            </h4>
            <span className="text-xs text-gray-500">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks due on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-surface2/60 hover:bg-surface2 transition-colors">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDot(t.priority))} />
                  <span className={cn('text-sm flex-1 font-medium', t.status === 'done' && 'line-through text-gray-500')}>
                    {t.title}
                  </span>
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium capitalize', statusStyle(t.status))}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', priorityStyle(t.priority))}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="font-medium">Priority:</span>
        {[['high','bg-red-500'],['medium','bg-yellow-500'],['low','bg-green-500']].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 capitalize">
            <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
          </span>
        ))}
      </div>
    </div>
  )
}
