"""Rutas de controles ISO/IEC 27001 y sus evidencias."""
import shutil
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from sqlalchemy.orm import Session, selectinload

from ..config import EVIDENCE_DIR
from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Control, Dominio, EstadoControl, Evidencia, Role
from ..schemas import ControlCreate, ControlOut, ControlUpdate, EvidenciaOut
from ..utils import to_naive

router = APIRouter(prefix="/controles", tags=["controles"])


def _get_control(control_id: int, db: Session) -> Control:
    control = (
        db.query(Control)
        .options(selectinload(Control.evidencias))
        .filter(Control.id == control_id)
        .first()
    )
    if not control:
        raise HTTPException(status_code=404, detail="Control no encontrado")
    return control


@router.get("", response_model=list[ControlOut])
def list_controles(
    dominio: str | None = Query(default=None),
    estado: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Control).options(selectinload(Control.evidencias))
    if dominio:
        q = q.filter(Control.dominio == Dominio(dominio))
    if estado:
        q = q.filter(Control.estado == EstadoControl(estado))
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Control.titulo.ilike(like))
            | (Control.codigo.ilike(like))
            | (Control.descripcion.ilike(like))
        )
    return q.order_by(Control.codigo).all()


@router.post("", response_model=ControlOut)
def create_control(
    data: ControlCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    control = Control(**data.model_dump())
    db.add(control)
    db.commit()
    db.refresh(control)
    return control


@router.get("/{control_id}", response_model=ControlOut)
def get_control(
    control_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return _get_control(control_id, db)


@router.put("/{control_id}", response_model=ControlOut)
def update_control(
    control_id: int,
    data: ControlUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    control = _get_control(control_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(control, key, value)
    db.commit()
    db.refresh(control)
    return control


@router.delete("/{control_id}")
def delete_control(
    control_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    control = _get_control(control_id, db)
    db.delete(control)
    db.commit()
    return {"ok": True}


@router.post("/{control_id}/evidencias", response_model=EvidenciaOut)
async def upload_evidencia(
    control_id: int,
    nombre: str = Form(...),
    tipo: str = Form("documento"),
    descripcion: str = Form(""),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles(Role.encargado)),
):
    control = _get_control(control_id, db)
    archivo_path = None
    if file is not None and file.filename:
        extension = Path(file.filename).suffix
        filename = f"{uuid.uuid4().hex}{extension}"
        destination = EVIDENCE_DIR / filename
        with destination.open("wb") as out:
            shutil.copyfileobj(file.file, out)
        archivo_path = filename

    evidencia = Evidencia(
        control_id=control.id,
        tipo=tipo,
        nombre=nombre,
        descripcion=descripcion,
        archivo_path=archivo_path,
    )
    db.add(evidencia)
    db.commit()
    db.refresh(evidencia)
    return evidencia


@router.get("/{control_id}/evidencias", response_model=list[EvidenciaOut])
def list_evidencias(
    control_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    control = _get_control(control_id, db)
    return control.evidencias
