'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Shield, Bell, ChevronRight, Check } from 'lucide-react'
import { avatarColor, initials } from '@/lib/utils'

const TEAMS = ['Tech', 'Design', 'Marketing', 'Content', 'HR', 'Other']

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ id: string; full_name: string; email: string; department?: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'profile' | 'account'>('profile')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setFullName(p.full_name || '')
        setDepartment(p.department || '')
      }
    }
    load()
  }, [])

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: fullName,
      department,
    }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handlePasswordReset() {
    if (!profile?.email) return
    await supabase.auth.resetPasswordForEmail(profile.email)
    alert('Password reset email sent to ' + profile.email)
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-40">
      <div className="text-gray-500 text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface2/50 rounded-xl border border-border w-fit">
        {(['profile', 'account'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-accent/15 text-accent2' : 'text-gray-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${avatarColor(fullName || profile.full_name)}`}>
              {initials(fullName || profile.full_name)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{fullName || profile.full_name}</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Full Name */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Team / Department</label>
            <select className="input" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">Select team</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <input className="input opacity-50 cursor-not-allowed" value={profile.email} readOnly />
            <p className="text-[11px] text-gray-600 mt-1">Email cannot be changed</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-primary w-full justify-center flex items-center gap-2">
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'account' && (
        <div className="card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Password</p>
            <p className="text-xs text-gray-500 mb-3">Send a password reset link to your email</p>
            <button onClick={handlePasswordReset} className="btn-ghost flex items-center gap-2">
              <Shield size={14} />
              Send Reset Email
              <ChevronRight size={14} className="ml-auto" />
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-white mb-1">Account Info</p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-400">Email</span>
                <span className="text-xs text-white">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-400">Team</span>
                <span className="text-xs text-white">{profile.department || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-400">User ID</span>
                <span className="text-xs text-gray-600 font-mono truncate max-w-[180px]">{profile.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
