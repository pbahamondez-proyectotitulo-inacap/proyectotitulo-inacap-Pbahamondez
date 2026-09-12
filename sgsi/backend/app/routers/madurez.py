"""Cálculo del nivel de madurez del SGSI por dominio y global."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import MATURITY_WEIGHTS
from ..database import get_db
from ..deps import get_current_user
from ..models import Control, Dominio, EstadoControl
from ..schemas import MadurezDominio, MadurezOut

router = APIRouter(prefix="/madurez", tags=["madurez"])


@router.get("", response_model=MadurezOut)
def get_madurez(db: Session = Depends(get_db), user=Depends(get_current_user)):
    controles = db.query(Control).all()
    total_controles = len(controles)
    pesos_estado = {estado.value: MATURITY_WEIGHTS[estado.value] for estado in EstadoControl}

    dominios_out: list[MadurezDominio] = []
    peso_total = 0.0
    for dominio in Dominio:
        subset = [c for c in controles if c.dominio == dominio]
        total = len(subset)
        estados = {e.value: 0 for e in EstadoControl}
        peso = 0.0
        for control in subset:
            estados[control.estado.value] += 1
            peso += pesos_estado[control.estado.value]
        pct = round((peso / total) * 100, 1) if total else 0.0
        peso_total += peso
        dominios_out.append(
            MadurezDominio(
                dominio=dominio,
                total=total,
                estados=estados,
                pct=pct,
                gestionados=estados["gestionado"],
                implementados=estados["implementado"],
            )
        )

    global_pct = round((peso_total / total_controles) * 100, 1) if total_controles else 0.0
    return MadurezOut(global_pct=global_pct, total_controles=total_controles, dominios=dominios_out)
