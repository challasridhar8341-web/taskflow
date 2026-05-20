export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  department?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  color: string
  created_by: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  start_date?: string
  due_date?: string
  project_id?: string
  assigned_to: string
  assigned_by: string
  inform_to?: string
  inform_status?: 'none' | 'pending' | 'approved' | 'rejected'
  team?: string
  created_at: string
  updated_at: string
  // joined
  assignee?: Profile
  assigner?: Profile
  project?: Project
  informed_user?: Profile
}

export interface Activity {
  id: string
  task_id: string
  user_id: string
  action: string
  created_at: string
  user?: Profile
  task?: Task
}
