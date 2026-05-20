import { createClient } from '@/lib/supabase/server'
import StatsGrid from '@/components/tasks/StatsGrid'
import TaskTable from '@/components/tasks/TaskTable'
import ActivityFeed from '@/components/tasks/ActivityFeed'

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), project:projects(*)`)
    .or(`assigned_to.eq.${user!.id},assigned_by.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  const { data: activity } = await supabase
    .from('activity')
    .select(`*, user:profiles(*), task:tasks(title)`)
    .order('created_at', { ascending: false })
    .limit(10)

  // Sort by priority high → medium → low
  const allTasks = (tasks || []).sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
  )

  const stats = {
    total: allTasks.length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
    overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
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
        <div className="grid grid-cols-3 gap-7">
          <div className="col-span-2">
            <TaskTable tasks={allTasks} currentUserId={user!.id} />
          </div>
          <div>
            <ActivityFeed activity={activity || []} />
          </div>
        </div>
      )}
    </div>
  )
}
