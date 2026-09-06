"""Configuración central de la aplicación SGSI."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # carpeta backend/
DATA_DIR = Path(os.getenv("SGSI_DATA_DIR", BASE_DIR / "data"))
EVIDENCE_DIR = DATA_DIR / "evidencias"

SECRET_KEY = os.getenv("SGSI_SECRET_KEY", "clave-de-desarrollo-cambiar-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("SGSI_TOKEN_EXPIRE", "480"))

# PostgreSQL-compatible: SGSI_DATABASE_URL=postgresql+psycopg://user:pass@host/db
DATABASE_URL = os.getenv("SGSI_DATABASE_URL", f"sqlite:///{DATA_DIR / 'sgsi.db'}")

# Pesos de madurez por estado de control (para calcular el % de avance del SGSI)
MATURITY_WEIGHTS = {
    "no_iniciado": 0.0,
    "iniciado": 0.33,
    "implementado": 0.67,
    "gestionado": 1.0,
}
