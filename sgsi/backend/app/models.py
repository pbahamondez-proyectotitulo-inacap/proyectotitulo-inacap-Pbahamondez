"""Modelos ORM del SGSI (SQLAlchemy)."""
import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base
from .utils import now_naive


class Role(str, enum.Enum):
    encargado = "encargado"
    admin_contratos = "admin_contratos"
    referente_tecnico = "referente_tecnico"
    director = "director"


class Dominio(str, enum.Enum):
    organizacional = "organizacional"
    personas = "personas"
    fisico = "fisico"
    tecnologico = "tecnologico"


class EstadoControl(str, enum.Enum):
    no_iniciado = "no_iniciado"
    iniciado = "iniciado"
    implementado = "implementado"
    gestionado = "gestionado"


class Severidad(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    critica = "critica"


class EstadoIncidente(str, enum.Enum):
    registrado = "registrado"
    en_analisis = "en_analisis"
    contenido = "contenido"
    resuelto = "resuelto"
    reportado = "reportado"
    cerrado = "cerrado"


class EstadoCumplimiento(str, enum.Enum):
    pendiente = "pendiente"
    parcial = "parcial"
    cumple = "cumple"
    no_cumple = "no_cumple"


class TipoPersonaControl(str, enum.Enum):
    capacitacion = "capacitacion"
    antecedentes = "antecedentes"
    condiciones_empleo = "condiciones_empleo"
    disciplinario = "disciplinario"
    termino_contrato = "termino_contrato"
    confidencialidad = "confidencialidad"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre_completo = Column(String, nullable=False)
    rol = Column(SAEnum(Role), nullable=False)
    activo = Column(Boolean, default=True)


class Control(Base):
    __tablename__ = "controles"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, index=True)  # ej. "A.5.1"
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, default="")
    dominio = Column(SAEnum(Dominio), nullable=False, index=True)
    grupo = Column(String, default="")  # ej. "5 Políticas de seguridad de la información"
    estado = Column(SAEnum(EstadoControl), default=EstadoControl.no_iniciado, index=True)
    responsable = Column(String, default="")
    notas = Column(Text, default="")
    fecha_actualizacion = Column(DateTime, default=now_naive, onupdate=now_naive)

    evidencias = relationship(
        "Evidencia", back_populates="control", cascade="all, delete-orphan"
    )


class Evidencia(Base):
    __tablename__ = "evidencias"

    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(Integer, ForeignKey("controles.id"), nullable=False)
    tipo = Column(String, default="documento")
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, default="")
    archivo_path = Column(String, nullable=True)
    fecha_subida = Column(DateTime, default=now_naive)

    control = relationship("Control", back_populates="evidencias")


class Incidente(Base):
    __tablename__ = "incidentes"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, default="")
    categoria = Column(String, default="")  # taxonomía ANCI
    severidad = Column(SAEnum(Severidad), nullable=False, index=True)
    alcance = Column(String, default="interno")  # interno / externo / proveedor
    sistema_afectado = Column(String, default="")
    fecha_deteccion = Column(DateTime, default=now_naive)
    fecha_reporte = Column(DateTime, nullable=True)
    estado = Column(SAEnum(EstadoIncidente), default=EstadoIncidente.registrado, index=True)
    reportado_anci = Column(Boolean, default=False)
    notas = Column(Text, default="")


class Tercero(Base):
    __tablename__ = "terceros"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    rut = Column(String, default="")
    tipo = Column(String, default="proveedor_sistema")
    contrato_ref = Column(String, default="")
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_termino = Column(DateTime, nullable=True)
    contacto = Column(String, default="")
    estado_cumplimiento = Column(
        SAEnum(EstadoCumplimiento), default=EstadoCumplimiento.pendiente
    )
    # Lista de cláusulas de seguridad: [{"nombre": str, "cumplida": bool}]
    clausulas = Column(JSON, default=list)
    notas = Column(Text, default="")


class PersonaControl(Base):
    __tablename__ = "persona_controles"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(SAEnum(TipoPersonaControl), nullable=False, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, default="")
    estado = Column(SAEnum(EstadoControl), default=EstadoControl.no_iniciado, index=True)
    fecha = Column(DateTime, nullable=True)
    responsable = Column(String, default="")
    notas = Column(Text, default="")
