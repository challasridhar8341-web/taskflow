'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, CheckCircle, RotateCcw, AlertCircle, Clock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const statusOptions: { value: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'todo',        label: 'To Do',       icon: Clock,        color: 'text-gray-400' },
  { value: 'in_progress', label: 'In Progress',  icon: AlertCircle,  color: 'text-blue-400' },
  { value: 'in_review',   label: 'In Review',    icon: Eye,          color: 'text-purple-400' },
  { value: 'done',        label: 'Done',         icon: CheckCircle,  color: 'text-green-400' },
]

export default function TaskOptionsMenu({ task, currentUserId, onEdit }: { task: Task; currentUserId: string; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function changeStatus(status: TaskStatus) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', task.id)
    await supabase.from('activity').insert({ task_id: task.id, user_id: currentUserId, action: `changed status to ${status.replace('_', ' ')}` })
    setOpen(false)
    router.refresh()
  }

  async function deleteTask() {
    await supabase.from('activity').delete().eq('task_id', task.id)
    await supabase.from('tasks').delete().eq('id', task.id)
    setOpen(false)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); setConfirming(false) }}
        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
        <Pencil size={11} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
          {!confirming ? (
            <>
              <button
                onClick={() => { onEdit(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-surface2 transition-colors">
                <Pencil size={12} />
                Edit Details
              </button>
              <div className="border-t border-border my-1" />
              <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Set Status</div>
              {statusOptions.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => changeStatus(value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface2 transition-colors text-left',
                    task.status === value ? 'bg-surface2/50' : ''
                  )}>
                  <Icon size={12} className={color} />
                  <span className={task.status === value ? 'text-white font-medium' : 'text-gray-300'}>{label}</span>
                  {task.status === value && <span className="ml-auto text-[9px] text-gray-500">current</span>}
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
                Delete Task
              </button>
            </>
          ) : (
            <div className="px-3 py-3">
              <p className="text-xs text-white font-medium mb-1">Delete this task?</p>
              <p className="text-[10px] text-gray-500 mb-3">This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-border text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={deleteTask}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
