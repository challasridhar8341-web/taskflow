'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_ACCOUNTS = [
  { username: 'admin',   password: 'admin@123',    name: 'Super Admin' },
  { username: 'manager', password: 'manager@123',  name: 'Manager'     },
]

export async function adminLogin(username: string, password: string): Promise<{ error: string } | null> {
  const match = ADMIN_ACCOUNTS.find(a => a.username === username && a.password === password)
  if (!match) return { error: 'Invalid username or password' }

  const cookieStore = await cookies()
  cookieStore.set('admin_session', match.name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  redirect('/admin/dashboard')
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/auth/login')
}
