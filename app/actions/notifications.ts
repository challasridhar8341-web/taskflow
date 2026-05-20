'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface PendingApproval {
  id: string
  title: string
  description?: string
  inform_to: string
}

export interface TaskDetail {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  start_date?: string
  due_date?: string
  team?: string
  inform_to?: string
  assignee?: { full_name: string } | null
  assigner?: { full_name: string } | null
}

/** Fetch full task detail (bypasses RLS for approver) */
export async function fetchTaskDetail(taskId: string): Promise<TaskDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('tasks')
    .select(`
      id, title, description, priority, status,
      start_date, due_date, team, inform_to,
      assignee:profiles!tasks_assigned_to_fkey(full_name),
      assigner:profiles!tasks_assigned_by_fkey(full_name)
    `)
    .eq('id', taskId)
    .single()

  return data as TaskDetail | null
}

/** Uses admin client to bypass RLS — approver can read tasks where inform_to = their ID */
export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('tasks')
    .select('id, title, description, inform_to')
    .eq('inform_to', user.id)
    .eq('inform_status', 'pending')

  return (data ?? []) as PendingApproval[]
}

export async function countPendingApprovals(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const admin = createAdminClient()
  const { count } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('inform_to', user.id)
    .eq('inform_status', 'pending')

  return count ?? 0
}
