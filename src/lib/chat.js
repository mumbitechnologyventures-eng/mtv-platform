// Hybrid site-assistant logic. Answers common MTV questions locally with zero
// tokens; only falls back to the serverless Haiku endpoint when nothing matches.
// This is the real cost guardrail — most questions never leave the browser.

export const MAX_INPUT = 400
const DAILY_KEY = 'mtv_chat_day'
const COUNT_KEY = 'mtv_chat_count'
const SOFT_DAILY_LIMIT = 15 // mirrors the server per-visitor cap for UX messaging

// Scripted knowledge. Deliberately price-free: pricing questions are steered to
// the Pricing page / quote flow, which show real numbers. Keep answers short,
// plain, and operational (house tone).
const SCRIPT = [
  {
    // Refuse to perform the paid work for free — deflect to the quote flow.
    // Placed first so action requests are caught before topic keywords.
    keys: [
      'build me', 'make me', 'write me', 'create me', 'design me', 'develop me',
      'code for me', 'write the code', 'give me the code', 'do my', 'do it for me',
      'build my', 'make my', 'for free', 'write my', 'develop my', 'design my',
    ],
    a: 'That is the kind of work MTV does as a paid project, so I can\'t build it for you here. Tell me what you need and start a request on the "Request a quote" flow — you will see exactly what is included and the total.',
  },
  {
    keys: ['what do you do', 'what does mtv', 'services', 'offer', 'what can you', 'help with'],
    a: 'MTV builds practical digital solutions: software, websites, data systems, automation, and IT/AI consulting. The approach is the simplest useful version first, with clean data and follow-up built in.',
  },
  {
    keys: ['price', 'pricing', 'cost', 'how much', 'quote', 'rate', 'charge', 'budget'],
    a: 'Real prices are on the Pricing page, and the "Request a quote" flow gives you an exact total for what you pick — no hidden charges. I do not quote figures here so the numbers you see are always the real ones.',
  },
  {
    keys: ['process', 'how does it work', 'how do you work', 'steps', 'what happens'],
    a: 'You pick the services you need, share a few details, review a transparent quote, and pay to confirm. From there the agreed work starts and progress is tracked and followed up.',
  },
  {
    keys: ['website', 'web design', 'web site', 'landing', 'site'],
    a: 'Web design is a core service — sites built to be clear, fast, and trustworthy. Start a request on the "Request a quote" flow and pick web design to see what is included.',
  },
  {
    keys: ['data', 'dashboard', 'tracker', 'reporting', 'follow up', 'follow-up', 'forms'],
    a: 'MTV builds data collection, dashboards, trackers, follow-up systems, and field forms — turning activity into clean, visible, reportable data. Tell me your goal and I can point you to the right service.',
  },
  {
    keys: ['contact', 'reach', 'email', 'phone', 'talk to', 'call', 'get in touch'],
    a: 'Use the Contact page to reach the team directly. If you want a number for a specific piece of work, the "Request a quote" flow is the fastest path.',
  },
  {
    keys: ['ngo', 'non profit', 'nonprofit', 'charity', 'discount'],
    a: 'Registered NGOs get a discount. Tick the NGO option on the quote step and the total updates automatically.',
  },
  {
    keys: ['pay', 'payment', 'mobile money', 'mtn', 'airtel', 'card', 'flutterwave'],
    a: 'Payments go through Flutterwave, so you can use MTN or Airtel mobile money or a card. MTV never sees or stores your card or mobile-money details.',
  },
  {
    keys: ['where', 'location', 'based', 'zambia', 'lusaka', 'country'],
    a: 'MTV is based in Zambia and works remotely with clients locally and internationally.',
  },
  {
    keys: ['start', 'begin', 'get started', 'how do i start'],
    a: 'The "Request a quote" flow is the place to start: choose services, review the quote, and confirm. I can explain any step if you tell me what you are trying to build.',
  },
  {
    keys: ['who are you', 'are you a bot', 'are you human', 'chatgpt', 'ai'],
    a: 'I am the MTV site assistant. I answer common questions here instantly, and only call on AI for anything unusual — which keeps this fast and low-cost.',
  },
]

// Quick-tap prompts shown in the panel.
export const SUGGESTIONS = [
  'What does MTV do?',
  'How does pricing work?',
  'How do I get started?',
  'What data systems can you build?',
]

function matchScript(text) {
  const t = text.toLowerCase()
  for (const item of SCRIPT) {
    if (item.keys.some((k) => t.includes(k))) return item.a
  }
  return null
}

// --- soft per-day counter (UX only; the server enforces the real cap) ---
function today() {
  return new Date().toISOString().slice(0, 10)
}
export function messagesLeft() {
  try {
    if (localStorage.getItem(DAILY_KEY) !== today()) return SOFT_DAILY_LIMIT
    const used = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0
    return Math.max(0, SOFT_DAILY_LIMIT - used)
  } catch {
    return SOFT_DAILY_LIMIT
  }
}
function bumpLocal() {
  try {
    if (localStorage.getItem(DAILY_KEY) !== today()) {
      localStorage.setItem(DAILY_KEY, today())
      localStorage.setItem(COUNT_KEY, '0')
    }
    const used = (parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0) + 1
    localStorage.setItem(COUNT_KEY, String(used))
  } catch {
    /* storage unavailable — server cap still applies */
  }
}

// Main entry. `history` is the full [{role, content}] list including the newest
// user turn. Returns { reply, source: 'scripted' | 'ai' | 'limited' }.
export async function ask(history) {
  const last = [...history].reverse().find((m) => m.role === 'user')
  const text = (last?.content || '').trim()
  if (!text) return { reply: 'Ask me anything about MTV — services, process, or getting started.', source: 'scripted' }

  // 1) Scripted match — free, instant.
  const scripted = matchScript(text)
  if (scripted) return { reply: scripted, source: 'scripted' }

  // 2) Only novel questions reach the AI. Count them.
  if (messagesLeft() <= 0) {
    return {
      reply: 'You have reached today\'s message limit here. For anything more, please use the Contact page.',
      source: 'limited',
    }
  }
  bumpLocal()

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-6) }),
    })
    const data = await r.json().catch(() => ({}))
    if (r.ok && data.reply) return { reply: data.reply, source: 'ai' }
    if (data.reply) return { reply: data.reply, source: 'limited' }
    // No key configured (503) or other error — graceful scripted fallback.
    return {
      reply:
        'I can answer common questions about MTV\'s services, pricing, process, and how to start. For anything else, the Contact page is the best route.',
      source: 'scripted',
    }
  } catch {
    return {
      reply: 'I could not reach the assistant just now. Please try again, or use the Contact page.',
      source: 'limited',
    }
  }
}
