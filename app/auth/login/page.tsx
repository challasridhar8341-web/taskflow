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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (isSignup) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.')
        setLoading(false); return
      }
      if (!signUpData.session) {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setLoading(false); return
      }
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
            <div className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center font-bold !text-white text-base shadow-md">TF</div>
            <span className="font-bold text-2xl text-accent">Task<span className="text-accent2">Flow</span></span>
          </div>
          <p className="text-[#64748b] text-sm mt-1">{isSignup ? 'Create your account' : 'Sign in to your workspace'}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-4 shadow-md">
          {isSignup && (
            <div>
              <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5 font-semibold">Full Name</label>
              <input className="input" type="text" placeholder="Arjun Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5 font-semibold">Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5 font-semibold">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm font-semibold mt-2">
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748b] mt-5">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="text-accent2 font-semibold hover:underline">
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
