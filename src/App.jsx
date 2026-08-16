import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import CircuitBackground from './components/CircuitBackground.jsx'
import PublicLayout from './components/PublicLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Each screen is loaded on demand so the initial bundle stays small and every
// route ships as its own chunk. The heavy admin dashboard (charts) never loads
// for a public visitor.
const Home = lazy(() => import('./pages/Home.jsx'))
const Start = lazy(() => import('./pages/Start.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const ClientPortal = lazy(() => import('./pages/ClientPortal.jsx'))
const PayDeposit = lazy(() => import('./pages/PayDeposit.jsx'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const Pipeline = lazy(() => import('./pages/admin/Pipeline.jsx'))
const FollowUp = lazy(() => import('./pages/admin/FollowUp.jsx'))
const LeadsAdmin = lazy(() => import('./pages/admin/LeadsAdmin.jsx'))
const PricingAdmin = lazy(() => import('./pages/admin/PricingAdmin.jsx'))
const ContentAdmin = lazy(() => import('./pages/admin/ContentAdmin.jsx'))
const RequestsAdmin = lazy(() => import('./pages/admin/RequestsAdmin.jsx'))
const RatesAdmin = lazy(() => import('./pages/admin/RatesAdmin.jsx'))
const ProjectsAdmin = lazy(() => import('./pages/admin/ProjectsAdmin.jsx'))
const ProjectDetail = lazy(() => import('./pages/admin/ProjectDetail.jsx'))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-sand-400">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <>
      <CircuitBackground />
      <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/start" element={<Start />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pay/:ref" element={<PayDeposit />} />

          <Route
            path="/portal"
            element={
              <RequireAuth>
                <ClientPortal />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="requests" element={<RequestsAdmin />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="followup" element={<FollowUp />} />
            <Route path="leads" element={<LeadsAdmin />} />
            <Route path="pricing" element={<PricingAdmin />} />
            <Route path="content" element={<ContentAdmin />} />
            <Route path="rates" element={<RatesAdmin />} />
            <Route path="projects" element={<ProjectsAdmin />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  )
}
