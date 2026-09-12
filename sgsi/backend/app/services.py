"""Lógica de negocio compartida: plazos de incidentes (Ley 21.663) y madurez."""
from datetime import timedelta

from .models import EstadoIncidente, Incidente, Severidad
from .utils import now_naive

# Plazos legales de reporte según Ley 21.663 / taxonomía ANCI.
ALERTA_TEMPRANA_HOURS = 3
PLAZO_REPORTE_HOURS_72 = 72
PLAZO_REPORTE_DAYS_15 = 15


def compute_plazos(incidente: Incidente) -> tuple:
    """Devuelve (alerta_temprana, plazo_reporte) a partir de la fecha de detección."""
    base = incidente.fecha_deteccion or now_naive()
    alerta_temprana = base + timedelta(hours=ALERTA_TEMPRANA_HOURS)
    if incidente.severidad in (Severidad.critica, Severidad.alta):
        plazo_reporte = base + timedelta(hours=PLAZO_REPORTE_HOURS_72)
    else:
        plazo_reporte = base + timedelta(days=PLAZO_REPORTE_DAYS_15)
    return alerta_temprana, plazo_reporte


def is_vencido(incidente: Incidente) -> bool:
    if incidente.estado in (EstadoIncidente.reportado, EstadoIncidente.cerrado):
        return False
    if incidente.reportado_anci:
        return False
    _, plazo_reporte = compute_plazos(incidente)
    return plazo_reporte < now_naive()


def incidente_to_dict(incidente: Incidente) -> dict:
    alerta_temprana, plazo_reporte = compute_plazos(incidente)
    return {
        "id": incidente.id,
        "titulo": incidente.titulo,
        "descripcion": incidente.descripcion,
        "categoria": incidente.categoria,
        "severidad": incidente.severidad,
        "alcance": incidente.alcance,
        "sistema_afectado": incidente.sistema_afectado,
        "fecha_deteccion": incidente.fecha_deteccion,
        "fecha_reporte": incidente.fecha_reporte,
        "estado": incidente.estado,
        "reportado_anci": incidente.reportado_anci,
        "notas": incidente.notas,
        "alerta_temprana": alerta_temprana,
        "plazo_reporte": plazo_reporte,
        "vencido": is_vencido(incidente),
    }
