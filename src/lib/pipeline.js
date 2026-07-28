// Shared vocabulary for the client-project pipeline. These mirror the CHECK
// constraints on public.projects.status and public.project_docs.type/status.

export const PROJECT_STAGES = [
  'agreement', 'welcome', 'brief', 'invoice', 'in_progress', 'delivery', 'report', 'complete',
]

export const DOC_TYPES = [
  'agreement', 'welcome', 'brief', 'invoice', 'delivery', 'report', 'thankyou', 'feedback',
]

export const DOC_STATUSES = ['draft', 'sent', 'signed', 'paid', 'done']

export function nextStage(stage) {
  const i = PROJECT_STAGES.indexOf(stage)
  return i >= 0 && i < PROJECT_STAGES.length - 1 ? PROJECT_STAGES[i + 1] : stage
}

// Generates a short human ref like MTV-2607-AB12.
export function makeRef() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MTV-${mm}${dd}-${rand}`
}
