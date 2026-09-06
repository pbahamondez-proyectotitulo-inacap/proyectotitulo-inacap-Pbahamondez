export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

export function fmtDateOnly(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CL', { dateStyle: 'short' })
}

/** Convierte un ISO (con o sin zona) al formato de un input datetime-local. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Convierte el valor de un input datetime-local a ISO naive (sin zona). */
export function fromLocalInput(value: string): string | null {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}
