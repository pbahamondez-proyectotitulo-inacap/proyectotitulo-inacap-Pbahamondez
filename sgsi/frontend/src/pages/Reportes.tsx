import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Resumen } from '../types'

const REPORTES = [
  { path: '/reportes/controles.csv', file: 'controles_sgsi.csv', label: 'Controles ISO 27001', desc: 'Catálogo de controles con dominio, estado y evidencias' },
  { path: '/reportes/incidentes.csv', file: 'incidentes_sgsi.csv', label: 'Incidentes de ciberseguridad', desc: 'Registro de incidentes con severidad y estado de plazo' },
  { path: '/reportes/terceros.csv', file: 'terceros_sgsi.csv', label: 'Terceros / Proveedores', desc: 'Cumplimiento de cláusulas de seguridad por contrato' },
  { path: '/reportes/personas.csv', file: 'personas_sgsi.csv', label: 'Controles de Personas', desc: 'Ciclo de vida del personal (capacitación, antecedentes, etc.)' },
]

export default function Reportes() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    api
      .get<Resumen>('/reportes/resumen')
      .then(setResumen)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar resumen'))
  }, [])

  async function handleDownload(r: (typeof REPORTES)[number]) {
    setDownloading(r.path)
    try {
      await api.download(r.path, r.file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al descargar')
    } finally {
      setDownloading('')
    }
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="cards-grid">
        <div className="card stat-card">
          <div className="stat-label">Madurez global</div>
          <div className="stat-value">{resumen?.madurez_global_pct ?? '—'}%</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Controles</div>
          <div className="stat-value">{resumen?.total_controles ?? '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Incidentes vencidos</div>
          <div className="stat-value">{resumen?.incidentes_vencidos ?? '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Terceros con brechas</div>
          <div className="stat-value">{resumen?.terceros_con_brechas ?? '—'}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Exportación para cumplimiento normativo</h3>
        <p className="text-muted">
          Descargue informes en formato CSV (compatible con Excel) para sustentar el indicador de
          gestión institucional y auditorías internas/externas.
        </p>
        <div className="report-list">
          {REPORTES.map((r) => (
            <div className="report-item" key={r.path}>
              <div>
                <div className="report-title">{r.label}</div>
                <div className="cell-sub">{r.desc}</div>
              </div>
              <button className="btn btn-primary" onClick={() => handleDownload(r)} disabled={downloading === r.path}>
                {downloading === r.path ? 'Descargando…' : 'Descargar CSV'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
