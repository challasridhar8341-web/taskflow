import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/tasks/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name)')
    .order('due_date', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl">Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">View tasks by their due dates</p>
      </div>
      <CalendarView tasks={tasks || []} />
    </div>
  )
}
