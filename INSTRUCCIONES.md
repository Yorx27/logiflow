# LogiFlow — Instrucciones de Inicio

## Requisitos previos
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker Desktop (para PostgreSQL)

---

## Inicio rápido (desarrollo)

### 1. Instalar dependencias
```bash
cd logiflow
pnpm install
```

### 2. Levantar PostgreSQL
```bash
docker-compose up -d postgres
```

### 3. Configurar variables de entorno
```bash
# Ya existe apps/api/.env con defaults para dev
# Verificar que DATABASE_URL apunte a localhost:5432
```

### 4. Migraciones y seed
```bash
pnpm --filter api prisma migrate dev --name init
pnpm --filter api prisma db seed
```

### 5. Levantar todo en paralelo
```bash
pnpm dev
```

O individualmente:
```bash
pnpm --filter api dev        # API en :3001
pnpm --filter gestion dev    # Portal Gestión en :5173
pnpm --filter conductor dev  # Portal Conductor en :5174
```

---

## Accesos

### Portal Gestión — http://localhost:5173
| Usuario | Password | Rol |
|---------|----------|-----|
| admin@logiflow.com | admin123 | ADMIN |
| operador1@logiflow.com | operador123 | OPERADOR |

### Portal Conductor — http://localhost:5174
Seleccionar conductor de la lista (MVP sin PIN):
- Carlos Mendoza
- María González

---

## Producción con Docker

```bash
docker-compose up -d
```
- Portal Gestión: http://localhost:5173
- Portal Conductor: http://localhost:5174
- API: http://localhost:3001

---

## Estructura del proyecto

```
logiflow/
├── apps/
│   ├── api/          # Express + Prisma + Socket.io
│   ├── gestion/      # React 18 + Tailwind (desktop/tablet)
│   └── conductor/    # React 18 PWA (móvil)
├── packages/
│   ├── types/        # Tipos TypeScript compartidos
│   └── utils/        # Helpers compartidos
└── docker-compose.yml
```

---

## Funcionalidades principales

### Portal Gestión
- Dashboard con KPIs en tiempo real (WebSocket)
- CRUD completo de Solicitudes con 5 pestañas + mapa Leaflet
- Cálculo de ruta automático con OSRM + Nominatim (sin API key)
- Gestión de Entregas: asignar conductor/vehículo, cambiar estados
- Conductores y Vehículos con semáforo de disponibilidad
- Calendario mensual de entregas
- Facturación con generación de PDF
- Reportes exportables a Excel
- Configuración de costos y empresa

### Portal Conductor (PWA)
- Instalable en móvil como app nativa
- Checklist de 4 pasos con validaciones
- Captura de fotos con cámara del dispositivo
- Firma digital táctil con soporte retina
- Historial y estadísticas
- Notificaciones en tiempo real

---

Powered by RAGA · CDMX
