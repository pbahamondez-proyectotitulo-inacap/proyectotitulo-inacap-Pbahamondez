export type Role = 'encargado' | 'admin_contratos' | 'referente_tecnico' | 'director'
export type Dominio = 'organizacional' | 'personas' | 'fisico' | 'tecnologico'
export type EstadoControl = 'no_iniciado' | 'iniciado' | 'implementado' | 'gestionado'
export type Severidad = 'baja' | 'media' | 'alta' | 'critica'
export type EstadoIncidente =
  | 'registrado'
  | 'en_analisis'
  | 'contenido'
  | 'resuelto'
  | 'reportado'
  | 'cerrado'
export type EstadoCumplimiento = 'pendiente' | 'parcial' | 'cumple' | 'no_cumple'
export type TipoPersonaControl =
  | 'capacitacion'
  | 'antecedentes'
  | 'condiciones_empleo'
  | 'disciplinario'
  | 'termino_contrato'
  | 'confidencialidad'

export interface Usuario {
  id: number
  username: string
  nombre_completo: string
  rol: Role
}

export interface Evidencia {
  id: number
  control_id: number
  tipo: string
  nombre: string
  descripcion: string
  archivo_path: string | null
  fecha_subida: string
}

export interface Control {
  id: number
  codigo: string
  titulo: string
  descripcion: string
  dominio: Dominio
  grupo: string
  estado: EstadoControl
  responsable: string
  notas: string
  fecha_actualizacion: string | null
  evidencias: Evidencia[]
}

export interface Incidente {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  severidad: Severidad
  alcance: string
  sistema_afectado: string
  fecha_deteccion: string
  fecha_reporte: string | null
  estado: EstadoIncidente
  reportado_anci: boolean
  notas: string
  alerta_temprana: string
  plazo_reporte: string
  vencido: boolean
}

export interface Clausula {
  nombre: string
  cumplida: boolean
}

export interface Tercero {
  id: number
  nombre: string
  rut: string
  tipo: string
  contrato_ref: string
  fecha_inicio: string | null
  fecha_termino: string | null
  contacto: string
  estado_cumplimiento: EstadoCumplimiento
  clausulas: Clausula[]
  notas: string
}

export interface PersonaControl {
  id: number
  tipo: TipoPersonaControl
  titulo: string
  descripcion: string
  estado: EstadoControl
  fecha: string | null
  responsable: string
  notas: string
}

export interface MadurezDominio {
  dominio: Dominio
  total: number
  estados: Record<string, number>
  pct: number
  gestionados: number
  implementados: number
}

export interface Madurez {
  global_pct: number
  total_controles: number
  dominios: MadurezDominio[]
}

export interface Resumen {
  total_controles: number
  por_estado: Record<string, number>
  madurez_global_pct: number
  total_incidentes: number
  incidentes_abiertos: number
  incidentes_vencidos: number
  total_terceros: number
  terceros_con_brechas: number
}
