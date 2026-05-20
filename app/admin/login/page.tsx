'use client'
import { useState } from 'react'
import { adminLogin } from './actions'
import { ShieldCheck, Eye, EyeOff, Lock, User } from 'lucide-react'

export default function AdminLoginPage() {
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await adminLogin(form.username, form.password)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#eef2fb 0%,#e0faf3 100%)'}}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold" style={{color:'#1e3a8a'}}>Admin Portal</h1>
          <p className="text-sm mt-1" style={{color:'#64748b'}}>TaskFlow Management Console</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border p-8" style={{borderColor:'rgba(26,58,140,0.10)'}}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>
                Username
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}} />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={form.username}
                  onChange={e => setForm(f => ({...f, username: e.target.value}))}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a',background:'#f8faff'}}
                  onFocus={e => e.target.style.borderColor='#2575fc'}
                  onBlur={e => e.target.style.borderColor='rgba(26,58,140,0.15)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#64748b'}}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}} />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a',background:'#f8faff'}}
                  onFocus={e => e.target.style.borderColor='#2575fc'}
                  onBlur={e => e.target.style.borderColor='rgba(26,58,140,0.15)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60"
              style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t text-center" style={{borderColor:'rgba(26,58,140,0.08)'}}>
            <p className="text-[11px]" style={{color:'#94a3b8'}}>
              Admin access only · Credentials are static
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
