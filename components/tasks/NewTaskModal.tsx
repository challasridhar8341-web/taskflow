'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Bell, Search, ChevronDown, User } from 'lucide-react'
import { avatarColor, initials } from '@/lib/utils'
import type { Profile, Priority, TaskStatus } from '@/types'

const TEAMS = ['Tech', 'Design', 'Marketing', 'Content', 'HR', 'Other']

// Searchable member picker dropdown
function MemberPicker({
  profiles, value, onChange, placeholder, currentUserId, showSelf = true
}: {
  profiles: Profile[]
  value: string
  onChange: (id: string) => void
  placeholder: string
  currentUserId: string
  showSelf?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  )

  const selected = value === 'self' ? null : profiles.find(p => p.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="input flex items-center justify-between w-full text-left"
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${avatarColor(selected.full_name)}`}>
              {initials(selected.full_name)}
            </div>
            <span className="text-sm">{selected.full_name}</span>
            {selected.department && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{selected.department}</span>
            )}
          </div>
        ) : (
          <span style={{color:'#94a3b8'}}>{placeholder}</span>
        )}
        <ChevronDown size={14} style={{color:'#94a3b8'}} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border2 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-surface2 rounded-lg px-2.5 py-1.5">
              <Search size={12} style={{color:'#94a3b8'}} />
              <input
                autoFocus
                type="text"
                placeholder="Search member..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1"
                style={{color:'var(--text-primary)'}}
              />
            </div>
          </div>

          <div className="max-h-44 overflow-y-auto py-1">
            {/* Assign to myself option */}
            {showSelf && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface2 transition-colors text-left ${!value ? 'bg-blue-50' : ''}`}
              >
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={10} style={{color:'#94a3b8'}} />
                </div>
                <span style={{color: !value ? '#2575fc' : 'var(--text-secondary)'}}>Assign to myself</span>
              </button>
            )}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-center" style={{color:'#94a3b8'}}>No members found</p>
            )}

            {filtered.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface2 transition-colors text-left ${value === p.id ? 'bg-blue-50' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${avatarColor(p.full_name)}`}>
                  {initials(p.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color: value === p.id ? '#2575fc' : 'var(--text-primary)'}}>{p.full_name}</p>
                  {p.email && <p className="text-[10px] truncate" style={{color:'#94a3b8'}}>{p.email}</p>}
                </div>
                {p.department && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">{p.department}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewTaskModal({ onClose, currentUserId }: { onClose: () => void; currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const [form, setForm] = useState({
    title: '', description: '',
    assigned_to: '',
    inform_to: '',
    priority: 'medium' as Priority,
    status: 'todo' as TaskStatus,
    start_date: todayStr, due_date: '', team: '',
  })

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: p } = await supabase.from('profiles').select('*')
      setProfiles(p || [])
    }
    load()
  }, [])

  // Filter members by selected team (exclude current user)
  const teamMembers = profiles.filter(p => {
    if (p.id === currentUserId) return false
    if (!form.team) return true
    return p.department === form.team
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()

    const effectiveAssignee = form.assigned_to || currentUserId
    // Safety: block same-user approval (creator or assignee can't be their own approver)
    const safeInformTo = (form.inform_to && form.inform_to !== currentUserId && form.inform_to !== effectiveAssignee)
      ? form.inform_to : ''
    const isInform = !!safeInformTo
    const basePayload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      project_id: null,
      assigned_by: currentUserId,
      assigned_to: form.assigned_to || currentUserId,
    }

    let { data: task, error } = await supabase.from('tasks').insert({
      ...basePayload,
      team: form.team || null,
      inform_to: safeInformTo || null,
      inform_status: isInform ? 'pending' : 'none',
    }).select().single()

    if (error?.message?.includes('column')) {
      const res = await supabase.from('tasks').insert(basePayload).select().single()
      task = res.data
      error = res.error
    }

    if (!error && task) {
      await supabase.from('activity').insert({
        task_id: task.id,
        user_id: currentUserId,
        action: isInform ? `requested task assignment` : 'created this task',
      })
      router.refresh()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{color:'var(--text-primary)'}}>New Task</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface2 transition-colors" style={{color:'#94a3b8'}}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Title *</label>
            <input className="input" placeholder="e.g. Update landing page copy"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What needs to be done?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Team + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Team</label>
              <select className="input" value={form.team}
                onChange={e => setForm(f => ({ ...f, team: e.target.value, assigned_to: '' }))}>
                <option value="">All teams</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Priority</label>
              <select className="input" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Assign To — filtered by team + searchable */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>
              Assign To {form.team && <span className="normal-case text-blue-500 ml-1">({form.team} team)</span>}
            </label>
            {teamMembers.length === 0 && form.team ? (
              <div className="input text-sm" style={{color:'#94a3b8'}}>
                No members in {form.team} team yet
              </div>
            ) : (
              <MemberPicker
                profiles={teamMembers}
                value={form.assigned_to}
                onChange={id => setForm(f => ({ ...f, assigned_to: id }))}
                placeholder="Assign to myself"
                currentUserId={currentUserId}
              />
            )}
          </div>

          {/* Inform for Approval box */}
          <div className="rounded-xl border p-3 space-y-2" style={{borderColor:'#e0f2fe',background:'#f0f9ff'}}>
            <div className="flex items-center gap-2">
              <Bell size={13} style={{color:'#2575fc'}} />
              <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#2575fc'}}>Inform for Approval</label>
            </div>
            <p className="text-[11px]" style={{color:'#94a3b8'}}>
              Select an approver — the assignee will see the task once approved.
            </p>
            <MemberPicker
              profiles={profiles.filter(p => {
                // Exclude creator and effective assignee — they can't be their own approver
                const effectiveAssignee = form.assigned_to || currentUserId
                return p.id !== currentUserId && p.id !== effectiveAssignee
              })}
              value={form.inform_to}
              onChange={id => setForm(f => ({ ...f, inform_to: id }))}
              placeholder="No approval needed"
              currentUserId={currentUserId}
              showSelf={false}
            />
            {form.inform_to && (
              <p className="text-[11px] text-yellow-600">
                ⏳ Task goes to the assignee once the approver accepts it.
              </p>
            )}
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Start Date</label>
              <input className="input" type="date" value={form.start_date}
                min={todayStr}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({
                    ...f,
                    start_date: val,
                    // If end date is now before start date, reset it
                    due_date: f.due_date && f.due_date < val ? val : f.due_date,
                  }))
                }} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>End Date</label>
              <input className="input" type="date" value={form.due_date}
                min={form.start_date || todayStr}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 font-semibold" style={{color:'#64748b'}}>Status</label>
            <select className="input" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating...' : form.inform_to ? '📨 Send for Approval' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
