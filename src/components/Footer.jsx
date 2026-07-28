import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { toLines } from '../lib/format.js'

export default function Footer() {
  const [content, setContent] = useState({})

  useEffect(() => {
    supabase
      .from('site_content')
      .select('key, value')
      .in('key', ['footer_tagline', 'builton_label', 'builton'])
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach((r) => { map[r.key] = r.value })
        setContent(map)
      })
  }, [])

  const tech = toLines(content.builton)

  return (
    <footer className="border-t border-ink-600 bg-ink-800">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay font-black text-ink-900">M</span>
              <span className="font-semibold">Mumbi Technology Ventures</span>
            </div>
            <p className="mt-3 text-sm text-sand-400">
              {content.footer_tagline || 'Practical technology that works, scales, and pays off.'}
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wider text-sand-500">Pages</p>
              <ul className="space-y-1.5 text-sm text-sand-200">
                <li><Link to="/" className="hover:text-clay">Home</Link></li>
                <li><Link to="/pricing" className="hover:text-clay">Pricing</Link></li>
                <li><Link to="/contact" className="hover:text-clay">Contact</Link></li>
              </ul>
            </div>
            {tech.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-sand-500">
                  {content.builton_label || 'Built on'}
                </p>
                <ul className="space-y-1.5 text-sm text-sand-400">
                  {tech.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-ink-600 pt-6 text-xs text-sand-500 md:flex-row md:items-center md:justify-between">
          <p className="font-mono">© {new Date().getFullYear()} Mumbi Technology Ventures · Lusaka, Zambia</p>
          <Link to="/login" className="font-mono hover:text-clay">Log in</Link>
        </div>
      </div>
    </footer>
  )
}
