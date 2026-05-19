'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

const TEAMS = [
  { id: 'Tech',      label: 'Tech',      emoji: '🔧', desc: 'Engineering & development' },
  { id: 'Design',    label: 'Design',    emoji: '🎨', desc: 'UI/UX & visual design' },
  { id: 'Marketing', label: 'Marketing', emoji: '📢', desc: 'Growth & campaigns' },
  { id: 'Content',   label: 'Content',   emoji: '✍️',  desc: 'Writing & media' },
  { id: 'HR',        label: 'HR',        emoji: '👥', desc: 'People & culture' },
  { id: 'Other',     label: 'Other',     emoji: '⚡', desc: 'Everything else' },
]

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({ department: selected })
      .eq('id', user.id)

    if (err) { setError('Failed to save. Please try again.'); setLoading(false); return }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-display font-black text-white">TF</div>
            <span className="font-display font-bold text-xl">Task<span className="text-accent2">Flow</span></span>
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">Welcome! Select your team</h1>
          <p className="text-sm text-gray-500">Choose the team you belong to. This helps us personalise your workspace.</p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TEAMS.map(team => (
            <button
              key={team.id}
              onClick={() => setSelected(team.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-150',
                selected === team.id
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-border2 hover:bg-surface2/60 bg-surface'
              )}
            >
              {selected === team.id && (
                <CheckCircle2 size={16} className="absolute top-3 right-3 text-accent2" />
              )}
              <div className="text-2xl mb-2">{team.emoji}</div>
              <div className={cn('text-sm font-semibold', selected === team.id ? 'text-white' : 'text-gray-200')}>
                {team.label}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{team.desc}</div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-sm transition-all',
            selected && !loading
              ? 'bg-accent hover:bg-accent/90 text-white'
              : 'bg-surface2 text-gray-500 cursor-not-allowed'
          )}
        >
          {loading ? 'Saving...' : selected ? `Continue as ${selected} team →` : 'Select a team to continue'}
        </button>
      </div>
    </div>
  )
}
