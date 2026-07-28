// Client helper for the AI quote-draft step. Sends the visitor's description +
// a compact service list to /api/quote-draft and returns matched line items +
// summary. Degrades gracefully: if the AI isn't configured or errors, it returns
// { ok: false } so the UI can fall back to the manual service picker.

export async function draftFromDescription(description, pricing) {
  const services = (pricing || []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.short_desc || r.description || '',
  }))

  try {
    const r = await fetch('/api/quote-draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description, services }),
    })
    if (!r.ok) return { ok: false, reason: r.status === 503 ? 'not_configured' : 'error' }
    const data = await r.json().catch(() => null)
    if (!data || !Array.isArray(data.items)) return { ok: false, reason: 'error' }
    // Map returned ids to a selection map { [id]: qty }.
    const selected = {}
    for (const it of data.items) selected[it.id] = it.qty || 1
    return { ok: true, summary: data.summary || '', selected }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
