'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

const SEARCHABLE_PAGES = ['/dashboard', '/dashboard/my-tasks']

export default function Topbar({ profile }: { profile: Profile | null }) {
  const [showModal, setShowModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = pageTitles[pathname] ?? 'Dashboard'
  const isSearchable = SEARCHABLE_PAGES.includes(pathname)

  const [q, setQ] = useState(searchParams.get('q') || '')

  useEffect(() => {
    setQ(searchParams.get('q') || '')
  }, [pathname])

  function handleSearch(value: string) {
    setQ(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) params.set('q', value.trim())
    else params.delete('q')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <header className="bg-surface border-b border-border px-7 py-4 flex items-center gap-4 shadow-sm" style={{borderBottom:'2px solid transparent',backgroundImage:'linear-gradient(white,white),linear-gradient(135deg,#2575fc33,#06d6a033)',backgroundOrigin:'border-box',backgroundClip:'padding-box,border-box'}}>
        <h1 className="font-bold text-xl text-accent flex-1">{title}</h1>

        <div className={`flex items-center gap-2 bg-surface2 border rounded-xl px-3 py-2 w-52 transition-colors ${
          isSearchable ? 'border-border2' : 'border-border opacity-40 pointer-events-none'
        }`}>
          <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
          <input
            type="text"
            placeholder={isSearchable ? 'Search tasks...' : 'Search unavailable'}
            className="bg-transparent text-sm text-accent placeholder-[#94a3b8] outline-none w-full"
            value={q}
            onChange={e => handleSearch(e.target.value)}
            disabled={!isSearchable}
          />
          {q && isSearchable && (
            <button onClick={() => handleSearch('')} className="text-[#94a3b8] hover:text-accent text-xs">✕</button>
          )}
        </div>

        <NotificationsDropdown currentUserId={profile?.id || ''} />

        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="text-lg leading-none font-bold">+</span> New Task
        </button>
      </header>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} currentUserId={profile?.id || ''} />}
    </>
  )
}
