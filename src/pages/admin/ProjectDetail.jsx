import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { Badge, Empty } from '../../components/ui.jsx'
import { PROJECT_STAGES, DOC_TYPES, DOC_STATUSES, nextStage } from '../../lib/pipeline.js'
import { useAuth } from '../../context/AuthContext.jsx'
import ProjectThread from '../../components/ProjectThread.jsx'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDocType, setNewDocType] = useState('agreement')
  const { user, profile } = useAuth()

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: d }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_docs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])
    setProject(p); setDocs(d || []); setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function setStage(status) {
    await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setProject((p) => ({ ...p, status }))
  }

  async function addDoc() {
    const { data, error } = await supabase.from('project_docs')
      .insert({ project_id: id, type: newDocType, status: 'draft', data: {} })
      .select().single()
    if (!error && data) setDocs((ds) => [data, ...ds])
  }

  async function setDocStatus(docId, status) {
    const patch = { status }
    if (status === 'sent') patch.sent_at = new Date().toISOString()
    await supabase.from('project_docs').update(patch).eq('id', docId)
    setDocs((ds) => ds.map((x) => (x.id === docId ? { ...x, ...patch } : x)))
  }

  async function removeDoc(docId) {
    await supabase.from('project_docs').delete().eq('id', docId)
    setDocs((ds) => ds.filter((x) => x.id !== docId))
  }

  async function removeProject() {
    if (!confirm('Delete this project and its documents?')) return
    await supabase.from('project_docs').delete().eq('project_id', id)
    await supabase.from('projects').delete().eq('id', id)
    navigate('/admin/projects')
  }

  if (loading) return <p className="text-sm text-sand-400">Loading…</p>
  if (!project) return <Empty>Project not found. <Link to="/admin/projects" className="text-clay">Back to projects</Link></Empty>

  const stepIndex = PROJECT_STAGES.indexOf(project.status)

  return (
    <div>
      <Link to="/admin/projects" className="text-sm text-sand-400 hover:text-clay">← All projects</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{project.client_name}</h1>
          <p className="text-sm text-sand-400">
            {project.client_company || project.client_email} · <span className="font-mono">{project.ref}</span>
          </p>
        </div>
        <Badge status={project.status} />
      </div>

      {/* Stage stepper */}
      <div className="card mt-6">
        <p className="label">Pipeline stage</p>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition ${
                i === stepIndex ? 'bg-clay text-ink-900'
                : i < stepIndex ? 'bg-clay/15 text-clay'
                : 'bg-ink-700 text-sand-400 hover:bg-ink-600'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        {project.status !== 'complete' && (
          <button onClick={() => setStage(nextStage(project.status))} className="btn-ghost mt-4 py-1.5 text-xs">
            Advance to “{nextStage(project.status).replace(/_/g, ' ')}” →
          </button>
        )}
      </div>

      {/* Details */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Service" value={project.service_name} />
        <Detail label="Price" value={project.price_zmw ? `${project.currency || 'ZMW'} ${Number(project.price_zmw).toLocaleString()}` : '—'} />
        <Detail label="Deposit" value={project.deposit_pct != null ? `${project.deposit_pct}%` : '—'} />
        <Detail label="Timeline" value={project.timeline} />
      </div>
      {project.objective && (
        <div className="card mt-4">
          <p className="label">Objective</p>
          <p className="text-sm text-sand-200">{project.objective}</p>
        </div>
      )}

      {/* Documents */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="flex gap-2">
          <select value={newDocType} onChange={(e) => setNewDocType(e.target.value)} className="field w-auto py-1.5 text-sm">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={addDoc} className="btn-primary py-1.5 text-sm">+ Add</button>
        </div>
      </div>

      <div className="mt-4">
        {docs.length === 0 ? (
          <Empty>No documents yet. Add an agreement, invoice, delivery note or report as you move through the pipeline.</Empty>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium capitalize text-sand-100">{doc.type}</p>
                  <p className="text-xs text-sand-500">
                    Created {new Date(doc.created_at).toLocaleDateString()}
                    {doc.sent_at ? ` · sent ${new Date(doc.sent_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={doc.status} onChange={(e) => setDocStatus(doc.id, e.target.value)} className="field w-auto py-1.5 text-sm">
                    {DOC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => removeDoc(doc.id)} className="text-sm text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages + review */}
      <div className="card mt-8">
        <ProjectThread project={project} role="admin" userId={user?.id} userName={profile?.name || 'Builder'} />
      </div>

      <div className="mt-10 border-t border-ink-600 pt-6">
        <button onClick={removeProject} className="text-sm text-red-400 hover:underline">Delete this project</button>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className="text-sm text-sand-200">{value || '—'}</p>
    </div>
  )
}
