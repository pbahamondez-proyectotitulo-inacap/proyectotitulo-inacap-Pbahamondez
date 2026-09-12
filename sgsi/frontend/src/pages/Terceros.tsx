import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import {
  CLAUSULAS_DEFAULT,
  CUMPLIMIENTOS,
  CUMPLIMIENTO_COLORS,
  CUMPLIMIENTO_LABELS,
  TIPOS_TERCERO,
} from '../constants'
import { fmtDateOnly, fromLocalInput, toLocalInput } from '../helpers'
import type { Clausula, EstadoCumplimiento, Tercero } from '../types'

interface TerceroForm {
  nombre: string
  rut: string
  tipo: string
  contrato_ref: string
  fecha_inicio: string
  fecha_termino: string
  contacto: string
  estado_cumplimiento: EstadoCumplimiento
  clausulas: Clausula[]
  notas: string
}

function emptyForm(): TerceroForm {
  return {
    nombre: '',
    rut: '',
    tipo: 'proveedor_sistema',
    contrato_ref: '',
    fecha_inicio: '',
    fecha_termino: '',
    contacto: '',
    estado_cumplimiento: 'pendiente',
    clausulas: CLAUSULAS_DEFAULT.map((nombre) => ({ nombre, cumplida: false })),
    notas: '',
  }
}

export default function Terceros() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'encargado' || user?.rol === 'admin_contratos'

  const [terceros, setTerceros] = useState<Tercero[]>([])
  const [search, setSearch] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tercero | null>(null)
  const [form, setForm] = useState<TerceroForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (fEstado) params.set('estado', fEstado)
      const qs = params.toString()
      setTerceros(await api.get<Tercero[]>(`/terceros${qs ? `?${qs}` : ''}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }, [search, fEstado])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(t: Tercero) {
    setEditing(t)
    const existing = new Map(t.clausulas.map((c) => [c.nombre, c.cumplida]))
    setForm({
      nombre: t.nombre,
      rut: t.rut,
      tipo: t.tipo,
      contrato_ref: t.contrato_ref,
      fecha_inicio: toLocalInput(t.fecha_inicio),
      fecha_termino: toLocalInput(t.fecha_termino),
      contacto: t.contacto,
      estado_cumplimiento: t.estado_cumplimiento,
      clausulas: CLAUSULAS_DEFAULT.map((nombre) => ({
        nombre,
        cumplida: existing.get(nombre) ?? false,
      })),
      notas: t.notas,
    })
    setModalOpen(true)
  }

  function toggleClausula(index: number) {
    setForm((prev) => {
      const clausulas = prev.clausulas.map((c, i) => (i === index ? { ...c, cumplida: !c.cumplida } : c))
      return { ...prev, clausulas }
    })
  }

  async function save() {
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        fecha_inicio: fromLocalInput(form.fecha_inicio),
        fecha_termino: fromLocalInput(form.fecha_termino),
      }
      if (editing) await api.put(`/terceros/${editing.id}`, payload)
      else await api.post('/terceros', payload)
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(t: Tercero) {
    if (!window.confirm(`¿Eliminar el proveedor "${t.nombre}"?`)) return
    try {
      await api.del(`/terceros/${t.id}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const cumplidas = (t: Tercero) => (t.clausulas || []).filter((c) => c.cumplida).length

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <input
            className="input"
            placeholder="Buscar proveedor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
            <option value="">Todos los niveles de cumplimiento</option>
            {CUMPLIMIENTOS.map((s) => (
              <option key={s} value={s}>
                {CUMPLIMIENTO_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openNew}>
            + Nuevo proveedor
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Tipo</th>
              <th>Contrato</th>
              <th>Cumplimiento</th>
              <th>Cláusulas</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="empty-row">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              terceros.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="cell-title">{t.nombre}</div>
                    <div className="cell-sub">{t.contacto || '—'}</div>
                  </td>
                  <td className="mono">{t.rut || '—'}</td>
                  <td className="text-muted">{t.tipo}</td>
                  <td>
                    <div>{t.contrato_ref || '—'}</div>
                    <div className="cell-sub">
                      {fmtDateOnly(t.fecha_inicio)} → {fmtDateOnly(t.fecha_termino)}
                    </div>
                  </td>
                  <td>
                    <Badge color={CUMPLIMIENTO_COLORS[t.estado_cumplimiento]}>
                      {CUMPLIMIENTO_LABELS[t.estado_cumplimiento]}
                    </Badge>
                  </td>
                  <td>
                    {cumplidas(t)} / {(t.clausulas || []).length}
                  </td>
                  <td>
                    <div className="row-actions">
                      {canWrite && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && terceros.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-row">
                  No hay proveedores que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor / tercero'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wide
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label">Nombre *</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">RUT</label>
            <input className="input" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Tipo</label>
            <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_TERCERO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Referencia de contrato</label>
            <input className="input" value={form.contrato_ref} onChange={(e) => setForm({ ...form, contrato_ref: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Contacto</label>
            <input className="input" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Estado de cumplimiento</label>
            <select
              className="input"
              value={form.estado_cumplimiento}
              onChange={(e) => setForm({ ...form, estado_cumplimiento: e.target.value as EstadoCumplimiento })}
            >
              {CUMPLIMIENTOS.map((s) => (
                <option key={s} value={s}>
                  {CUMPLIMIENTO_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Fecha inicio</label>
            <input type="datetime-local" className="input" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Fecha término</label>
            <input type="datetime-local" className="input" value={form.fecha_termino} onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })} />
          </div>
          <div className="field field-full">
            <label className="field-label">Cláusulas de seguridad exigidas</label>
            <div className="clause-list">
              {form.clausulas.map((c, i) => (
                <label key={c.nombre} className="checkbox">
                  <input type="checkbox" checked={c.cumplida} onChange={() => toggleClausula(i)} />
                  {c.nombre}
                </label>
              ))}
            </div>
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
