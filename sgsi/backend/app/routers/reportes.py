"""Reportería: resumen ejecutivo y exportación CSV para cumplimiento normativo."""
import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..config import MATURITY_WEIGHTS
from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Control,
    EstadoControl,
    EstadoCumplimiento,
    EstadoIncidente,
    Incidente,
    Tercero,
)
from ..services import is_vencido

router = APIRouter(prefix="/reportes", tags=["reportes"])


def _csv(headers: list[str], rows: list[list], filename: str) -> StreamingResponse:
    buffer = io.StringIO()
    buffer.write("\ufeff")  # BOM para compatibilidad con Excel
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), user=Depends(get_current_user)):
    controles = db.query(Control).all()
    total = len(controles)
    por_estado = {e.value: 0 for e in EstadoControl}
    peso = 0.0
    for control in controles:
        por_estado[control.estado.value] += 1
        peso += MATURITY_WEIGHTS.get(control.estado.value, 0.0)
    global_pct = round((peso / total) * 100, 1) if total else 0.0

    incidentes = db.query(Incidente).all()
    abiertos = sum(1 for i in incidentes if i.estado not in (EstadoIncidente.cerrado, EstadoIncidente.resuelto))
    vencidos = sum(1 for i in incidentes if is_vencido(i))

    terceros = db.query(Tercero).all()
    terceros_con_brechas = sum(
        1
        for t in terceros
        if t.estado_cumplimiento
        in (EstadoCumplimiento.pendiente, EstadoCumplimiento.no_cumple, EstadoCumplimiento.parcial)
    )

    return {
        "total_controles": total,
        "por_estado": por_estado,
        "madurez_global_pct": global_pct,
        "total_incidentes": len(incidentes),
        "incidentes_abiertos": abiertos,
        "incidentes_vencidos": vencidos,
        "total_terceros": len(terceros),
        "terceros_con_brechas": terceros_con_brechas,
    }


@router.get("/controles.csv")
def export_controles(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = [
        [c.codigo, c.titulo, c.dominio.value, c.grupo, c.estado.value, c.responsable, len(c.evidencias)]
        for c in db.query(Control).order_by(Control.codigo).all()
    ]
    return _csv(
        ["Código", "Título", "Dominio", "Grupo", "Estado", "Responsable", "Nº evidencias"],
        rows,
        "controles_sgsi.csv",
    )


@router.get("/incidentes.csv")
def export_incidentes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = [
        [
            i.id,
            i.titulo,
            i.categoria,
            i.severidad.value,
            i.alcance,
            i.sistema_afectado,
            i.fecha_deteccion,
            i.estado.value,
            "Sí" if i.reportado_anci else "No",
            "Vencido" if is_vencido(i) else "Al día",
        ]
        for i in db.query(Incidente).order_by(Incidente.fecha_deteccion.desc()).all()
    ]
    return _csv(
        ["ID", "Título", "Categoría", "Severidad", "Alcance", "Sistema afectado",
         "Fecha detección", "Estado", "Reportado ANCI", "Estado plazo"],
        rows,
        "incidentes_sgsi.csv",
    )


@router.get("/terceros.csv")
def export_terceros(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = [
        [
            t.nombre,
            t.rut,
            t.tipo,
            t.contrato_ref,
            t.estado_cumplimiento.value,
            sum(1 for c in (t.clausulas or []) if c.get("cumplida")),
            len(t.clausulas or []),
        ]
        for t in db.query(Tercero).order_by(Tercero.nombre).all()
    ]
    return _csv(
        ["Nombre", "RUT", "Tipo", "Referencia contrato", "Cumplimiento",
         "Cláusulas cumplidas", "Total cláusulas"],
        rows,
        "terceros_sgsi.csv",
    )


@router.get("/personas.csv")
def export_personas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from ..models import PersonaControl

    rows = [
        [p.tipo.value, p.titulo, p.estado.value, p.fecha, p.responsable]
        for p in db.query(PersonaControl).order_by(PersonaControl.tipo).all()
    ]
    return _csv(
        ["Tipo", "Título", "Estado", "Fecha", "Responsable"],
        rows,
        "personas_sgsi.csv",
    )
