import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import {
  ALCANCE_OPCIONES,
  CATEGORIAS_INCIDENTE,
  ESTADOS_INCIDENTE,
  ESTADO_INCIDENTE_COLORS,
  ESTADO_INCIDENTE_LABELS,
  SEVERIDADES,
  SEVERIDAD_COLORS,
  SEVERIDAD_LABELS,
} from '../constants'
import { fmtDate, fromLocalInput, toLocalInput } from '../helpers'
import type { EstadoIncidente, Incidente, Severidad } from '../types'

interface IncidenteForm {
  titulo: string
  descripcion: string
  categoria: string
  severidad: Severidad
  alcance: string
  sistema_afectado: string
  fecha_deteccion: string
  estado: EstadoIncidente
  reportado_anci: boolean
  notas: string
}

function emptyForm(): IncidenteForm {
  return {
    titulo: '',
    descripcion: '',
    categoria: '',
    severidad: 'media',
    alcance: 'interno',
    sistema_afectado: '',
    fecha_deteccion: toLocalInput(new Date().toISOString()),
    estado: 'registrado',
    reportado_anci: false,
    notas: '',
  }
}

export default function Incidentes() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'encargado'

  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [search, setSearch] = useState('')
  const [fSeveridad, setFSeveridad] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Incidente | null>(null)
  const [form, setForm] = useState<IncidenteForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (fSeveridad) params.set('severidad', fSeveridad)
      if (fEstado) params.set('estado', fEstado)
      const qs = params.toString()
      setIncidentes(await api.get<Incidente[]>(`/incidentes${qs ? `?${qs}` : ''}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar incidentes')
    } finally {
      setLoading(false)
    }
  }, [search, fSeveridad, fEstado])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(i: Incidente) {
    setEditing(i)
    setForm({
      titulo: i.titulo,
      descripcion: i.descripcion,
      categoria: i.categoria,
      severidad: i.severidad,
      alcance: i.alcance,
      sistema_afectado: i.sistema_afectado,
      fecha_deteccion: toLocalInput(i.fecha_deteccion),
      estado: i.estado,
      reportado_anci: i.reportado_anci,
      notas: i.notas,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.titulo.trim()) {
      setError('El título es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, fecha_deteccion: fromLocalInput(form.fecha_deteccion) }
      if (editing) await api.put(`/incidentes/${editing.id}`, payload)
      else await api.post('/incidentes', payload)
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(i: Incidente) {
    if (!window.confirm(`¿Eliminar el incidente "${i.titulo}"?`)) return
    try {
      await api.del(`/incidentes/${i.id}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function markReported(i: Incidente) {
    try {
      await api.put(`/incidentes/${i.id}`, {
        reportado_anci: true,
        estado: 'reportado',
        fecha_reporte: new Date().toISOString().slice(0, 19),
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <input
            className="input"
            placeholder="Buscar incidente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={fSeveridad} onChange={(e) => setFSeveridad(e.target.value)}>
            <option value="">Todas las severidades</option>
            {SEVERIDADES.map((s) => (
              <option key={s} value={s}>
                {SEVERIDAD_LABELS[s]}
              </option>
            ))}
          </select>
          <select className="input" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_INCIDENTE.map((s) => (
              <option key={s} value={s}>
                {ESTADO_INCIDENTE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openNew}>
            + Nuevo incidente
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Severidad</th>
              <th>Categoría</th>
              <th>Sistema afectado</th>
              <th>Detección</th>
              <th>Estado</th>
              <th>Plazo de reporte</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="empty-row">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              incidentes.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="cell-title">{i.titulo}</div>
                    <div className="cell-sub">{i.descripcion}</div>
                  </td>
                  <td>
                    <Badge color={SEVERIDAD_COLORS[i.severidad]}>{SEVERIDAD_LABELS[i.severidad]}</Badge>
                  </td>
                  <td className="text-muted">{i.categoria || '—'}</td>
                  <td>{i.sistema_afectado || '—'}</td>
                  <td>{fmtDate(i.fecha_deteccion)}</td>
                  <td>
                    <Badge color={ESTADO_INCIDENTE_COLORS[i.estado] || 'gray'}>
                      {ESTADO_INCIDENTE_LABELS[i.estado]}
                    </Badge>
                  </td>
                  <td>
                    <div>
                      {i.vencido ? <Badge color="red">Vencido</Badge> : <span className="text-muted">{fmtDate(i.plazo_reporte)}</span>}
                    </div>
                    <div className="cell-sub">Alerta temprana: {fmtDate(i.alerta_temprana)}</div>
                  </td>
                  <td>
                    <div className="row-actions">
                      {canWrite && i.estado !== 'reportado' && i.estado !== 'cerrado' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => markReported(i)}>
                          Marcar reportado
                        </button>
                      )}
                      {canWrite && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(i)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && incidentes.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No hay incidentes que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? 'Editar incidente' : 'Nuevo incidente de ciberseguridad'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="form-grid">
          <div className="field field-full">
            <label className="field-label">Título *</label>
            <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Severidad</label>
            <select className="input" value={form.severidad} onChange={(e) => setForm({ ...form, severidad: e.target.value as Severidad })}>
              {SEVERIDADES.map((s) => (
                <option key={s} value={s}>
                  {SEVERIDAD_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Categoría (taxonomía ANCI)</label>
            <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              <option value="">— Seleccionar —</option>
              {CATEGORIAS_INCIDENTE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Alcance</label>
            <select className="input" value={form.alcance} onChange={(e) => setForm({ ...form, alcance: e.target.value })}>
              {ALCANCE_OPCIONES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Sistema afectado</label>
            <input className="input" value={form.sistema_afectado} onChange={(e) => setForm({ ...form, sistema_afectado: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Fecha de detección</label>
            <input
              type="datetime-local"
              className="input"
              value={form.fecha_deteccion}
              onChange={(e) => setForm({ ...form, fecha_deteccion: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label">Estado</label>
            <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoIncidente })}>
              {ESTADOS_INCIDENTE.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_INCIDENTE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field field-full checkbox-field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.reportado_anci}
                onChange={(e) => setForm({ ...form, reportado_anci: e.target.checked })}
              />
              Reportado a la ANCI
            </label>
          </div>
          <div className="field field-full">
            <label className="field-label">Descripción</label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="field field-full">
            <label className="field-label">Notas</label>
            <textarea className="input" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
