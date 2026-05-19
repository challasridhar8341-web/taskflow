import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Get projects (seeded by schema)
  const { data: projects } = await supabase.from('projects').select('*')
  if (!projects?.length) return NextResponse.json({ error: 'No projects found — run supabase-schema.sql first' }, { status: 400 })

  const p = projects
  const uid = user.id
  const d = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().split('T')[0]

  const tasks = [
    { title: 'Redesign homepage hero section',   description: 'Update hero with new brand visuals and CTA button',   status: 'in_progress', priority: 'high',   due_date: d(3),   project_id: p[0].id, assigned_to: uid, assigned_by: uid },
    { title: 'Fix mobile navigation bug',         description: 'Hamburger menu not closing on tap outside',           status: 'todo',        priority: 'high',   due_date: d(1),   project_id: p[0].id, assigned_to: uid, assigned_by: uid },
    { title: 'Write Q3 marketing copy',           description: 'Campaign copy for social media and email newsletter', status: 'todo',        priority: 'medium', due_date: d(7),   project_id: p[2].id, assigned_to: uid, assigned_by: uid },
    { title: 'Set up employee onboarding flow',   description: 'New hire checklist, welcome email, and Slack invite', status: 'in_review',   priority: 'medium', due_date: d(5),   project_id: p[3].id, assigned_to: uid, assigned_by: uid },
    { title: 'API integration for mobile app',    description: 'Connect REST endpoints to v2 feature set',            status: 'done',        priority: 'high',   due_date: d(-2),  project_id: p[1].id, assigned_to: uid, assigned_by: uid },
    { title: 'Performance audit & optimisation',  description: 'Run Lighthouse, fix LCP and CLS issues',              status: 'todo',        priority: 'low',    due_date: d(14),  project_id: p[0].id, assigned_to: uid, assigned_by: uid },
    { title: 'Update brand colour palette',       description: 'Apply new brand tokens across all components',        status: 'in_progress', priority: 'medium', due_date: d(-1),  project_id: p[0].id, assigned_to: uid, assigned_by: uid },
    { title: 'Push notifications setup',          description: 'Implement FCM for Android and iOS builds',            status: 'todo',        priority: 'high',   due_date: d(10),  project_id: p[1].id, assigned_to: uid, assigned_by: uid },
    { title: 'A/B test landing page headline',    description: 'Run 2-week test on headline variants',                status: 'todo',        priority: 'medium', due_date: d(4),   project_id: p[2].id, assigned_to: uid, assigned_by: uid },
    { title: 'Migrate database to new schema',    description: 'Run migration scripts and validate data integrity',   status: 'done',        priority: 'high',   due_date: d(-5),  project_id: p[1].id, assigned_to: uid, assigned_by: uid },
    { title: 'Create HR policy document',         description: 'Draft updated leave and remote work policy',          status: 'in_review',   priority: 'low',    due_date: d(8),   project_id: p[3].id, assigned_to: uid, assigned_by: uid },
    { title: 'Set up CI/CD pipeline',             description: 'GitHub Actions for staging and production deploys',   status: 'done',        priority: 'high',   due_date: d(-3),  project_id: p[1].id, assigned_to: uid, assigned_by: uid },
  ]

  const { data: createdTasks, error: taskError } = await supabase.from('tasks').insert(tasks).select()
  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })

  const actions = ['created this task', 'updated priority to high', 'marked as complete', 'assigned this task', 'added a comment', 'changed status to in review', 'reopened']
  const activity = createdTasks!.map((t, i) => ({
    task_id: t.id,
    user_id: uid,
    action: actions[i % actions.length],
  }))

  const { error: actError } = await supabase.from('activity').insert(activity)
  if (actError) return NextResponse.json({ error: actError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    tasksCreated: createdTasks!.length,
    activitiesCreated: activity.length,
    message: `Seeded ${createdTasks!.length} tasks and ${activity.length} activity entries`,
  })
}

// DELETE /api/seed — wipes all seed data
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await supabase.from('activity').delete().eq('user_id', user.id)
  await supabase.from('tasks').delete().eq('assigned_by', user.id)

  return NextResponse.json({ success: true, message: 'Seed data cleared' })
}
