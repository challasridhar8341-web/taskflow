'use client'
import { useState, useMemo } from 'react'
import { adminLogout } from '@/app/admin/login/actions'
import { cn, formatDate, isOverdue, priorityColor, priorityLabel, statusColor, statusLabel, avatarColor, initials } from '@/lib/utils'
import type { Task, Profile } from '@/types'
import { ShieldCheck, LogOut, Users, CheckCircle2, Clock, AlertTriangle, ListTodo, Search, X, TrendingUp, Award, BarChart3 } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: number; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex flex-col gap-2 shadow-sm" style={{borderColor:'rgba(26,58,140,0.10)'}}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{color:'#64748b'}}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:color+'20'}}>
          <Icon size={15} style={{color}} />
        </div>
      </div>
      <div className="text-3xl font-bold" style={{color:'#1e3a8a'}}>{value}</div>
      <div className="text-xs" style={{color:'#94a3b8'}}>{sub}</div>
    </div>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:color}} />
    </div>
  )
}

export default function AdminDashboard({ tasks, profiles, adminName }: { tasks: Task[]; profiles: Profile[]; adminName: string }) {
  const [search, setSearch]             = useState('')
  const [userFilter, setUserFilter]     = useState('')
  const [teamFilter, setTeamFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [groupBy, setGroupBy]           = useState<'none'|'user'|'status'|'priority'|'team'>('none')
  const [perfTab, setPerfTab]           = useState<'team'|'individual'>('team')
  // Separate date range just for performance analytics
  const [perfFrom, setPerfFrom]         = useState('')
  const [perfTo, setPerfTo]             = useState('')

  // Unique teams from tasks
  const teams = useMemo(() => {
    const t = new Set(tasks.map(t => t.team).filter(Boolean) as string[])
    return Array.from(t).sort()
  }, [tasks])

  const filtered = useMemo(() => tasks.filter(t => {
    if (userFilter && t.assigned_to !== userFilter && t.assigned_by !== userFilter) return false
    if (teamFilter && t.team !== teamFilter) return false
    if (statusFilter !== 'All' && t.status !== statusFilter) return false
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false
    if (dateFrom && (!t.due_date || t.due_date < dateFrom)) return false
    if (dateTo   && (!t.due_date || t.due_date > dateTo))   return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) &&
          !t.description?.toLowerCase().includes(q) &&
          !t.assignee?.full_name.toLowerCase().includes(q)) return false
    }
    return true
  }), [tasks, userFilter, teamFilter, statusFilter, priorityFilter, dateFrom, dateTo, search])

  // Tasks filtered only by the performance date range
  const perfTasks = useMemo(() => tasks.filter(t => {
    if (perfFrom && (!t.due_date || t.due_date < perfFrom)) return false
    if (perfTo   && (!t.due_date || t.due_date > perfTo))   return false
    return true
  }), [tasks, perfFrom, perfTo])

  // ── Stats ──
  const stats = {
    total:      tasks.length,
    done:       tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue:    tasks.filter(t => t.due_date && isOverdue(t.due_date) && t.status !== 'done').length,
    users:      profiles.length,
  }

  // ── Team performance (based on perfTasks) ──
  const teamPerf = useMemo(() => {
    const map: Record<string, { total: number; done: number; inProgress: number; overdue: number }> = {}
    perfTasks.forEach(t => {
      const key = t.team || 'No Team'
      if (!map[key]) map[key] = { total: 0, done: 0, inProgress: 0, overdue: 0 }
      map[key].total++
      if (t.status === 'done') map[key].done++
      if (t.status === 'in_progress') map[key].inProgress++
      if (t.due_date && isOverdue(t.due_date) && t.status !== 'done') map[key].overdue++
    })
    return Object.entries(map)
      .map(([team, d]) => ({ team, ...d, pct: Math.round(d.done / Math.max(d.total, 1) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [perfTasks])

  // ── Individual performance (based on perfTasks) ──
  const individualPerf = useMemo(() => {
    const map: Record<string, { profile: Profile; total: number; done: number; inProgress: number; overdue: number }> = {}
    perfTasks.forEach(t => {
      if (!t.assigned_to) return
      if (!map[t.assigned_to]) {
        const profile = profiles.find(p => p.id === t.assigned_to) || { id: t.assigned_to, full_name: 'Unknown', email: '', created_at: '' } as Profile
        map[t.assigned_to] = { profile, total: 0, done: 0, inProgress: 0, overdue: 0 }
      }
      map[t.assigned_to].total++
      if (t.status === 'done') map[t.assigned_to].done++
      if (t.status === 'in_progress') map[t.assigned_to].inProgress++
      if (t.due_date && isOverdue(t.due_date) && t.status !== 'done') map[t.assigned_to].overdue++
    })
    return Object.values(map)
      .map(d => ({ ...d, pct: Math.round(d.done / Math.max(d.total, 1) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [perfTasks, profiles])

  // ── Grouped table ──
  const grouped = useMemo(() => {
    if (groupBy === 'none') return { '': filtered }
    const map: Record<string, Task[]> = {}
    filtered.forEach(t => {
      let key = ''
      if (groupBy === 'user')     key = t.assignee?.full_name || t.assigned_to
      if (groupBy === 'status')   key = statusLabel(t.status)
      if (groupBy === 'priority') key = priorityLabel(t.priority)
      if (groupBy === 'team')     key = t.team || 'No Team'
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [filtered, groupBy])

  function clearFilters() {
    setSearch(''); setUserFilter(''); setTeamFilter(''); setStatusFilter('All')
    setPriorityFilter('All'); setDateFrom(''); setDateTo('')
  }

  const hasFilters = search || userFilter || teamFilter || statusFilter !== 'All' || priorityFilter !== 'All' || dateFrom || dateTo

  const perfColor = (pct: number) => pct >= 75 ? '#06d6a0' : pct >= 40 ? '#2575fc' : '#f59e0b'

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#eef2fb 0%,#e0faf3 100%)'}}>
      {/* Topbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm" style={{borderColor:'rgba(26,58,140,0.10)'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#2575fc,#06d6a0)'}}>
            <ShieldCheck size={16} color="#fff" />
          </div>
          <span className="font-bold text-sm" style={{color:'#1e3a8a'}}>TaskFlow Admin</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:'#eff6ff',color:'#2575fc'}}>Console</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium" style={{color:'#475569'}}>👋 {adminName}</span>
          <form action={adminLogout}>
            <button type="submit" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#64748b'}}>
              <LogOut size={13}/> Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#1e3a8a'}}>All Tasks Overview</h1>
          <p className="text-sm mt-0.5" style={{color:'#64748b'}}>Complete view of all tasks across all users & teams</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Tasks"  value={stats.total}      sub="across all users"        color="#2575fc" icon={ListTodo}     />
          <StatCard label="Done"         value={stats.done}       sub={`${Math.round(stats.done/Math.max(stats.total,1)*100)}% completion`} color="#06d6a0" icon={CheckCircle2} />
          <StatCard label="In Progress"  value={stats.inProgress} sub="actively being worked on" color="#3b82f6" icon={Clock}         />
          <StatCard label="Overdue"      value={stats.overdue}    sub="need immediate attention"  color="#ef4444" icon={AlertTriangle} />
          <StatCard label="Total Users"  value={stats.users}      sub="registered members"        color="#8b5cf6" icon={Users}         />
        </div>

        {/* ── Date Range for Performance ── */}
        <div className="bg-white rounded-2xl border px-5 py-4 shadow-sm flex items-center gap-4 flex-wrap" style={{borderColor:'rgba(26,58,140,0.10)'}}>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{color:'#2575fc'}}/>
            <span className="text-xs font-bold uppercase tracking-wider" style={{color:'#1e3a8a'}}>Date Range</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={perfFrom} onChange={e => setPerfFrom(e.target.value)}
              className="py-1.5 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a'}}/>
            <span className="text-xs font-medium" style={{color:'#94a3b8'}}>→</span>
            <input type="date" value={perfTo} onChange={e => setPerfTo(e.target.value)}
              className="py-1.5 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a'}}/>
          </div>
          {(perfFrom || perfTo) && (
            <button onClick={() => { setPerfFrom(''); setPerfTo('') }}
              className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors" style={{color:'#94a3b8'}}>
              <X size={12}/> Clear
            </button>
          )}
          <span className="text-xs ml-2" style={{color:'#64748b'}}>
            Showing <span className="font-semibold" style={{color:'#2575fc'}}>{perfTasks.length}</span> tasks
            {(perfFrom || perfTo) ? ` in selected range` : ` (all time)`}
          </span>
        </div>

        {/* ── Performance Section ── */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:'rgba(26,58,140,0.10)'}}>
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:'rgba(26,58,140,0.08)',background:'linear-gradient(135deg,#f0fbff,#e8fdf5)'}}>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{color:'#2575fc'}}/>
              <span className="font-bold text-sm" style={{color:'#1e3a8a'}}>Performance Analytics</span>
              {(perfFrom || perfTo) && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:'#eff6ff',color:'#2575fc'}}>
                  {perfFrom && perfTo ? `${perfFrom} → ${perfTo}` : perfFrom ? `From ${perfFrom}` : `Until ${perfTo}`}
                </span>
              )}
            </div>
            <div className="flex rounded-xl overflow-hidden border" style={{borderColor:'rgba(26,58,140,0.15)'}}>
              {(['team','individual'] as const).map(tab => (
                <button key={tab} onClick={() => setPerfTab(tab)}
                  className="px-4 py-1.5 text-xs font-semibold transition-all capitalize"
                  style={perfTab === tab
                    ? {background:'linear-gradient(135deg,#2575fc,#06d6a0)',color:'#fff'}
                    : {background:'#fff',color:'#64748b'}}>
                  {tab === 'team' ? '🏢 Teams' : '👤 Individuals'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {/* Team Performance */}
            {perfTab === 'team' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPerf.length === 0 && <p className="text-sm col-span-3 text-center py-8" style={{color:'#94a3b8'}}>No team data yet</p>}
                {teamPerf.map(({ team, total, done, inProgress, overdue, pct }) => (
                  <div key={team} className="rounded-xl border p-4 space-y-3" style={{borderColor:'rgba(26,58,140,0.10)'}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{background:`linear-gradient(135deg,${perfColor(pct)},${perfColor(pct)}88)`}}>
                          {team[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm" style={{color:'#1e3a8a'}}>{team}</span>
                      </div>
                      <span className="text-lg font-bold" style={{color: perfColor(pct)}}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={perfColor(pct)} />
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { label: 'Total', val: total, color: '#64748b' },
                        { label: 'Done',  val: done,  color: '#06d6a0' },
                        { label: 'Active',val: inProgress, color: '#2575fc' },
                        { label: 'Overdue',val: overdue, color: '#ef4444' },
                      ].map(({ label, val, color }) => (
                        <div key={label}>
                          <div className="text-base font-bold" style={{color}}>{val}</div>
                          <div className="text-[10px]" style={{color:'#94a3b8'}}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Performance */}
            {perfTab === 'individual' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{borderColor:'rgba(26,58,140,0.08)'}}>
                      {['#','Member','Team','Completion','Tasks','Done','Active','Overdue'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest font-bold" style={{color:'#1e3a8a'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {individualPerf.map(({ profile, total, done, inProgress, overdue, pct }, i) => (
                      <tr key={profile.id} className="border-b hover:bg-blue-50/30 transition-colors" style={{borderColor:'rgba(26,58,140,0.06)'}}>
                        <td className="py-3 px-3">
                          <span className="text-xs font-bold" style={{color: i < 3 ? ['#f59e0b','#94a3b8','#cd7c3a'][i] : '#cbd5e1'}}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold', avatarColor(profile.full_name))}>
                              {initials(profile.full_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-xs" style={{color:'#1e3a8a'}}>{profile.full_name}</p>
                              <p className="text-[10px]" style={{color:'#94a3b8'}}>{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{background:'#eff6ff',color:'#2575fc'}}>
                            {profile.department || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <ProgressBar pct={pct} color={perfColor(pct)} />
                            <span className="text-xs font-bold flex-shrink-0" style={{color:perfColor(pct)}}>{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold" style={{color:'#475569'}}>{total}</td>
                        <td className="py-3 px-3 text-xs font-semibold" style={{color:'#06d6a0'}}>{done}</td>
                        <td className="py-3 px-3 text-xs font-semibold" style={{color:'#2575fc'}}>{inProgress}</td>
                        <td className="py-3 px-3 text-xs font-semibold" style={{color: overdue > 0 ? '#ef4444' : '#cbd5e1'}}>{overdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {individualPerf.length === 0 && <p className="text-center py-8 text-sm" style={{color:'#94a3b8'}}>No individual data yet</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-2xl border p-4 space-y-3 shadow-sm" style={{borderColor:'rgba(26,58,140,0.10)'}}>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#94a3b8'}}/>
              <input type="text" placeholder="Search tasks, users…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs outline-none"
                style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a'}}/>
            </div>

            {/* Team filter */}
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:teamFilter?'#2575fc':'#64748b'}}>
              <option value="">All Teams</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__none__">No Team</option>
            </select>

            {/* User filter */}
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:userFilter?'#2575fc':'#64748b'}}>
              <option value="">All Users</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:statusFilter!=='All'?'#2575fc':'#64748b'}}>
              <option value="All">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>

            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:priorityFilter!=='All'?'#2575fc':'#64748b'}}>
              <option value="All">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}
              className="py-2 px-3 rounded-xl border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#64748b'}}>
              <option value="none">No Grouping</option>
              <option value="team">Group by Team</option>
              <option value="user">Group by User</option>
              <option value="status">Group by Status</option>
              <option value="priority">Group by Priority</option>
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors" style={{color:'#94a3b8'}}>
                <X size={12}/> Clear
              </button>
            )}
            <span className="ml-auto text-xs font-semibold" style={{color:'#1e3a8a'}}>{filtered.length} task{filtered.length!==1?'s':''}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{color:'#64748b'}}>Task end date range:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="py-1.5 px-2 rounded-lg border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a'}}/>
            <span className="text-xs" style={{color:'#94a3b8'}}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="py-1.5 px-2 rounded-lg border text-xs outline-none"
              style={{borderColor:'rgba(26,58,140,0.15)',color:'#1e3a8a'}}/>
            <span className="text-[10px]" style={{color:'#94a3b8'}}>(filters task table only)</span>
          </div>
        </div>

        {/* ── Task table(s) ── */}
        {Object.entries(grouped).map(([groupKey, groupTasks]) => (
          <div key={groupKey} className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:'rgba(26,58,140,0.10)'}}>
            {groupBy !== 'none' && (
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'rgba(26,58,140,0.08)',background:'linear-gradient(135deg,#f0fbff,#e8fdf5)'}}>
                <span className="font-bold text-sm" style={{color:'#1e3a8a'}}>{groupKey}</span>
                <span className="text-xs" style={{color:'#64748b'}}>{groupTasks.length} task{groupTasks.length!==1?'s':''}</span>
              </div>
            )}

            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_0.7fr_0.75fr_0.75fr_0.85fr] px-5 py-2.5 border-b text-[10px] uppercase tracking-widest font-bold"
              style={{borderColor:'rgba(26,58,140,0.08)',background:'linear-gradient(135deg,#eef9ff,#e0faf3)',color:'#1e3a8a'}}>
              <div>Task</div>
              <div style={{color:'#2575fc'}}>Assigned To</div>
              <div style={{color:'#059669'}}>Assigner</div>
              <div style={{color:'#d97706'}}>Approver</div>
              <div>Priority</div><div>Start</div><div>End</div><div>Status</div>
            </div>

            {groupTasks.length === 0 && <div className="py-10 text-center text-sm" style={{color:'#94a3b8'}}>No tasks</div>}

            {groupTasks.map(task => {
              const done    = task.status === 'done'
              const overdue = task.due_date && isOverdue(task.due_date) && !done
              return (
                <div key={task.id}
                  className="grid grid-cols-[2.5fr_1fr_1fr_1fr_0.7fr_0.75fr_0.75fr_0.85fr] px-5 py-3 border-b last:border-b-0 items-center hover:bg-blue-50/30 transition-colors"
                  style={{borderColor:'rgba(26,58,140,0.06)'}}>

                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold truncate', done ? 'line-through text-gray-400' : '')}
                      style={{color: done ? undefined : '#1e3a8a'}}>{task.title}</p>
                    {task.description && <p className="text-[11px] truncate mt-0.5" style={{color:'#94a3b8'}}>{task.description}</p>}
                    {task.team && <span className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{background:'#eff6ff',color:'#2575fc'}}>{task.team}</span>}
                  </div>

                  {[
                    { person: task.assignee, color: '#2575fc' },
                    { person: task.assigner, color: '#059669' },
                    { person: task.informed_user, color: '#d97706' },
                  ].map(({ person, color }, i) => (
                    <div key={i}>
                      {person ? (
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold', avatarColor(person.full_name))}>
                            {initials(person.full_name)}
                          </div>
                          <span className="text-xs font-medium truncate" style={{color}}>{person.full_name.split(' ')[0]}</span>
                        </div>
                      ) : <span className="text-xs" style={{color:'#cbd5e1'}}>—</span>}
                    </div>
                  ))}

                  <div><span className={cn('badge', priorityColor(task.priority))}>{priorityLabel(task.priority)}</span></div>

                  <div className="text-xs font-medium" style={{color:'#475569'}}>
                    {(task as any).start_date ? formatDate((task as any).start_date) : '—'}
                  </div>

                  <div className={cn('text-xs font-medium', overdue ? 'text-red-500' : '')} style={{color: overdue ? undefined : '#475569'}}>
                    {task.due_date ? formatDate(task.due_date) : '—'}
                    {overdue && <span className="ml-1">⚠</span>}
                  </div>

                  <div><span className={cn('badge', statusColor(task.status))}>{statusLabel(task.status)}</span></div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
