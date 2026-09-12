import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { ROL_LABELS } from '../constants'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/controles', label: 'Controles ISO 27001', icon: '☑' },
  { to: '/incidentes', label: 'Incidentes', icon: '⚠' },
  { to: '/terceros', label: 'Terceros / Proveedores', icon: '◈' },
  { to: '/personas', label: 'Controles de Personas', icon: '👤' },
  { to: '/reportes', label: 'Reportería', icon: '⇩' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">🛡</div>
          <div>
            <div className="brand-title">SGSI</div>
            <div className="brand-sub">Hospital Félix Bulnes Cerda</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="page-title">Sistema de Gestión de Seguridad de la Información</h1>
          <div className="user-menu">
            <div className="user-info">
              <div className="user-name">{user?.nombre_completo}</div>
              <div className="user-role">{user ? ROL_LABELS[user.rol] : ''}</div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
