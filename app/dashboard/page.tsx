import { createClient } from '@/lib/supabase/server'
import StatsGrid from '@/components/tasks/StatsGrid'
import TaskTable from '@/components/tasks/TaskTable'
import { fetchApprovedByMe } from '@/app/actions/notifications'

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch own tasks + tasks approved by this user (RLS blocks inform_to query, so use admin action)
  const [{ data: tasks }, approvedTasks] = await Promise.all([
    supabase
      .from('tasks')
      .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), informed_user:profiles!tasks_inform_to_fkey(*), project:projects(*)`)
      .or(`assigned_to.eq.${user!.id},assigned_by.eq.${user!.id}`)
      .order('created_at', { ascending: false }),
    fetchApprovedByMe(),
  ])

  // Merge + deduplicate by id (a task could appear in both lists)
  const seen = new Set<string>()
  const merged = [...(tasks ?? []), ...approvedTasks].filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  const allTasks = merged.sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
  )

  const stats = {
    total:      allTasks.length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    done:       allTasks.filter(t => t.status === 'done').length,
    overdue:    allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }

  return (
    <div className="space-y-7">
      <StatsGrid stats={stats} />
      {allTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-white font-semibold mb-1">No tasks yet</p>
          <p className="text-sm text-gray-500">Click "+ New Task" to create your first task.</p>
        </div>
      ) : (
        <TaskTable tasks={allTasks} currentUserId={user!.id} />
      )}
    </div>
  )
}
