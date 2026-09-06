import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import {
  ESTADOS_CONTROL,
  ESTADO_COLORS,
  ESTADO_LABELS,
  TIPOS_PERSONA,
  TIPO_PERSONA_LABELS,
} from '../constants'
import { fmtDate, fromLocalInput, toLocalInput } from '../helpers'
import type { EstadoControl, PersonaControl, TipoPersonaControl } from '../types'

interface PersonaForm {
  tipo: TipoPersonaControl
  titulo: string
  descripcion: string
  estado: EstadoControl
  fecha: string
  responsable: string
  notas: string
}

function emptyForm(): PersonaForm {
  return {
    tipo: 'capacitacion',
    titulo: '',
    descripcion: '',
    estado: 'no_iniciado',
    fecha: '',
    responsable: '',
    notas: '',
  }
}

export default function Personas() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'encargado'

  const [personas, setPersonas] = useState<PersonaControl[]>([])
  const [fTipo, setFTipo] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PersonaControl | null>(null)
  const [form, setForm] = useState<PersonaForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fTipo) params.set('tipo', fTipo)
      if (fEstado) params.set('estado', fEstado)
      const qs = params.toString()
      setPersonas(await api.get<PersonaControl[]>(`/personas${qs ? `?${qs}` : ''}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar controles de personas')
    } finally {
      setLoading(false)
    }
  }, [fTipo, fEstado])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(p: PersonaControl) {
    setEditing(p)
    setForm({
      tipo: p.tipo,
      titulo: p.titulo,
      descripcion: p.descripcion,
      estado: p.estado,
      fecha: toLocalInput(p.fecha),
      responsable: p.responsable,
      notas: p.notas,
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
      const payload = { ...form, fecha: fromLocalInput(form.fecha) }
      if (editing) await api.put(`/personas/${editing.id}`, payload)
      else await api.post('/personas', payload)
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: PersonaControl) {
    if (!window.confirm(`¿Eliminar el control "${p.titulo}"?`)) return
    try {
      await api.del(`/personas/${p.id}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <select className="input" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {TIPOS_PERSONA.map((t) => (
              <option key={t} value={t}>
                {TIPO_PERSONA_LABELS[t]}
              </option>
            ))}
          </select>
          <select className="input" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_CONTROL.map((s) => (
              <option key={s} value={s}>
                {ESTADO_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openNew}>
            + Nuevo control de personas
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Título</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Responsable</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="empty-row">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              personas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Badge color="purple">{TIPO_PERSONA_LABELS[p.tipo]}</Badge>
                  </td>
                  <td>
                    <div className="cell-title">{p.titulo}</div>
                    <div className="cell-sub">{p.descripcion}</div>
                  </td>
                  <td>
                    <Badge color={ESTADO_COLORS[p.estado]}>{ESTADO_LABELS[p.estado]}</Badge>
                  </td>
                  <td>{fmtDate(p.fecha)}</td>
                  <td>{p.responsable || '—'}</td>
                  <td>
                    <div className="row-actions">
                      {canWrite && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && personas.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No hay controles de personas registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? 'Editar control de personas' : 'Nuevo control de personas'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label">Tipo</label>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoPersonaControl })}>
              {TIPOS_PERSONA.map((t) => (
                <option key={t} value={t}>
                  {TIPO_PERSONA_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Estado</label>
            <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoControl })}>
              {ESTADOS_CONTROL.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field field-full">
            <label className="field-label">Título *</label>
            <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Fecha</label>
            <input type="datetime-local" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Responsable</label>
            <input className="input" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
          </div>
          <div className="field field-full">
            <label className="field-label">Descripción</label>
            <textarea className="input" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
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
