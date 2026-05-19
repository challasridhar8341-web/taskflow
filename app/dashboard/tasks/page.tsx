import { createClient } from '@/lib/supabase/server'
import TaskTable from '@/components/tasks/TaskTable'

export default async function AllTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), project:projects(*)`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl">All Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">{(tasks || []).length} tasks total</p>
      </div>
      <TaskTable tasks={tasks || []} currentUserId={user!.id} />
    </div>
  )
}
