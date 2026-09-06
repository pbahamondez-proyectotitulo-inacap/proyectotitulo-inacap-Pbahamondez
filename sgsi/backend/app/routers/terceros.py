"""Rutas de terceros / proveedores (cláusulas de seguridad en contratos)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import EstadoCumplimiento, Role, Tercero
from ..schemas import TerceroCreate, TerceroOut, TerceroUpdate
from ..utils import to_naive

router = APIRouter(prefix="/terceros", tags=["terceros"])

# Encargado de ciberseguridad y administrador de contratos pueden escribir.
_WRITERS = (Role.encargado, Role.admin_contratos)


def _get_tercero(tercero_id: int, db: Session) -> Tercero:
    tercero = db.query(Tercero).filter(Tercero.id == tercero_id).first()
    if not tercero:
        raise HTTPException(status_code=404, detail="Tercero no encontrado")
    return tercero


def _clausulas_to_dicts(data: TerceroCreate | TerceroUpdate):
    if data.clausulas is not None:
        return [c.model_dump() for c in data.clausulas]
    return None


@router.get("", response_model=list[TerceroOut])
def list_terceros(
    estado: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Tercero)
    if estado:
        q = q.filter(Tercero.estado_cumplimiento == EstadoCumplimiento(estado))
    if search:
        like = f"%{search}%"
        q = q.filter((Tercero.nombre.ilike(like)) | (Tercero.rut.ilike(like)))
    return q.order_by(Tercero.nombre).all()


@router.post("", response_model=TerceroOut)
def create_tercero(
    data: TerceroCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(*_WRITERS)),
):
    payload = data.model_dump()
    payload["fecha_inicio"] = to_naive(payload.get("fecha_inicio"))
    payload["fecha_termino"] = to_naive(payload.get("fecha_termino"))
    payload["clausulas"] = _clausulas_to_dicts(data) or []
    tercero = Tercero(**payload)
    db.add(tercero)
    db.commit()
    db.refresh(tercero)
    return tercero


@router.get("/{tercero_id}", response_model=TerceroOut)
def get_tercero(
    tercero_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return _get_tercero(tercero_id, db)


@router.put("/{tercero_id}", response_model=TerceroOut)
def update_tercero(
    tercero_id: int,
    data: TerceroUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(*_WRITERS)),
):
    tercero = _get_tercero(tercero_id, db)
    payload = data.model_dump(exclude_unset=True)
    if "fecha_inicio" in payload:
        payload["fecha_inicio"] = to_naive(payload["fecha_inicio"])
    if "fecha_termino" in payload:
        payload["fecha_termino"] = to_naive(payload["fecha_termino"])
    if "clausulas" in payload:
        payload["clausulas"] = [c.model_dump() for c in data.clausulas] if data.clausulas else []
    for key, value in payload.items():
        setattr(tercero, key, value)
    db.commit()
    db.refresh(tercero)
    return tercero


@router.delete("/{tercero_id}")
def delete_tercero(
    tercero_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(*_WRITERS)),
):
    tercero = _get_tercero(tercero_id, db)
    db.delete(tercero)
    db.commit()
    return {"ok": True}
