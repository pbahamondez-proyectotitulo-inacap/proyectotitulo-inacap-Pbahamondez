"""Aplicación FastAPI del SGSI — Hospital Félix Bulnes Cerda."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registra los modelos en Base.metadata)
from .database import Base, engine
from .routers import (
    auth,
    controles,
    evidencias,
    incidentes,
    madurez,
    personas,
    reportes,
    terceros,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SGSI — Hospital Félix Bulnes Cerda",
    description="Sistema de Gestión de Seguridad de la Información (controles ISO/IEC 27001, madurez, incidentes ANCI, terceros y personas).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    controles.router,
    evidencias.router,
    incidentes.router,
    terceros.router,
    personas.router,
    madurez.router,
    reportes.router,
):
    app.include_router(router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
