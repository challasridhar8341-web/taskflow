import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/tasks/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name)')
    .or(`assigned_to.eq.${user!.id},assigned_by.eq.${user!.id}`)
    .order('due_date', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl">Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">Your tasks by due date</p>
      </div>
      <CalendarView tasks={tasks || []} />
    </div>
  )
}
