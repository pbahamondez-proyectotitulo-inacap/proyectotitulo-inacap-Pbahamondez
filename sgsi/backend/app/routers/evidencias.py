"""Descarga de archivos de evidencia."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import EVIDENCE_DIR
from ..database import get_db
from ..deps import get_current_user
from ..models import Evidencia

router = APIRouter(prefix="/evidencias", tags=["evidencias"])


@router.get("/{evidencia_id}/download")
def download_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    evidencia = db.query(Evidencia).filter(Evidencia.id == evidencia_id).first()
    if not evidencia or not evidencia.archivo_path:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    path = EVIDENCE_DIR / evidencia.archivo_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path, filename=evidencia.nombre)
