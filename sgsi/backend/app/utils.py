"""Utilidades de fechas para almacenamiento naive-UTC en SQLite."""
from datetime import datetime


def now_naive() -> datetime:
    """Hora local actual sin información de zona (compatible con SQLite).

    Se usa hora local para que los plazos legales y las fechas mostradas
    coincidan con el reloj de la institución (Chile continental).
    """
    return datetime.now()


def to_naive(dt: datetime | None) -> datetime | None:
    """Convierte un datetime aware a hora local naive; si ya es naive lo devuelve igual."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone().replace(tzinfo=None)
    return dt
