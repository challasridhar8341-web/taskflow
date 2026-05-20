import { createClient } from '@/lib/supabase/server'
import TaskTable from '@/components/tasks/TaskTable'
import { fetchApprovedByMe } from '@/app/actions/notifications'
import type { Task } from '@/types'

export default async function AllTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tasks }, approvedTasks] = await Promise.all([
    supabase
      .from('tasks')
      .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), informed_user:profiles!tasks_inform_to_fkey(*), project:projects(*)`)
      .or(`assigned_to.eq.${user!.id},assigned_by.eq.${user!.id}`)
      .order('created_at', { ascending: false }),
    fetchApprovedByMe(),
  ])

  const seen = new Set<string>()
  const merged = [...(tasks ?? []), ...(approvedTasks as Task[])].filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl">All Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">{merged.length} tasks total</p>
      </div>
      <TaskTable tasks={merged} currentUserId={user!.id} />
    </div>
  )
}
