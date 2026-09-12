"""Rutas de controles del dominio "Personas" (ciclo de vida del personal)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import EstadoControl, PersonaControl, Role, TipoPersonaControl
from ..schemas import PersonaControlCreate, PersonaControlOut, PersonaControlUpdate
from ..utils import to_naive

router = APIRouter(prefix="/personas", tags=["personas"])


def _get_persona(persona_id: int, db: Session) -> PersonaControl:
    persona = db.query(PersonaControl).filter(PersonaControl.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Registro de control de personas no encontrado")
    return persona


@router.get("", response_model=list[PersonaControlOut])
def list_personas(
    tipo: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(PersonaControl)
    if tipo:
        q = q.filter(PersonaControl.tipo == TipoPersonaControl(tipo))
    if estado:
        q = q.filter(PersonaControl.estado == EstadoControl(estado))
    return q.order_by(PersonaControl.tipo).all()


@router.post("", response_model=PersonaControlOut)
def create_persona(
    data: PersonaControlCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    payload = data.model_dump()
    payload["fecha"] = to_naive(payload.get("fecha"))
    persona = PersonaControl(**payload)
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.get("/{persona_id}", response_model=PersonaControlOut)
def get_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return _get_persona(persona_id, db)


@router.put("/{persona_id}", response_model=PersonaControlOut)
def update_persona(
    persona_id: int,
    data: PersonaControlUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    persona = _get_persona(persona_id, db)
    payload = data.model_dump(exclude_unset=True)
    if "fecha" in payload:
        payload["fecha"] = to_naive(payload["fecha"])
    for key, value in payload.items():
        setattr(persona, key, value)
    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}")
def delete_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    persona = _get_persona(persona_id, db)
    db.delete(persona)
    db.commit()
    return {"ok": True}
