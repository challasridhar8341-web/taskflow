'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Bell } from 'lucide-react'
import type { Profile, Project, Priority, TaskStatus } from '@/types'

const TEAMS = ['Tech', 'Design', 'Marketing', 'Content', 'HR', 'Other']

export default function NewTaskModal({ onClose, currentUserId }: { onClose: () => void; currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    title: '', description: '',
    assigned_to: '',
    inform_to: '',
    priority: 'medium' as Priority,
    status: 'todo' as TaskStatus,
    due_date: '', project_id: '', team: '',
  })

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*'),
      ])
      setProfiles(p || [])
      setProjects(pr || [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    const supabase = createClient()

    // If inform_to is set — task needs approval before assignment
    const isInform = !!form.inform_to
    const basePayload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      assigned_by: currentUserId,
      assigned_to: isInform ? currentUserId : (form.assigned_to || currentUserId),
    }

    // Try with new columns first; fall back to base if migration not yet run
    let { data: task, error } = await supabase.from('tasks').insert({
      ...basePayload,
      team: form.team || null,
      inform_to: form.inform_to || null,
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
        action: isInform
          ? `requested task assignment`
          : 'created this task',
      })
      router.refresh()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border2 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-surface2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input className="input" placeholder="e.g. Update landing page copy"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What needs to be done?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Team + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Team</label>
              <select className="input" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}>
                <option value="">No team</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Assign To</label>
            <select className="input" value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value, inform_to: '' }))}>
              <option value="">Assign to myself</option>
              {profiles.filter(p => p.id !== currentUserId).map(p =>
                <option key={p.id} value={p.id}>{p.full_name}</option>
              )}
            </select>
          </div>

          {/* Inform box */}
          <div className="rounded-xl border border-border2 p-3 space-y-2 bg-surface2/30">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-accent2" />
              <label className="text-xs text-accent2 font-medium uppercase tracking-wider">Inform for Approval</label>
            </div>
            <p className="text-[11px] text-gray-500">
              Select a person to notify — the task will only be assigned once they approve it.
            </p>
            <select className="input" value={form.inform_to}
              onChange={e => setForm(f => ({ ...f, inform_to: e.target.value, assigned_to: '' }))}>
              <option value="">No approval needed</option>
              {profiles.filter(p => p.id !== currentUserId).map(p =>
                <option key={p.id} value={p.id}>{p.full_name}</option>
              )}
            </select>
            {form.inform_to && (
              <p className="text-[11px] text-yellow-400">
                ⏳ Task will stay pending until approved by the selected person.
              </p>
            )}
          </div>

          {/* Due Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select className="input" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Project</label>
            <select className="input" value={form.project_id}
              onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
