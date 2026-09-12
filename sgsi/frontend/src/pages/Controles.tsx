import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import {
  DOMINIOS,
  DOMINIO_COLORS,
  DOMINIO_LABELS,
  ESTADOS_CONTROL,
  ESTADO_COLORS,
  ESTADO_LABELS,
} from '../constants'
import { fmtDate } from '../helpers'
import type { Control, Dominio, EstadoControl, Evidencia } from '../types'

interface FormState {
  codigo: string
  titulo: string
  descripcion: string
  dominio: Dominio
  grupo: string
  estado: EstadoControl
  responsable: string
  notas: string
}

const EMPTY_FORM: FormState = {
  codigo: '',
  titulo: '',
  descripcion: '',
  dominio: 'organizacional',
  grupo: '',
  estado: 'no_iniciado',
  responsable: '',
  notas: '',
}

export default function Controles() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'encargado'

  const [controles, setControles] = useState<Control[]>([])
  const [search, setSearch] = useState('')
  const [fDominio, setFDominio] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Control | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [evControl, setEvControl] = useState<Control | null>(null)
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [evForm, setEvForm] = useState({ nombre: '', tipo: 'documento', descripcion: '' })
  const [evFile, setEvFile] = useState<File | null>(null)
  const [evUploading, setEvUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (fDominio) params.set('dominio', fDominio)
      if (fEstado) params.set('estado', fEstado)
      const qs = params.toString()
      setControles(await api.get<Control[]>(`/controles${qs ? `?${qs}` : ''}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar controles')
    } finally {
      setLoading(false)
    }
  }, [search, fDominio, fEstado])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c: Control) {
    setEditing(c)
    setForm({
      codigo: c.codigo,
      titulo: c.titulo,
      descripcion: c.descripcion,
      dominio: c.dominio,
      grupo: c.grupo,
      estado: c.estado,
      responsable: c.responsable,
      notas: c.notas,
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
      if (editing) await api.put(`/controles/${editing.id}`, form)
      else await api.post('/controles', form)
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(c: Control) {
    if (!window.confirm(`¿Eliminar el control ${c.codigo} "${c.titulo}"?`)) return
    try {
      await api.del(`/controles/${c.id}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function openEvidence(c: Control) {
    setEvControl(c)
    setEvidencias(c.evidencias)
    setEvForm({ nombre: '', tipo: 'documento', descripcion: '' })
    setEvFile(null)
    setError('')
  }

  async function uploadEvidence() {
    if (!evControl) return
    if (!evForm.nombre.trim()) {
      setError('Ingrese el nombre de la evidencia')
      return
    }
    setEvUploading(true)
    try {
      const fd = new FormData()
      fd.append('nombre', evForm.nombre)
      fd.append('tipo', evForm.tipo)
      fd.append('descripcion', evForm.descripcion)
      if (evFile) fd.append('file', evFile)
      await api.upload(`/controles/${evControl.id}/evidencias`, fd)
      const updated = await api.get<Control>(`/controles/${evControl.id}`)
      setEvidencias(updated.evidencias)
      setEvForm({ nombre: '', tipo: 'documento', descripcion: '' })
      setEvFile(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir evidencia')
    } finally {
      setEvUploading(false)
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="filters">
          <input
            className="input"
            placeholder="Buscar por código, título o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={fDominio} onChange={(e) => setFDominio(e.target.value)}>
            <option value="">Todos los dominios</option>
            {DOMINIOS.map((d) => (
              <option key={d} value={d}>
                {DOMINIO_LABELS[d]}
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
            + Nuevo control
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Título</th>
              <th>Dominio</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th>Evidencias</th>
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
              controles.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.codigo}</td>
                  <td>
                    <div className="cell-title">{c.titulo}</div>
                    <div className="cell-sub">{c.descripcion}</div>
                  </td>
                  <td>
                    <Badge color={DOMINIO_COLORS[c.dominio]}>{DOMINIO_LABELS[c.dominio]}</Badge>
                  </td>
                  <td className="text-muted">{c.grupo || '—'}</td>
                  <td>
                    <Badge color={ESTADO_COLORS[c.estado]}>{ESTADO_LABELS[c.estado]}</Badge>
                  </td>
                  <td>{c.responsable || '—'}</td>
                  <td>{c.evidencias.length}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEvidence(c)}>
                        Evidencias
                      </button>
                      {canWrite && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && controles.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No hay controles que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de control */}
      <Modal
        title={editing ? `Editar control ${editing.codigo}` : 'Nuevo control ISO 27001'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label">Código (ej. A.5.1)</label>
            <input className="input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Título *</label>
            <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label">Dominio</label>
            <select className="input" value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value as Dominio })}>
              {DOMINIOS.map((d) => (
                <option key={d} value={d}>
                  {DOMINIO_LABELS[d]}
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
          <div className="field">
            <label className="field-label">Grupo</label>
            <input className="input" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} placeholder="5 Políticas de seguridad…" />
          </div>
          <div className="field">
            <label className="field-label">Responsable</label>
            <input className="input" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
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

      {/* Modal de evidencias */}
      <Modal
        title={`Evidencias — ${evControl ? `${evControl.codigo} ${evControl.titulo}` : ''}`}
        open={evControl !== null}
        onClose={() => setEvControl(null)}
        wide
      >
        {evControl && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {evidencias.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.nombre}</td>
                    <td>{ev.tipo}</td>
                    <td className="text-muted">{ev.descripcion || '—'}</td>
                    <td>{fmtDate(ev.fecha_subida)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {ev.archivo_path ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => api.download(`/evidencias/${ev.id}/download`, ev.nombre)}
                        >
                          Descargar
                        </button>
                      ) : (
                        <span className="text-muted">Sin archivo</span>
                      )}
                    </td>
                  </tr>
                ))}
                {evidencias.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      Sin evidencias registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {canWrite && (
              <div className="upload-panel">
                <h4>Agregar evidencia</h4>
                <div className="form-grid">
                  <div className="field">
                    <label className="field-label">Nombre *</label>
                    <input className="input" value={evForm.nombre} onChange={(e) => setEvForm({ ...evForm, nombre: e.target.value })} />
                  </div>
                  <div className="field">
                    <label className="field-label">Tipo</label>
                    <select className="input" value={evForm.tipo} onChange={(e) => setEvForm({ ...evForm, tipo: e.target.value })}>
                      <option value="documento">Documento</option>
                      <option value="acta">Acta</option>
                      <option value="registro">Registro</option>
                      <option value="capacitacion">Capacitación</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Archivo (opcional)</label>
                    <input type="file" className="input" onChange={(e) => setEvFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="field field-full">
                    <label className="field-label">Descripción</label>
                    <input className="input" value={evForm.descripcion} onChange={(e) => setEvForm({ ...evForm, descripcion: e.target.value })} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={uploadEvidence} disabled={evUploading}>
                    {evUploading ? 'Subiendo…' : 'Subir evidencia'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
