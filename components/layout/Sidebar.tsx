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
    <aside className="w-60 min-w-[240px] bg-surface border-r border-border flex flex-col h-screen shadow-sm">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border" style={{background:'linear-gradient(135deg,#f0fbff 0%,#e0faf3 100%)'}}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md" style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)',color:'#fff'}}>TF</div>
          <span className="font-bold text-base" style={{color:'#1e3a8a'}}>Task<span style={{color:'#2563eb'}}>Flow</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest px-2 mb-2 font-semibold">Workspace</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              style={active ? { background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)', color: '#ffffff' } : {}}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'shadow-sm' : 'text-[#475569] hover:bg-surface2 hover:text-accent'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#475569] hover:text-accent hover:bg-surface2 transition-colors">
          <Settings size={16} /> Settings
        </button>
        <button onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#475569] hover:text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 bg-surface2 rounded-xl">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold !text-white ${avatarColor(profile.full_name)}`}>
              {initials(profile.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-accent truncate">{profile.full_name}</div>
              <div className="text-[10px] text-[#94a3b8] truncate">{profile.department ?? profile.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
