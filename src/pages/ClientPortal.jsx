import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import { Badge } from '../components/ui.jsx'
import { PROJECT_STAGES } from '../lib/pipeline.js'
import { fmtK } from '../lib/metrics.js'
import ProjectThread from '../components/ProjectThread.jsx'

const STAGE_HINT = {
  agreement: 'Agreement being prepared',
  welcome: 'Onboarding',
  brief: 'Scoping the work with you',
  invoice: 'Invoice / deposit stage',
  in_progress: 'Being built',
  delivery: 'Delivery in progress',
  report: 'Wrap-up report',
  complete: 'Completed',
}

export default function ClientPortal() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [docsByProject, setDocsByProject] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // RLS returns only projects whose client_email matches this user's email.
      const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      const list = projs || []
      setProjects(list)
      if (list.length) {
        const { data: docs } = await supabase
          .from('project_docs')
          .select('*')
          .in('project_id', list.map((p) => p.id))
          .order('created_at', { ascending: false })
        const map = {}
        ;(docs || []).forEach((d) => { (map[d.project_id] ||= []).push(d) })
        setDocsByProject(map)
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function logout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-600 bg-ink-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/"><Logo small /></Link>
          <div className="flex items-center gap-4">
            {isAdmin && <Link to="/admin" className="text-sm text-sand-400 hover:text-clay">Admin</Link>}
            <button onClick={logout} className="text-sm font-medium text-clay hover:underline">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-bold">Your projects</h1>
        <p className="mt-1 text-sm text-sand-400">
          Signed in as {profile?.name || user?.email}. Track status and documents for your work with MTV.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-sand-400">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-ink-600 px-6 py-12 text-center">
            <p className="text-sand-200">No projects linked to your account yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-sand-500">
              Once a project is started under your email ({user?.email}), it will appear here with its
              status and documents. If you expected to see something, contact us.
            </p>
            <Link to="/contact" className="btn-ghost mt-6">Start an enquiry</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {projects.map((p) => {
              const step = PROJECT_STAGES.indexOf(p.status) + 1
              const docs = docsByProject[p.id] || []
              return (
                <div key={p.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-sand-100">{p.service_name || 'Project'}</h2>
                      <p className="text-xs text-sand-500">Ref <span className="font-mono">{p.ref}</span></p>
                    </div>
                    <Badge status={p.status} />
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                      <div className="h-full bg-clay transition-all" style={{ width: `${(step / PROJECT_STAGES.length) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-sand-400">
                      Step {step} of {PROJECT_STAGES.length} · {STAGE_HINT[p.status] || p.status}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    {p.price_zmw > 0 && <Meta label="Price" value={`${p.currency || 'ZMW'} ${Number(p.price_zmw).toLocaleString()}`} />}
                    {p.timeline && <Meta label="Timeline" value={p.timeline} />}
                    {p.due_date && <Meta label="Target date" value={new Date(p.due_date).toLocaleDateString()} />}
                  </div>
                  {p.objective && (
                    <div className="mt-3">
                      <p className="label">Objective</p>
                      <p className="text-sm text-sand-300">{p.objective}</p>
                    </div>
                  )}

                  {/* Documents */}
                  <div className="mt-4 border-t border-ink-600 pt-4">
                    <p className="label">Documents</p>
                    {docs.length === 0 ? (
                      <p className="text-sm text-sand-500">No documents shared yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {docs.map((d) => (
                          <li key={d.id} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-sand-200">{d.type}</span>
                            <Badge status={d.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <ProjectThread
                    project={p}
                    role="client"
                    userId={user?.id}
                    userName={profile?.name || user?.email}
                  />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-sand-200">{value}</p>
    </div>
  )
}
