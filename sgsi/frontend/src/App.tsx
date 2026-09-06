import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Controles from './pages/Controles'
import Incidentes from './pages/Incidentes'
import Terceros from './pages/Terceros'
import Personas from './pages/Personas'
import Reportes from './pages/Reportes'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Cargando…</div>
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/controles" element={<Controles />} />
        <Route path="/incidentes" element={<Incidentes />} />
        <Route path="/terceros" element={<Terceros />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
