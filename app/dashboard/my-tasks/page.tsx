import { createClient } from '@/lib/supabase/server'
import TaskTable from '@/components/tasks/TaskTable'

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), informed_user:profiles!tasks_inform_to_fkey(*), project:projects(*)`)
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
          <h2 className="font-display font-bold text-xl">Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">{allTasks.length} tasks assigned to you</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="font-bold text-slate-600">{todoCount} <span className="font-normal text-[#94a3b8]">to do</span></span>
          <span className="font-bold text-blue-600">{inProgressCount} <span className="font-normal text-[#94a3b8]">in progress</span></span>
          <span className="font-bold text-green-600">{doneCount} <span className="font-normal text-[#94a3b8]">done</span></span>
        </div>
      </div>
      <TaskTable tasks={allTasks} currentUserId={user!.id} />
    </div>
  )
}
