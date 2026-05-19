import { createClient } from '@/lib/supabase/server'
import StatsGrid from '@/components/tasks/StatsGrid'
import TaskTable from '@/components/tasks/TaskTable'
import ActivityFeed from '@/components/tasks/ActivityFeed'
import TeamWorkload from '@/components/tasks/TeamWorkload'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch tasks with related data
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), project:projects(*)`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch activity
  const { data: activity } = await supabase
    .from('activity')
    .select(`*, user:profiles(*), task:tasks(title)`)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch all profiles for workload
  const { data: profiles } = await supabase.from('profiles').select('*')

  // Stats
  const allTasks = tasks || []
  const stats = {
    total: allTasks.length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
    overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }

  return (
    <div className="space-y-7">
      <StatsGrid stats={stats} />

      <div className="grid grid-cols-3 gap-7">
        <div className="col-span-2">
          <TaskTable tasks={allTasks} currentUserId={user!.id} />
        </div>
        <div className="space-y-5">
          <ActivityFeed activity={activity || []} />
          <TeamWorkload profiles={profiles || []} tasks={allTasks} />
        </div>
      </div>
    </div>
  )
}
