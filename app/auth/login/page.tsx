'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignup) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      // Email already registered (identities empty = duplicate account)
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.')
        setLoading(false)
        return
      }

      // Email confirmation required — no session yet
      if (!signUpData.session) {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setLoading(false)
        return
      }

      // Confirmed immediately (email confirmation disabled) — upsert profile as fallback
      if (signUpData.user) {
        await supabase.from('profiles').upsert({ id: signUpData.user.id, email, full_name: fullName })
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-display font-black text-white">TF</div>
            <span className="font-display font-bold text-xl">Task<span className="text-accent2">Flow</span></span>
          </div>
          <p className="text-gray-500 text-sm">{isSignup ? 'Create your account' : 'Sign in to your workspace'}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input className="input" type="text" placeholder="Arjun Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm font-semibold">
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="text-accent2 hover:underline">
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
