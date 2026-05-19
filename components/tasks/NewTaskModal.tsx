'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import type { Profile, Project, Priority, TaskStatus } from '@/types'

export default function NewTaskModal({ onClose, currentUserId }: { onClose: () => void; currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '',
    priority: 'medium' as Priority, status: 'todo' as TaskStatus,
    due_date: '', project_id: '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*'),
      ])
      setProfiles(p || [])
      setProjects(pr || [])
      if (p?.length) setForm(f => ({ ...f, assigned_to: p[0].id }))
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.assigned_to) return
    setLoading(true)

    const { data: task, error } = await supabase.from('tasks').insert({
      ...form,
      assigned_by: currentUserId,
      project_id: form.project_id || null,
      due_date: form.due_date || null,
    }).select().single()

    if (!error && task) {
      await supabase.from('activity').insert({
        task_id: task.id, user_id: currentUserId, action: 'created this task'
      })
      router.refresh()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border2 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-surface2 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input className="input" placeholder="e.g. Update landing page copy" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What needs to be done?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Assign To *</label>
              <select className="input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} required>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Project</label>
            <select className="input" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating...' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
