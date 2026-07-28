import { Routes, Route, Navigate } from 'react-router-dom'
import CircuitBackground from './components/CircuitBackground.jsx'
import PublicLayout from './components/PublicLayout.jsx'
import Home from './pages/Home.jsx'
import Start from './pages/Start.jsx'
import Pricing from './pages/Pricing.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import ClientPortal from './pages/ClientPortal.jsx'
import PayDeposit from './pages/PayDeposit.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Pipeline from './pages/admin/Pipeline.jsx'
import FollowUp from './pages/admin/FollowUp.jsx'
import LeadsAdmin from './pages/admin/LeadsAdmin.jsx'
import PricingAdmin from './pages/admin/PricingAdmin.jsx'
import ContentAdmin from './pages/admin/ContentAdmin.jsx'
import RequestsAdmin from './pages/admin/RequestsAdmin.jsx'
import RatesAdmin from './pages/admin/RatesAdmin.jsx'
import ProjectsAdmin from './pages/admin/ProjectsAdmin.jsx'
import ProjectDetail from './pages/admin/ProjectDetail.jsx'

export default function App() {
  return (
    <>
    <CircuitBackground />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/start" element={<Start />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<Login />} />
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
    </>
  )
}
