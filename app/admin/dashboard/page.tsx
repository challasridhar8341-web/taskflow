import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const adminName = cookieStore.get('admin_session')?.value || 'Admin'

  const supabase = createAdminClient()

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from('tasks')
      .select(`*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*), informed_user:profiles!tasks_inform_to_fkey(*)`)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .order('full_name'),
  ])

  return (
    <AdminDashboard
      tasks={tasks || []}
      profiles={profiles || []}
      adminName={adminName}
    />
  )
}
