import { useEffect, useRef, useState } from 'react'
import { ask, SUGGESTIONS, MAX_INPUT, messagesLeft } from '../lib/chat.js'

const GREETING = {
  role: 'assistant',
  content: 'Hi — I\'m the MTV assistant. Ask about services, pricing, or getting started.',
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(15)
  const scrollRef = useRef(null)

  useEffect(() => {
    setLeft(messagesLeft())
  }, [messages])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open, busy])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || busy) return
    const next = [...messages, { role: 'user', content: q.slice(0, MAX_INPUT) }]
    setMessages(next)
    setInput('')
    setBusy(true)
    const { reply } = await ask(next)
    setMessages((m) => [...m, { role: 'assistant', content: reply }])
    setBusy(false)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink-900/80 text-sand-100 backdrop-blur transition hover:border-white/60"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-white/15 bg-ink-900/95 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-white text-[10px] font-black text-ink-900">M</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-sand-100">MTV Assistant</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-500">Ask about our work</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-white text-ink-900'
                      : 'border border-white/10 bg-ink-800 text-sand-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-sand-500">…</div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-sm border border-white/15 px-2.5 py-1 text-xs text-sand-300 transition hover:border-white/50 hover:text-sand-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                onKeyDown={onKey}
                placeholder="Ask a question…"
                className="field max-h-24 flex-1 resize-none"
              />
              <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-primary px-4 py-2 disabled:opacity-40">
                Send
              </button>
            </div>
            <p className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wide text-sand-500">
              <span>{input.length}/{MAX_INPUT}</span>
              <span>{left} left today</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
