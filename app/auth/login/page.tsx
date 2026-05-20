'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { adminLoginFromUnified } from './actions'
import { Eye, EyeOff, User, ShieldCheck, Lock, Mail, BadgeCheck } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'user' | 'admin'>('user')

  // User login state
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [fullName, setFullName] = useState('')

  // Admin login state
  const [username, setUsername]       = useState('')
  const [adminPass, setAdminPass]     = useState('')

  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  function switchMode(m: 'user' | 'admin') {
    setMode(m); setError(''); setSuccess('')
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const supabase = createClient()

    if (isSignup) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError('Email already registered. Sign in instead.'); setLoading(false); return
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
    router.push('/dashboard'); router.refresh()
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await adminLoginFromUnified(username, adminPass)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#eef2fb 0%,#e0faf3 100%)'}}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-md"
              style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>TF</div>
            <span className="font-bold text-2xl" style={{color:'#1e3a8a'}}>Task<span style={{color:'#06d6a0'}}>Flow</span></span>
          </div>
          <p className="text-sm" style={{color:'#64748b'}}>
            {mode === 'admin' ? 'Admin Management Console' : isSignup ? 'Create your workspace account' : 'Sign in to your workspace'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-2xl p-1 mb-5 shadow-sm" style={{background:'rgba(255,255,255,0.8)',border:'1px solid rgba(26,58,140,0.10)'}}>
          <button type="button" onClick={() => switchMode('user')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={mode === 'user'
              ? {background:'linear-gradient(135deg,#2575fc,#06d6a0)',color:'#fff',boxShadow:'0 2px 8px rgba(37,117,252,0.3)'}
              : {color:'#64748b'}}>
            <User size={14}/> User
          </button>
          <button type="button" onClick={() => switchMode('admin')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={mode === 'admin'
              ? {background:'linear-gradient(135deg,#2575fc,#06d6a0)',color:'#fff',boxShadow:'0 2px 8px rgba(37,117,252,0.3)'}
              : {color:'#64748b'}}>
            <ShieldCheck size={14}/> Admin
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 shadow-xl" style={{background:'#fff',border:'1px solid rgba(26,58,140,0.10)'}}>

          {/* ── USER FORM ── */}
          {mode === 'user' && (
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>Full Name</label>
                  <div className="relative">
                    <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
                    <input className="input pl-9" type="text" placeholder="Arjun Kumar"
                      value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
                  <input className="input pl-9" type="email" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
                  <input className="input pl-9 pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              {error   && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
              {success && <p className="text-green-600 text-xs bg-green-50 border border-green-100 px-3 py-2 rounded-lg">{success}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60"
                style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>
                {loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
              </button>

              <p className="text-center text-xs pt-1" style={{color:'#94a3b8'}}>
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess('') }}
                  className="font-semibold hover:underline" style={{color:'#06d6a0'}}>
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </form>
          )}

          {/* ── ADMIN FORM ── */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>Username</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
                  <input className="input pl-9" type="text" placeholder="admin"
                    value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
                  <input className="input pl-9 pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    value={adminPass} onChange={e => setAdminPass(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60"
                style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>
                {loading ? 'Signing in…' : 'Sign In as Admin'}
              </button>

              <p className="text-center text-[11px] pt-1" style={{color:'#94a3b8'}}>
                Admin access only · Static credentials
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
