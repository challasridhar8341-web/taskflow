'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface PendingApproval {
  id: string
  title: string
  description?: string
  inform_to: string
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
