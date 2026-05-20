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

const PRIORITY_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'High' },
  medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Medium' },
  low:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Low' },
}
const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  todo:        { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: 'To Do' },
  in_progress: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'In Progress' },
  in_review:   { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe', label: 'In Review' },
  done:        { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Done' },
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Reusable meta card ───────────────────────────────────────────────────────
function MetaCard({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl"
      style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
      <Icon size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#2575fc' }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#2575fc' }}>{label}</p>
        {children}
      </div>
    </div>
  )
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
  const pri = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium
  const sta = STATUS_BADGE[task.status]     ?? STATUS_BADGE.todo

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(26,58,140,0.12)' }}>

        {/* Header — gradient band */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2575fc 60%,#06d6a0 100%)', borderBottom: 'none' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ background: 'rgba(255,255,255,0.20)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
                ⏳ Pending Your Approval
              </span>
              <h2 className="text-lg font-bold leading-snug" style={{ color: '#ffffff' }}>
                {task.title}
              </h2>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Description */}
          {task.description ? (
            <div className="flex gap-2.5 p-3.5 rounded-xl" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
              <AlignLeft size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#2575fc' }} />
              <p className="text-sm leading-relaxed font-medium" style={{ color: '#0f172a' }}>
                {task.description}
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 p-3.5 rounded-xl" style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
              <AlignLeft size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
              <p className="text-sm italic" style={{ color: '#64748b' }}>No description provided.</p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2.5">

            <MetaCard icon={User} label="Assigned To">
              <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
                {task.assignee?.full_name ?? 'Not assigned'}
              </p>
            </MetaCard>

            <MetaCard icon={User} label="Requested By">
              <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
                {task.assigner?.full_name ?? '—'}
              </p>
            </MetaCard>

            <MetaCard icon={Flag} label="Priority">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: pri.bg, color: pri.text, border: `1px solid ${pri.border}` }}>
                {pri.label}
              </span>
            </MetaCard>

            <MetaCard icon={CheckCircle} label="Status">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: sta.bg, color: sta.text, border: `1px solid ${sta.border}` }}>
                {sta.label}
              </span>
            </MetaCard>

            <MetaCard icon={Calendar} label="Start Date">
              <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{fmtDate(task.start_date)}</p>
            </MetaCard>

            <MetaCard icon={Calendar} label="Due Date">
              <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{fmtDate(task.due_date)}</p>
            </MetaCard>

          </div>

          {/* Team — full-width if present */}
          {task.team && (
            <MetaCard icon={Tag} label="Team">
              <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{task.team}</p>
            </MetaCard>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
          <button onClick={onClose} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: '#cbd5e1', color: '#475569', background: '#f8fafc' }}>
            Close
          </button>
          <button onClick={onReject} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#dc2626', color: '#ffffff', border: 'none' }}>
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Reject
          </button>
          <button onClick={onApprove} disabled={actionLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg,#2575fc,#06d6a0)' }}>
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
