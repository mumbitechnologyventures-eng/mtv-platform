import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Loads all publicly-readable site_content rows into a { key: value } map.
// The 'Business' section is admin-only per RLS, so it simply won't come back
// for anonymous visitors — that's expected.
export function useSiteContent() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('site_content')
      .select('key, value, section')
      .then(({ data }) => {
        if (!active) return
        const map = {}
        ;(data || []).forEach((r) => { map[r.key] = r.value })
        setContent(map)
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return { content, loading }
}
