'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, AlertCircle, X, CheckCircle, XCircle, Eye,
  User, Calendar, Flag, Tag, AlignLeft, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  fetchPendingApprovals, countPendingApprovals, fetchTaskDetail,
} from '@/app/actions/notifications'
import type { PendingApproval, TaskDetail } from '@/app/actions/notifications'

interface OverdueTask { id: string; title: string; due_date: string; priority: string }

const priorityDot = (p: string) =>
  p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500'

function daysOverdue(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86_400_000)
  return diff === 1 ? '1 day overdue' : `${diff} days overdue`
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
}
const STATUS_COLOR: Record<string, string> = {
  todo: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_review: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  done: 'text-green-400 bg-green-400/10 border-green-400/20',
}
function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Task preview popup ───────────────────────────────────────────────────────
function TaskPreviewModal({
  task, onClose, onApprove, onReject, actionLoading,
}: {
  task: TaskDetail
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  actionLoading: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface, #1a1f2e)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-400 mb-1.5">
              ⏳ Pending Your Approval
            </p>
            <h2 className="text-base font-bold leading-snug" style={{ color: '#f1f5f9' }}>
              {task.title}
            </h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Description */}
          {task.description && (
            <div className="flex gap-3">
              <AlignLeft size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#64748b' }} />
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">

            {/* Assigned to */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assigned To</p>
                <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
                  {task.assignee?.full_name ?? 'Not assigned'}
                </p>
              </div>
            </div>

            {/* Requested by */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Requested By</p>
                <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
                  {task.assigner?.full_name ?? '—'}
                </p>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Flag size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Priority</p>
                <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded border capitalize', PRIORITY_COLOR[task.priority] ?? '')}>
                  {task.priority}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CheckCircle size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
                <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded border capitalize', STATUS_COLOR[task.status] ?? '')}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Start date */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Calendar size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Start Date</p>
                <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{fmtDate(task.start_date)}</p>
              </div>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Calendar size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Due Date</p>
                <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{fmtDate(task.due_date)}</p>
              </div>
            </div>

          </div>

          {/* Team */}
          {task.team && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Tag size={13} style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Team</p>
                <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{task.team}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={onClose} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
            style={{ borderColor: 'rgba(255,255,255,0.10)', color: '#94a3b8' }}>
            Close
          </button>
          <button onClick={onReject} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Reject
          </button>
          <button onClick={onApprove} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main dropdown ────────────────────────────────────────────────────────────
export default function NotificationsDropdown({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen]               = useState(false)
  const [overdue, setOverdue]         = useState<OverdueTask[]>([])
  const [pending, setPending]         = useState<PendingApproval[]>([])
  const [loading, setLoading]         = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  // Preview popup state
  const [preview, setPreview]         = useState<TaskDetail | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionLoading, setActionLoading]   = useState(false)
  const [previewTask, setPreviewTask]       = useState<PendingApproval | null>(null)

  const ref    = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!currentUserId) return
    async function countUnread() {
      const today = new Date().toISOString().split('T')[0]
      const { data: od } = await supabase.from('tasks')
        .select('id').lt('due_date', today).neq('status', 'done')
        .or(`assigned_to.eq.${currentUserId},assigned_by.eq.${currentUserId}`)
      const pdCount = await countPendingApprovals()
      setUnreadCount((od?.length ?? 0) + pdCount)
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
      .lt('due_date', today).neq('status', 'done')
      .or(`assigned_to.eq.${currentUserId},assigned_by.eq.${currentUserId}`)
      .order('due_date').limit(10)
    const pdData = await fetchPendingApprovals()
    setOverdue(od ?? [])
    setPending(pdData)
    setLoading(false)
  }

  function toggle() {
    if (!open) { fetchData(); setUnreadCount(0) }
    setOpen(o => !o)
  }

  async function openPreview(t: PendingApproval) {
    setPreviewTask(t)
    setPreview(null)
    setPreviewLoading(true)
    setOpen(false)
    const detail = await fetchTaskDetail(t.id)
    setPreview(detail)
    setPreviewLoading(false)
  }

  function closePreview() {
    setPreview(null)
    setPreviewTask(null)
    setPreviewLoading(false)
  }

  async function handleApprove(t: PendingApproval) {
    setActionLoading(true)
    await supabase.from('tasks').update({
      inform_status: 'approved',
      updated_at: new Date().toISOString(),
    }).eq('id', t.id)
    await supabase.from('activity').insert({
      task_id: t.id, user_id: currentUserId, action: 'approved task assignment'
    })
    setPending(p => p.filter(x => x.id !== t.id))
    setUnreadCount(c => Math.max(0, c - 1))
    setActionLoading(false)
    closePreview()
    setOpen(false)
    router.refresh()
  }

  async function handleReject(t: PendingApproval) {
    setActionLoading(true)
    await supabase.from('tasks').update({
      inform_status: 'rejected',
      updated_at: new Date().toISOString(),
    }).eq('id', t.id)
    await supabase.from('activity').insert({
      task_id: t.id, user_id: currentUserId, action: 'rejected task assignment'
    })
    setPending(p => p.filter(x => x.id !== t.id))
    setUnreadCount(c => Math.max(0, c - 1))
    setActionLoading(false)
    closePreview()
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {/* Preview popup — rendered at root level so it's above everything */}
      {(previewLoading || preview) && previewTask && (
        previewLoading ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={closePreview}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#06d6a0' }} />
          </div>
        ) : preview ? (
          <TaskPreviewModal
            task={preview}
            onClose={closePreview}
            onApprove={() => handleApprove(previewTask)}
            onReject={() => handleReject(previewTask)}
            actionLoading={actionLoading}
          />
        ) : null
      )}

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
                      <div key={t.id}
                        className="px-4 py-3 border-b border-border/50 hover:bg-surface2/40 transition-colors cursor-pointer"
                        onClick={() => openPreview(t)}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-white leading-snug">{t.title}</p>
                          <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-blue-400 font-medium mt-0.5">
                            <Eye size={10} /> View
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-[10px] text-gray-500 mb-2 truncate">{t.description}</p>
                        )}
                        <p className="text-[10px] text-yellow-400 mb-2">
                          Tap to review · Your approval is needed
                        </p>
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
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
    </>
  )
}
