import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isAfter, parseISO } from 'date-fns'
import type { Priority, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return format(parseISO(date), 'MMM d, yyyy')
}

export function isOverdue(dueDate: string) {
  return isAfter(new Date(), parseISO(dueDate))
}

export function priorityColor(p: Priority) {
  return {
    high:   'text-red-700 bg-red-100 border border-red-200',
    medium: 'text-yellow-700 bg-yellow-100 border border-yellow-200',
    low:    'text-green-700 bg-green-100 border border-green-200',
  }[p]
}

export function statusColor(s: TaskStatus) {
  return {
    todo:        'text-slate-600 bg-slate-100 border border-slate-200',
    in_progress: 'text-blue-700 bg-blue-100 border border-blue-200',
    in_review:   'text-purple-700 bg-purple-100 border border-purple-200',
    done:        'text-green-700 bg-green-100 border border-green-200',
  }[s]
}

export function statusLabel(s: TaskStatus) {
  return { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' }[s]
}

export function priorityLabel(p: Priority) {
  return { high: '↑ High', medium: '→ Medium', low: '↓ Low' }[p]
}

export function avatarColor(name: string) {
  const colors = [
    'bg-indigo-500 text-white',
    'bg-green-500 text-white',
    'bg-blue-500 text-white',
    'bg-pink-500 text-white',
    'bg-purple-500 text-white',
    'bg-orange-500 text-white',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
