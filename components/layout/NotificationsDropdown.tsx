'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, AlertCircle, X, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface OverdueTask { id: string; title: string; due_date: string; priority: string }
interface PendingTask { id: string; title: string; description?: string; inform_to: string }

const priorityDot = (p: string) =>
  p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500'

function daysOverdue(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86_400_000)
  return diff === 1 ? '1 day overdue' : `${diff} days overdue`
}

const READ_KEY = 'taskflow_notif_read_at'

export default function NotificationsDropdown({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false)
  const [overdue, setOverdue] = useState<OverdueTask[]>([])
  const [pending, setPending] = useState<PendingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Count unread on mount
  useEffect(() => {
    if (!currentUserId) return
    async function countUnread() {
      const today = new Date().toISOString().split('T')[0]
      const { data: od } = await supabase.from('tasks')
        .select('id')
        .lt('due_date', today)
        .neq('status', 'done')
        .or(`assigned_to.eq.${currentUserId},assigned_by.eq.${currentUserId}`)
      let pdCount = 0
      try {
        const { data: pd } = await supabase.from('tasks').select('id')
          .eq('inform_to', currentUserId).eq('inform_status', 'pending')
        pdCount = pd?.length || 0
      } catch {}
      setUnreadCount((od?.length || 0) + pdCount)
    }
    countUnread()
  }, [currentUserId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function fetchData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data: od } = await supabase.from('tasks')
      .select('id, title, due_date, priority')
      .lt('due_date', today)
      .neq('status', 'done')
      .or(`assigned_to.eq.${currentUserId},assigned_by.eq.${currentUserId}`)
      .order('due_date')
      .limit(10)

    let pdData: PendingTask[] = []
    try {
      const { data: pd } = await supabase.from('tasks').select('id, title, description, inform_to')
        .eq('inform_to', currentUserId).eq('inform_status', 'pending')
      pdData = (pd || []) as PendingTask[]
    } catch {}

    setOverdue(od || [])
    setPending(pdData)
    setLoading(false)
  }

  function toggle() {
    if (!open) {
      fetchData()
      const now = Date.now()
      localStorage.setItem(READ_KEY, String(now))
      setUnreadCount(0)
    }
    setOpen(o => !o)
  }

  async function handleApprove(task: PendingTask) {
    await supabase.from('tasks').update({
      inform_status: 'approved',
      updated_at: new Date().toISOString(),
    }).eq('id', task.id)
    await supabase.from('activity').insert({
      task_id: task.id, user_id: currentUserId, action: 'approved task assignment'
    })
    setPending(p => p.filter(t => t.id !== task.id))
    setUnreadCount(c => Math.max(0, c - 1))
    setOpen(false)
    router.refresh()
  }

  async function handleReject(task: PendingTask) {
    await supabase.from('tasks').update({
      inform_status: 'rejected',
      updated_at: new Date().toISOString(),
    }).eq('id', task.id)
    await supabase.from('activity').insert({
      task_id: task.id, user_id: currentUserId, action: 'rejected task assignment'
    })
    setPending(p => p.filter(t => t.id !== task.id))
    setUnreadCount(c => Math.max(0, c - 1))
    setOpen(false)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="btn-ghost relative">
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-gray-500">Loading…</div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto">

              {/* Pending approval requests */}
              {pending.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500/5 border-b border-border">
                    <Bell size={11} className="text-yellow-400" />
                    <span className="text-[10px] font-medium text-yellow-400 uppercase tracking-wider">
                      {pending.length} Pending Approval
                    </span>
                  </div>
                  {pending.map(t => (
                    <div key={t.id} className="px-4 py-3 border-b border-border/50 hover:bg-surface2/40 transition-colors">
                      <p className="text-xs font-medium text-white mb-0.5">{t.title}</p>
                      {t.description && <p className="text-[10px] text-gray-500 mb-2 truncate">{t.description}</p>}
                      <p className="text-[10px] text-yellow-400 mb-2">Your approval is needed to assign this task</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(t)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-[11px] font-medium transition-colors">
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button onClick={() => handleReject(t)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-[11px] font-medium transition-colors">
                          <XCircle size={11} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Overdue */}
              {overdue.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-red-500/5 border-b border-border">
                    <AlertCircle size={11} className="text-red-400" />
                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                      {overdue.length} Overdue
                    </span>
                  </div>
                  {overdue.map(t => (
                    <div key={t.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-surface2/60 transition-colors last:border-b-0">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', priorityDot(t.priority))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{t.title}</p>
                        <p className="text-[10px] text-red-400 mt-0.5">{daysOverdue(t.due_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {overdue.length === 0 && pending.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-xs text-gray-500">All caught up! No notifications.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
