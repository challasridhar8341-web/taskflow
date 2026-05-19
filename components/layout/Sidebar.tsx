'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { avatarColor, initials } from '@/lib/utils'
import type { Profile } from '@/types'
import { LayoutDashboard, CheckSquare, BarChart2, LogOut, Settings, CalendarDays } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/my-tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-60 min-w-[240px] bg-surface border-r border-border flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-display font-black text-white text-sm">TF</div>
          <span className="font-display font-bold text-base">Task<span className="text-accent2">Flow</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest px-2 mb-2">Workspace</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-accent/10 text-accent2' : 'text-gray-400 hover:text-white hover:bg-surface2'}`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-surface2 transition-colors">
          <Settings size={16} /> Settings
        </button>
        <button onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(profile.full_name)}`}>
              {initials(profile.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{profile.full_name}</div>
              <div className="text-[10px] text-gray-500 truncate">{profile.department ?? profile.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
