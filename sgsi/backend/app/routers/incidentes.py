"""Rutas de incidentes de ciberseguridad (taxonomía ANCI, Ley 21.663)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import EstadoIncidente, Incidente, Role, Severidad
from ..schemas import IncidenteCreate, IncidenteOut, IncidenteUpdate
from ..services import incidente_to_dict
from ..utils import now_naive, to_naive

router = APIRouter(prefix="/incidentes", tags=["incidentes"])


def _get_incidente(incidente_id: int, db: Session) -> Incidente:
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return incidente


@router.get("", response_model=list[IncidenteOut])
def list_incidentes(
    severidad: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Incidente)
    if severidad:
        q = q.filter(Incidente.severidad == Severidad(severidad))
    if estado:
        q = q.filter(Incidente.estado == EstadoIncidente(estado))
    if search:
        like = f"%{search}%"
        q = q.filter((Incidente.titulo.ilike(like)) | (Incidente.descripcion.ilike(like)))
    items = q.order_by(Incidente.fecha_deteccion.desc()).all()
    return [IncidenteOut(**incidente_to_dict(i)) for i in items]


@router.post("", response_model=IncidenteOut)
def create_incidente(
    data: IncidenteCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    payload = data.model_dump()
    payload["fecha_deteccion"] = to_naive(payload.get("fecha_deteccion")) or now_naive()
    incidente = Incidente(**payload)
    db.add(incidente)
    db.commit()
    db.refresh(incidente)
    return IncidenteOut(**incidente_to_dict(incidente))


@router.get("/{incidente_id}", response_model=IncidenteOut)
def get_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return IncidenteOut(**incidente_to_dict(_get_incidente(incidente_id, db)))


@router.put("/{incidente_id}", response_model=IncidenteOut)
def update_incidente(
    incidente_id: int,
    data: IncidenteUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    incidente = _get_incidente(incidente_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key in ("fecha_deteccion", "fecha_reporte"):
            value = to_naive(value)
        if key == "fecha_reporte" and value is not None and data.estado is None:
            # Marcar como reportado al registrar la fecha de reporte si no cambia el estado
            pass
        setattr(incidente, key, value)
    db.commit()
    db.refresh(incidente)
    return IncidenteOut(**incidente_to_dict(incidente))


@router.delete("/{incidente_id}")
def delete_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    incidente = _get_incidente(incidente_id, db)
    db.delete(incidente)
    db.commit()
    return {"ok": True}
