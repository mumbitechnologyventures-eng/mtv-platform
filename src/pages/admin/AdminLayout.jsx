import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const nav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/requests', label: 'Requests' },
  { to: '/admin/followup', label: 'Follow-up' },
  { to: '/admin/pipeline', label: 'Pipeline' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/content', label: 'Site content' },
  { to: '/admin/rates', label: 'Exchange rates' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar */}
      <aside className="glass border-b border-white/5 md:w-60 md:flex-none md:border-b-0 md:border-r md:border-white/5">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-clay text-sm font-black text-ink-900">M</span>
            <span className="text-sm font-semibold">MTV Admin</span>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-sand-100' : 'text-sand-300 hover:bg-white/5'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-ink-600 p-4 md:block">
          <p className="text-xs text-sand-500">Signed in as</p>
          <p className="truncate text-sm text-sand-200">{profile?.name || profile?.email}</p>
          <button onClick={logout} className="mt-3 text-xs font-medium text-clay hover:underline">Sign out</button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-ink-600 px-6 py-3 md:hidden">
          <span className="text-sm text-sand-300">{profile?.name || profile?.email}</span>
          <button onClick={logout} className="text-xs font-medium text-clay">Sign out</button>
        </div>
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
