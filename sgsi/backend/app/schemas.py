"""Esquemas Pydantic de entrada/salida de la API."""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict

from .models import (
    Dominio,
    EstadoControl,
    EstadoCumplimiento,
    EstadoIncidente,
    Role,
    Severidad,
    TipoPersonaControl,
)


# ---------- Autenticación ----------
class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    nombre_completo: str
    rol: Role


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    token: str
    user: UsuarioOut


# ---------- Controles / Evidencias ----------
class EvidenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    control_id: int
    tipo: str
    nombre: str
    descripcion: str
    archivo_path: Optional[str] = None
    fecha_subida: datetime


class ControlBase(BaseModel):
    codigo: str = ""
    titulo: str
    descripcion: str = ""
    dominio: Dominio
    grupo: str = ""
    estado: EstadoControl = EstadoControl.no_iniciado
    responsable: str = ""
    notas: str = ""


class ControlCreate(ControlBase):
    pass


class ControlUpdate(BaseModel):
    codigo: Optional[str] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    dominio: Optional[Dominio] = None
    grupo: Optional[str] = None
    estado: Optional[EstadoControl] = None
    responsable: Optional[str] = None
    notas: Optional[str] = None


class ControlOut(ControlBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha_actualizacion: Optional[datetime] = None
    evidencias: List[EvidenciaOut] = []


# ---------- Incidentes ----------
class IncidenteBase(BaseModel):
    titulo: str
    descripcion: str = ""
    categoria: str = ""
    severidad: Severidad
    alcance: str = "interno"
    sistema_afectado: str = ""
    fecha_deteccion: datetime
    estado: EstadoIncidente = EstadoIncidente.registrado
    reportado_anci: bool = False
    notas: str = ""


class IncidenteCreate(IncidenteBase):
    pass


class IncidenteUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    severidad: Optional[Severidad] = None
    alcance: Optional[str] = None
    sistema_afectado: Optional[str] = None
    fecha_deteccion: Optional[datetime] = None
    fecha_reporte: Optional[datetime] = None
    estado: Optional[EstadoIncidente] = None
    reportado_anci: Optional[bool] = None
    notas: Optional[str] = None


class IncidenteOut(IncidenteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha_reporte: Optional[datetime] = None
    alerta_temprana: Optional[datetime] = None
    plazo_reporte: Optional[datetime] = None
    vencido: bool = False


# ---------- Terceros / Proveedores ----------
class ClausulaItem(BaseModel):
    nombre: str
    cumplida: bool = False


class TerceroBase(BaseModel):
    nombre: str
    rut: str = ""
    tipo: str = "proveedor_sistema"
    contrato_ref: str = ""
    fecha_inicio: Optional[datetime] = None
    fecha_termino: Optional[datetime] = None
    contacto: str = ""
    estado_cumplimiento: EstadoCumplimiento = EstadoCumplimiento.pendiente
    clausulas: List[ClausulaItem] = []
    notas: str = ""


class TerceroCreate(TerceroBase):
    pass


class TerceroUpdate(BaseModel):
    nombre: Optional[str] = None
    rut: Optional[str] = None
    tipo: Optional[str] = None
    contrato_ref: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_termino: Optional[datetime] = None
    contacto: Optional[str] = None
    estado_cumplimiento: Optional[EstadoCumplimiento] = None
    clausulas: Optional[List[ClausulaItem]] = None
    notas: Optional[str] = None


class TerceroOut(TerceroBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------- Personas ----------
class PersonaControlBase(BaseModel):
    tipo: TipoPersonaControl
    titulo: str
    descripcion: str = ""
    estado: EstadoControl = EstadoControl.no_iniciado
    fecha: Optional[datetime] = None
    responsable: str = ""
    notas: str = ""


class PersonaControlCreate(PersonaControlBase):
    pass


class PersonaControlUpdate(BaseModel):
    tipo: Optional[TipoPersonaControl] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[EstadoControl] = None
    fecha: Optional[datetime] = None
    responsable: Optional[str] = None
    notas: Optional[str] = None


class PersonaControlOut(PersonaControlBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------- Madurez ----------
class MadurezDominio(BaseModel):
    dominio: Dominio
    total: int
    estados: Dict[str, int]
    pct: float
    gestionados: int
    implementados: int


class MadurezOut(BaseModel):
    global_pct: float
    total_controles: int
    dominios: List[MadurezDominio]
