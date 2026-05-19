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
  return { high: 'text-red-400 bg-red-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-green-400 bg-green-400/10' }[p]
}

export function statusColor(s: TaskStatus) {
  return {
    todo: 'text-gray-400 bg-gray-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    in_review: 'text-purple-400 bg-purple-400/10',
    done: 'text-green-400 bg-green-400/10',
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
    'bg-indigo-500/20 text-indigo-300',
    'bg-green-500/20 text-green-300',
    'bg-blue-500/20 text-blue-300',
    'bg-pink-500/20 text-pink-300',
    'bg-purple-500/20 text-purple-300',
    'bg-yellow-500/20 text-yellow-300',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
