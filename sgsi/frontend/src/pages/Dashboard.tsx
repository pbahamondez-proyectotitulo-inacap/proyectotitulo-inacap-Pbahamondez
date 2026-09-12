import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import Badge from '../components/Badge'
import {
  DOMINIO_LABELS,
  ESTADO_INCIDENTE_COLORS,
  ESTADO_INCIDENTE_LABELS,
  ESTADO_LABELS,
  SEVERIDAD_COLORS,
  SEVERIDAD_LABELS,
} from '../constants'
import { fmtDate } from '../helpers'
import type { Incidente, Madurez, Resumen } from '../types'

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b']
const ESTADO_BAR_COLORS: Record<string, string> = {
  no_iniciado: '#94a3b8',
  iniciado: '#f59e0b',
  implementado: '#3b82f6',
  gestionado: '#10b981',
}

export default function Dashboard() {
  const [madurez, setMadurez] = useState<Madurez | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<Madurez>('/madurez'),
      api.get<Resumen>('/reportes/resumen'),
      api.get<Incidente[]>('/incidentes'),
    ])
      .then(([m, r, i]) => {
        setMadurez(m)
        setResumen(r)
        setIncidentes(i)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar datos'))
  }, [])

  if (error) return <div className="alert alert-error">{error}</div>

  const pieData = madurez
    ? madurez.dominios.map((d) => ({ name: DOMINIO_LABELS[d.dominio], value: d.total }))
    : []
  const estadoBar = resumen
    ? Object.entries(resumen.por_estado).map(([k, v]) => ({ name: ESTADO_LABELS[k], value: v }))
    : []
  const madurezBar = madurez
    ? madurez.dominios.map((d) => ({ name: DOMINIO_LABELS[d.dominio], pct: d.pct }))
    : []
  const recientes = [...incidentes]
    .sort((a, b) => (a.fecha_deteccion < b.fecha_deteccion ? 1 : -1))
    .slice(0, 5)

  return (
    <div>
      <div className="cards-grid">
        <div className="card stat-card">
          <div className="stat-label">Madurez global del SGSI</div>
          <div className="stat-value">{madurez ? madurez.global_pct : '—'}%</div>
          <div className="stat-foot">{madurez?.total_controles ?? 0} controles evaluados</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Controles ISO 27001</div>
          <div className="stat-value">{resumen?.total_controles ?? '—'}</div>
          <div className="stat-foot">Catálogo Anexo A</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Incidentes abiertos</div>
          <div className="stat-value">{resumen?.incidentes_abiertos ?? '—'}</div>
          <div className="stat-foot">de {resumen?.total_incidentes ?? 0} registrados</div>
        </div>
        <div className="card stat-card stat-warn">
          <div className="stat-label">Incidentes vencidos</div>
          <div className="stat-value">{resumen?.incidentes_vencidos ?? '—'}</div>
          <div className="stat-foot">Fuera de plazo legal</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Terceros con brechas</div>
          <div className="stat-value">{resumen?.terceros_con_brechas ?? '—'}</div>
          <div className="stat-foot">de {resumen?.total_terceros ?? 0} proveedores</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 className="card-title">Madurez por dominio (%)</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={madurezBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Madurez']} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Controles por estado</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={estadoBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {estadoBar.map((entry) => (
                    <Cell key={entry.name} fill={ESTADO_BAR_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Distribución de controles por dominio</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">Incidentes recientes</h3>
          <Link to="/incidentes" className="btn btn-ghost btn-sm">
            Ver todos
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Severidad</th>
              <th>Estado</th>
              <th>Detección</th>
              <th>Plazo</th>
            </tr>
          </thead>
          <tbody>
            {recientes.map((i) => (
              <tr key={i.id}>
                <td>{i.titulo}</td>
                <td>
                  <Badge color={SEVERIDAD_COLORS[i.severidad]}>{SEVERIDAD_LABELS[i.severidad]}</Badge>
                </td>
                <td>
                  <Badge color={ESTADO_INCIDENTE_COLORS[i.estado] || 'gray'}>
                    {ESTADO_INCIDENTE_LABELS[i.estado]}
                  </Badge>
                </td>
                <td>{fmtDate(i.fecha_deteccion)}</td>
                <td>
                  {i.vencido ? (
                    <Badge color="red">Vencido</Badge>
                  ) : (
                    <span className="text-muted">{fmtDate(i.plazo_reporte)}</span>
                  )}
                </td>
              </tr>
            ))}
            {recientes.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  Sin incidentes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
