// The guided assistant for the request flow. Step-aware and deterministic — no
// external API. Every message follows docs/TONE.md: clear, direct, no filler.
// Returns { title, body, points } so the panel renders consistently.

import { money, depositOf, DEPOSIT_PCT } from './quote.js'

export const STEPS = ['describe', 'review', 'details', 'done']

export const STEP_LABELS = {
  describe: 'Describe your project',
  review: 'Review & agree',
  details: 'Your details',
  done: 'Submitted',
}

// ctx: { items, totals, form, quoteRef, currency, summary }
export function assistantMessage(step, ctx = {}) {
  const totals = ctx.totals || { subtotal: 0, discount: 0, total: 0 }
  const cur = ctx.currency || 'ZMW'

  switch (step) {
    case 'describe':
      return {
        title: 'Tell us what you need — in your own words',
        body:
          'Describe the project plainly: what you want built, who it is for, and any ' +
          'deadline. The assistant reads it and turns it into a clear summary and a ' +
          'matching quote. You review everything before anything is sent.',
        points: [
          'No need to know our service names — just describe the goal.',
          'The more specific you are, the better the match.',
        ],
      }

    case 'review':
      return {
        title: 'Check the summary and the numbers',
        body:
          'This is what we understood and the services it maps to. Prices come from ' +
          'our rate card — nothing is invented. Adjust the selection if something is ' +
          'missing, then agree to continue.',
        points: [
          totals.total ? `Total: ${money(totals.total, cur)}.` : 'Totals show once prices are set.',
          totals.total ? `To start, a ${DEPOSIT_PCT}% deposit of ${money(depositOf(totals.total), cur)}. The balance is settled later.` : null,
          'A "from" service is confirmed in writing before work starts.',
        ].filter(Boolean),
      }

    case 'details':
      return {
        title: 'How should we reach you?',
        body:
          'We use your name and email to send your quote and the payment form. The ' +
          'phone number helps for mobile money and quick questions.',
        points: [
          'Email is required — your quote and payment form go there.',
          'Tell us if you are a local or foreign client so we send the right payment option.',
        ],
      }

    case 'done':
      return {
        title: 'Request received',
        body:
          'Your request and quote are with us. We review it, then send you a payment ' +
          'form for the deposit. Once that clears, we start the agreed work.',
        points: [
          ctx.quoteRef ? `Your reference is ${ctx.quoteRef}. Keep it for your records.` : null,
          'We will reach out by email or WhatsApp to confirm and begin.',
        ].filter(Boolean),
      }

    default:
      return { title: '', body: '', points: [] }
  }
}

export function suggestedQuestions(step) {
  switch (step) {
    case 'describe':
      return ['What kinds of things can you build?', 'How is the price worked out?']
    case 'review':
      return ['Why a deposit?', 'Can I change the services?']
    case 'details':
      return ['What happens after I submit?', 'How do I pay?']
    default:
      return []
  }
}

export function answer(question) {
  const a = {
    'What kinds of things can you build?':
      'Websites, data systems, dashboards, trackers, follow-up systems, automation, and IT/AI consulting. Describe your goal and the summary will map it to the right services.',
    'How is the price worked out?':
      'The total is the sum of the matched services from our rate card. The assistant never invents a price — it only selects services; the maths is done from fixed figures.',
    'Why a deposit?':
      `A ${DEPOSIT_PCT}% deposit confirms the work and lets us start. The remaining balance is settled later, arranged directly with us.`,
    'Can I change the services?':
      'Yes. On the review step you can add or remove services before you agree, so the quote matches exactly what you need.',
    'What happens after I submit?':
      'Your request lands with us. We review it and send you a payment form for the deposit — mobile money for local clients, card for foreign clients.',
    'How do I pay?':
      'We send you a secure payment form. Local clients pay by mobile money (Airtel, MTN, Zamtel); foreign clients pay by card. Everything goes through Flutterwave.',
  }
  return a[question] || 'I can help with the current step. Use the buttons above for common questions.'
}
