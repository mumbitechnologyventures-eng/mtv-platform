import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { isAdmin, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-sand-500/20 bg-ink-900/70 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sand-500/25 to-transparent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'text-clay text-glow' : 'text-sand-200 hover:text-sand-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-sand-400 hover:text-clay">
              Admin
            </NavLink>
          )}
          {!user && (
            <NavLink to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-sand-200 hover:text-clay">
              Log in
            </NavLink>
          )}
          <ThemeToggle className="ml-1" />
          <Link to="/start" className="btn-primary ml-2">Request a quote</Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <button
          className="rounded-md border border-sand-500/20 bg-sand-500/5 p-2 text-sand-200"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-sand-500/20 px-5 py-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'text-clay' : 'text-sand-200'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-sand-400">
              Admin
            </NavLink>
          )}
          {!user && (
            <NavLink to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-sand-200">
              Log in
            </NavLink>
          )}
          <Link to="/start" onClick={() => setOpen(false)} className="btn-primary mt-2">Request a quote</Link>
        </nav>
      )}
    </header>
  )
}
