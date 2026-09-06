# SGSI — Sistema de Gestión de Seguridad de la Información

Aplicación web de tipo **GRC (Governance, Risk & Compliance)** para el **Hospital Félix Bulnes
Cerda**, construida a partir del informe de formulación del proyecto de título
(`Documentacion/Entregas/U1-Formulacion-Proyecto/borrador_informe_formulacion.md`).

Centraliza la gestión del SGSI en un único sistema auditable, con visualización del nivel de
madurez de los controles ISO/IEC 27001 y la gestión de incidentes de ciberseguridad conforme a la
Ley N.º 21.663 (taxonomía ANCI y plazos legales de reporte).

## Módulos

| Módulo | Descripción |
|---|---|
| **Controles ISO/IEC 27001** | Catálogo de controles del Anexo A por dominio (organizacional, personas, físico, tecnológico), estado (no iniciado / iniciado / implementado / gestionado) y evidencias adjuntas. |
| **Madurez del SGSI** | Cálculo automático del % de madurez por dominio y global, con gráficos (barras y torta). |
| **Incidentes** | Registro y clasificación según taxonomía ANCI, cómputo automático de plazos legales (alerta temprana 3 h; reporte 72 h para severidad alta/crítica, 15 días para media/baja) y alerta de vencimiento. |
| **Terceros / Proveedores** | Registro de contratos con checklist de cláusulas de seguridad y estado de cumplimiento. |
| **Controles de Personas** | Ciclo de vida del personal: capacitación, antecedentes, condiciones de empleo, disciplinario, término de contrato y confidencialidad. |
| **Reportería** | Resumen ejecutivo y exportación a CSV (compatible con Excel) para sustentar el indicador de gestión y auditorías. |

## Stack tecnológico

- **Backend:** Python 3.14 + FastAPI + SQLAlchemy + SQLite (compatible con PostgreSQL vía variable de entorno).
- **Autenticación:** JWT con control de acceso basado en roles (RBAC) y hash de contraseñas PBKDF2.
- **Frontend:** React 18 + TypeScript + Vite + Recharts (gráficos).

## Estructura del proyecto

```
sgsi/
├── backend/
│   ├── app/
│   │   ├── main.py          # Aplicación FastAPI y rutas raíz
│   │   ├── config.py        # Configuración (BD, JWT, pesos de madurez)
│   │   ├── database.py      # Conexión a BD
│   │   ├── models.py        # Modelos ORM
│   │   ├── schemas.py       # Esquemas Pydantic
│   │   ├── security.py      # Hash de contraseñas y JWT
│   │   ├── deps.py          # Dependencias de auth/roles
│   │   ├── services.py      # Plazos legales y reglas de madurez
│   │   ├── seed.py          # Datos de demostración
│   │   └── routers/         # Endpoints por módulo
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/           # Login, Dashboard, Controles, Incidentes, Terceros, Personas, Reportes
        ├── components/      # Layout, Modal, Badge
        ├── api.ts           # Cliente HTTP con token
        └── constants.ts     # Etiquetas y catálogos
```

## Puesta en marcha

### 1. Backend (puerto 8000)

```bash
cd sgsi/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed          # crea la BD y los datos de demostración
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (puerto 5173)

```bash
cd sgsi/frontend
npm install
npm run dev
```

Abre http://localhost:5173 (el servidor de desarrollo redirige `/api` al backend en el puerto 8000).

### Usuarios de demostración (contraseña: `demo123`)

| Usuario | Rol | Permisos |
|---|---|---|
| `miguel.godoy` | Encargado de Ciberseguridad | Acceso total (escritura en todos los módulos) |
| `maria.perez` | Administrador de Contratos | Escritura en Terceros; lectura en el resto |
| `juan.rojas` | Referente Técnico | Solo lectura |
| `patricia.silva` | Director/a | Solo lectura |

## Endpoints principales

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/controles            (filtros: ?dominio=&estado=&search=)
POST   /api/controles
PUT    /api/controles/{id}
DELETE /api/controles/{id}
POST   /api/controles/{id}/evidencias   (multipart)
GET    /api/evidencias/{id}/download
GET    /api/madurez
GET    /api/incidentes           (filtros: ?severidad=&estado=&search=)
POST   /api/incidentes
PUT    /api/incidentes/{id}
GET    /api/terceros             (filtros: ?estado=&search=)
GET    /api/personas             (filtros: ?tipo=&estado=)
GET    /api/reportes/resumen
GET    /api/reportes/{controles,incidentes,terceros,personas}.csv
```

La documentación interactiva (Swagger) está disponible en http://localhost:8000/docs.

## Configuración

Variables de entorno opcionales:

| Variable | Por defecto | Descripción |
|---|---|---|
| `SGSI_DATABASE_URL` | `sqlite:///data/sgsi.db` | Cadena de conexión (ej. `postgresql+psycopg://...`) |
| `SGSI_SECRET_KEY` | clave de desarrollo | Clave para firmar los tokens JWT |
| `SGSI_TOKEN_EXPIRE` | `480` | Validez del token en minutos |
| `SGSI_DATA_DIR` | `backend/data` | Carpeta de datos y evidencias |

> Los archivos de evidencia se guardan en `backend/data/evidencias/`.

## Notas

- La **madurez** se calcula ponderando cada estado: no iniciado = 0, iniciado = 0.33,
  implementado = 0.67, gestionado = 1.0.
- Los **plazos legales** de incidentes se calculan desde la fecha de detección según la
  Ley 21.663: alerta temprana a las 3 horas; reporte a las 72 horas (severidad alta/crítica) o a
  los 15 días (media/baja).
- La base de datos y los datos de demostración se crean automáticamente al ejecutar `app.seed`.
  Para reiniciar los datos, borra `backend/data/sgsi.db` y vuelve a ejecutar el seed.
