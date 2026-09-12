export const DOMINIO_LABELS: Record<string, string> = {
  organizacional: 'Organizacional',
  personas: 'Personas',
  fisico: 'Físico',
  tecnologico: 'Tecnológico',
}

export const DOMINIO_COLORS: Record<string, string> = {
  organizacional: 'blue',
  personas: 'purple',
  fisico: 'amber',
  tecnologico: 'cyan',
}

export const ESTADO_LABELS: Record<string, string> = {
  no_iniciado: 'No iniciado',
  iniciado: 'Iniciado',
  implementado: 'Implementado',
  gestionado: 'Gestionado',
}

export const SEVERIDAD_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}

export const ESTADO_INCIDENTE_LABELS: Record<string, string> = {
  registrado: 'Registrado',
  en_analisis: 'En análisis',
  contenido: 'Contenido',
  resuelto: 'Resuelto',
  reportado: 'Reportado',
  cerrado: 'Cerrado',
}

export const CUMPLIMIENTO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  cumple: 'Cumple',
  no_cumple: 'No cumple',
}

export const TIPO_PERSONA_LABELS: Record<string, string> = {
  capacitacion: 'Capacitación',
  antecedentes: 'Antecedentes',
  condiciones_empleo: 'Condiciones de empleo',
  disciplinario: 'Proceso disciplinario',
  termino_contrato: 'Término de contrato',
  confidencialidad: 'Confidencialidad',
}

export const ROL_LABELS: Record<string, string> = {
  encargado: 'Encargado de Ciberseguridad',
  admin_contratos: 'Administrador de Contratos',
  referente_tecnico: 'Referente Técnico',
  director: 'Director/a',
}

export const ESTADO_COLORS: Record<string, string> = {
  no_iniciado: 'gray',
  iniciado: 'amber',
  implementado: 'blue',
  gestionado: 'green',
}

export const SEVERIDAD_COLORS: Record<string, string> = {
  baja: 'green',
  media: 'amber',
  alta: 'orange',
  critica: 'red',
}

export const ESTADO_INCIDENTE_COLORS: Record<string, string> = {
  registrado: 'gray',
  en_analisis: 'amber',
  contenido: 'blue',
  resuelto: 'green',
  reportado: 'green',
  cerrado: 'gray',
}

export const CUMPLIMIENTO_COLORS: Record<string, string> = {
  pendiente: 'gray',
  parcial: 'amber',
  cumple: 'green',
  no_cumple: 'red',
}

export const CATEGORIAS_INCIDENTE = [
  'malware',
  'phishing',
  'ransomware',
  'acceso_no_autorizado',
  'denegacion_servicio',
  'filtracion_datos',
  'ingenieria_social',
  'otro',
]

export const ALCANCE_OPCIONES = ['interno', 'externo', 'proveedor']

export const TIPOS_TERCERO = [
  'proveedor_sistema',
  'proveedor_servicio',
  'proveedor_infraestructura',
  'consultora',
  'otro',
]

export const CLAUSULAS_DEFAULT = [
  'Acuerdo de confidencialidad (NDA)',
  'Tratamiento de datos personales',
  'Reporte de incidentes de seguridad',
  'Continuidad y niveles de servicio (SLA)',
  'Subcontratación autorizada',
  'Derecho de auditoría',
  'Devolución/eliminación de datos al término',
]

export const DOMINIOS = ['organizacional', 'personas', 'fisico', 'tecnologico']
export const ESTADOS_CONTROL = ['no_iniciado', 'iniciado', 'implementado', 'gestionado']
export const SEVERIDADES = ['baja', 'media', 'alta', 'critica']
export const ESTADOS_INCIDENTE = [
  'registrado',
  'en_analisis',
  'contenido',
  'resuelto',
  'reportado',
  'cerrado',
]
export const CUMPLIMIENTOS = ['pendiente', 'parcial', 'cumple', 'no_cumple']
export const TIPOS_PERSONA = [
  'capacitacion',
  'antecedentes',
  'condiciones_empleo',
  'disciplinario',
  'termino_contrato',
  'confidencialidad',
]
