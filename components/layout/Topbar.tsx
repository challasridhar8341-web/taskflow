'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import type { Profile } from '@/types'
import NewTaskModal from '@/components/tasks/NewTaskModal'
import NotificationsDropdown from '@/components/layout/NotificationsDropdown'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/my-tasks': 'Tasks',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
}

export default function Topbar({ profile }: { profile: Profile | null }) {
  const [showModal, setShowModal] = useState(false)
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Dashboard'

  return (
    <>
      <header className="bg-surface border-b border-border px-7 py-4 flex items-center gap-4">
        <h1 className="font-display font-bold text-lg flex-1">{title}</h1>

        <div className="flex items-center gap-2 bg-surface2 border border-border2 rounded-lg px-3 py-2 w-52">
          <Search size={14} className="text-gray-500" />
          <input type="text" placeholder="Search tasks..." className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
        </div>

        <NotificationsDropdown />

        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="text-lg leading-none">+</span> New Task
        </button>
      </header>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} currentUserId={profile?.id || ''} />}
    </>
  )
}
