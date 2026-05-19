import { createClient } from '@/lib/supabase/server'
import TaskTable from '@/components/tasks/TaskTable'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), project:projects(*)`)
    .eq('assigned_to', user!.id)
    .order('created_at', { ascending: false })

  const allTasks = tasks || []
  const todoCount = allTasks.filter(t => t.status === 'todo').length
  const inProgressCount = allTasks.filter(t => t.status === 'in_progress').length
  const doneCount = allTasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">My Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">{allTasks.length} tasks assigned to you</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">{todoCount} <span className="text-gray-600">to do</span></span>
          <span className="text-blue-400">{inProgressCount} <span className="text-gray-600">in progress</span></span>
          <span className="text-green-400">{doneCount} <span className="text-gray-600">done</span></span>
        </div>
      </div>
      <TaskTable tasks={allTasks} currentUserId={user!.id} />
    </div>
  )
}
