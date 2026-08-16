import { useState } from 'react'

// Flips <html data-theme> between dark and light, remembers the choice, and
// tells the canvas background to recolour. The initial value is set in
// index.html before paint, so there's no flash.
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark'
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(currentTheme())

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('mtv-theme', next) } catch (e) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }))
    setTheme(next)
  }

  const goingLight = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={goingLight ? 'Switch to light mode' : 'Switch to dark mode'}
      title={goingLight ? 'Light mode' : 'Dark mode'}
      className={`rounded-md p-2 text-sand-200 transition hover:text-clay ${className}`}
    >
      {goingLight ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
