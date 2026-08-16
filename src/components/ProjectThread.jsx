import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// A builder <-> client message thread for one project, plus a review once the
// project is complete. Used by both the client portal (role="client") and the
// admin project page (role="admin").
export default function ProjectThread({ project, role, userId, userName }) {
  const [messages, setMessages] = useState([])
  const [review, setReview] = useState(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const scrollRef = useRef(null)

  const isComplete = project.status === 'complete'
  const isClient = role === 'client'

  async function load() {
    const [{ data: msgs }, { data: rev }] = await Promise.all([
      supabase.from('project_messages').select('*').eq('project_id', project.id).order('created_at'),
      supabase.from('reviews').select('*').eq('project_id', project.id).maybeSingle(),
    ])
    setMessages(msgs || [])
    setReview(rev || null)
  }
  useEffect(() => { load() }, [project.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text || busy) return
    setBusy(true)
    const { data, error } = await supabase
      .from('project_messages')
      .insert({ project_id: project.id, sender_id: userId, sender_role: role, body: text })
      .select().single()
    setBusy(false)
    if (!error && data) { setMessages((m) => [...m, data]); setBody('') }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (reviewBusy) return
    setReviewBusy(true)
    const { data, error } = await supabase
      .from('reviews')
      .insert({ project_id: project.id, client_id: userId, client_name: userName, rating, comment: comment.trim() })
      .select().single()
    setReviewBusy(false)
    if (!error && data) setReview(data)
  }

  return (
    <div className="mt-4 border-t border-ink-600 pt-4">
      <p className="label">Messages with {isClient ? 'the builder' : project.client_name || 'client'}</p>

      <div ref={scrollRef} className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-sand-500">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === role
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-clay/15 text-sand-100' : 'bg-ink-700 text-sand-200'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-1 text-[10px] text-sand-500">
                    {m.sender_role === 'admin' ? 'Builder' : 'Client'} · {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="field flex-1"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
        />
        <button type="submit" disabled={busy || !body.trim()} className="btn-primary px-4">
          {busy ? '…' : 'Send'}
        </button>
      </form>

      {/* Review */}
      {(isComplete || review) && (
        <div className="mt-5 border-t border-ink-600 pt-4">
          <p className="label">Review</p>
          {review ? (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-clay" aria-label={`${review.rating} out of 5`}>
                {'★★★★★'.slice(0, review.rating)}
                <span className="text-ink-500">{'★★★★★'.slice(review.rating)}</span>
              </div>
              {review.comment && <p className="mt-1.5 text-sm text-sand-300">“{review.comment}”</p>}
              <p className="mt-1 text-[11px] text-sand-500">
                {review.client_name || 'Client'}
                {!review.approved && (isClient ? ' · awaiting approval before it shows publicly' : ' · not yet approved')}
              </p>
            </div>
          ) : isClient ? (
            <form onSubmit={submitReview} className="mt-2 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    className={`text-2xl leading-none ${n <= rating ? 'text-clay' : 'text-ink-500'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="field"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was working with MTV? (optional)"
                maxLength={1000}
              />
              <button type="submit" disabled={reviewBusy} className="btn-primary">
                {reviewBusy ? 'Submitting…' : 'Leave review'}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-sand-500">No review left yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
