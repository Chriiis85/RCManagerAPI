# 🎢 RCManager API — Theme Parks & Coaster Credits RESTful Backend

[🇪🇸 Ver en Español](#-español) | [🇬🇧 View in English](#-english)

**Live API & Interactive Docs:** [https://rc-manager-api.vercel.app](https://rc-manager-api.vercel.app) · **Frontend Client:** [https://rcmanager-nine.vercel.app](https://rcmanager-nine.vercel.app)

---

## 🇪🇸 Español

¡Hola! 👋 Soy **Christian**, desarrollador Web Full Stack.

**RCManager API** es un backend RESTful robusto, desacoplado y de alto rendimiento diseñado para dar servicio a la plataforma [RCManager](https://github.com/Chriiis85/RCManager) (gestión de parques temáticos, montañas rusas, *coaster credits* y planificación de viajes), además de ofrecer acceso seguro para desarrolladores y scripts externos mediante un sistema avanzado de **API Keys**.

### ✨ Características Principales

- 🔐 **Autenticación Híbrida (JWT + 2FA + API Keys):**
  - Sesiones de usuario interactivas mediante **JWT** + soporte **2FA** (TOTP con Google Authenticator/Authy y OTP por correo electrónico) + login social con **Supabase OAuth**.
  - **API Keys (`rcm_live_...`)** para integraciones externas y automatizaciones: almacenadas únicamente mediante su **hash criptográfico SHA-256**, con comparación en tiempo constante (`crypto.timingSafeEqual`), **scopes granulares** (`catalog:read`, `records:read`, etc.), expiración automática, rotación atómica y revocación inmediata.
- 📦 **Versionado Limpio y Retrocompatible:**
  - Rutas `/api/v1/*` (y `/v1/*`): sobre de respuesta uniforme y tipado (`{ success, data, meta }`).
  - Rutas `/api/*`: capa de compatibilidad para clientes web existentes.
- 🛡️ **Seguridad Endurecida:**
  - Protección de cabeceras HTTP con `helmet`, **Rate Limiting** escalonado por criticidad (global, login/registro y 2FA/OTP), validación estricta de esquemas con **Zod** (prevención de *Mass Assignment* y *SQL Injection*), limitador de payload (`100kb`) y logs con redacción automática de credenciales sensibles.
- 📖 **Documentación Interactiva:**
  - Landing pública en `/` y especificación **OpenAPI 3.0.3 / Swagger UI** en `/api/v1/docs` (JSON en `/api/v1/docs.json`) con consola de pruebas integrada en el navegador.

---

### 📁 Estructura del Proyecto

```text
RCManagerAPI/
├── prisma/
│   └── schema.prisma              # Esquema PostgreSQL (esquema RCManager) + modelo ApiKey
├── public/
│   └── index.html                 # Documentación interactiva y consola de pruebas
├── src/
│   ├── config/
│   │   ├── env.ts                 # Carga y validación estricta de variables de entorno
│   │   ├── database.ts            # Singleton PrismaClient + pg Pool para Vercel Serverless
│   │   └── openapi.ts             # Especificación OpenAPI 3.0.3
│   ├── middlewares/
│   │   ├── auth.ts                # Autenticación híbrida (JWT + API Key), RBAC y Scopes
│   │   ├── errorHandler.ts        # Manejador centralizado de errores (AppError, Zod, Prisma)
│   │   ├── rateLimit.ts           # Limitadores de tasa por criticidad de endpoint
│   │   ├── security.ts            # Helmet, CORS y trazabilidad (X-Request-Id)
│   │   └── validate.ts            # Validación de body y query con Zod
│   ├── validators/                # Esquemas Zod por dominio
│   ├── services/                  # Lógica de negocio desacoplada de Express
│   ├── controllers/               # Controladores HTTP ligeros
│   ├── routes/                    # Definición modular de rutas (/api/v1 y /api)
│   ├── utils/                     # Criptografía, logger seguro, respuestas y mailer
│   └── index.ts                   # Punto de entrada de la aplicación Express
└── tests/
    └── api.test.ts                # Suite de tests de integración y seguridad (Vitest + Supertest)
```

---

### 🚀 Instalación y Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y configura tu base de datos y secretos:
   ```bash
   cp .env.example .env
   ```

3. **Generar el cliente Prisma y sincronizar esquema con PostgreSQL:**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. **Iniciar en desarrollo:**
   ```bash
   npm run dev
   # Servidor listo en: http://localhost:3001
   ```

5. **Verificación de tipos y suite de pruebas:**
   ```bash
   npm run typecheck
   npm test
   ```

---

### 🔑 Ejemplos de Uso (cURL)

#### 1. Consultar catálogo de parques (con filtros y paginación en `/api/v1`)
```bash
curl -X GET "https://rc-manager-api.vercel.app/api/v1/parks?country=Espa%C3%B1a&page=1&limit=10"
```
**Respuesta (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PortAventura Park",
      "slug": "portaventura-park",
      "country": "España",
      "status": "OPEN"
    }
  ],
  "meta": {
    "timestamp": "2026-10-26T16:00:00.000Z",
    "count": 1
  }
}
```

#### 2. Iniciar sesión y generar una API Key
```bash
# 1) Obtener token JWT
curl -X POST "https://rc-manager-api.vercel.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"tu_usuario","password":"TuPasswordSegura123"}'

# 2) Crear una API Key con permisos de lectura de catálogo y credits
curl -X POST "https://rc-manager-api.vercel.app/api/v1/api-keys" \
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Script Estadísticas",
    "scopes": ["catalog:read", "records:read"],
    "expiresInDays": 90
  }'
```

#### 3. Consumir la API usando `X-API-Key`
```bash
curl -X GET "https://rc-manager-api.vercel.app/api/v1/me/credits" \
  -H "X-API-Key: rcm_live_a1b2c3d4e5f6..."
```

#### 4. Rotar o revocar una API Key
```bash
# Rotar clave (revoca la anterior atómicamente y genera una nueva)
curl -X POST "https://rc-manager-api.vercel.app/api/v1/api-keys/1/rotate" \
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"expiresInDays": 90}'

# Revocar clave permanentemente
curl -X DELETE "https://rc-manager-api.vercel.app/api/v1/api-keys/1" \
  -H "Authorization: Bearer <TU_JWT_TOKEN>"
```

---

## 🇬🇧 English

Hello! 👋 I'm **Christian**, a Full Stack Web Developer.

**RCManager API** is a robust, decoupled, and high-performance RESTful backend engineered to power the [RCManager](https://github.com/Chriiis85/RCManager) theme park & coaster tracking platform, while delivering secure public data access for external developers through an enterprise-grade **API Key** subsystem.

### ✨ Key Features

- 🔐 **Hybrid Authentication (JWT + 2FA + API Keys):**
  - Interactive user sessions via **JWT** + **2FA** support (TOTP via Google Authenticator/Authy and email OTP) + social auth via **Supabase OAuth**.
  - **API Keys (`rcm_live_...`)** for external clients: stored strictly via **SHA-256 cryptographic hashes**, evaluated with constant-time equality checks (`crypto.timingSafeEqual`), **granular scopes**, automatic expiration dates, atomic key rotation, and immediate revocation.
- 📦 **Clean & Backward-Compatible Versioning:**
  - Modern `/api/v1/*` routes with uniform envelope payloads (`{ success, data, meta }`).
  - Legacy `/api/*` compatibility layer for existing frontend clients.
- 🛡️ **Hardened Security Architecture:**
  - HTTP headers protected with `helmet`, tiered **Rate Limiting** based on endpoint criticality, schema validation via **Zod** (stopping mass assignment & SQL injection vectors), payload size restrictions (`100kb`), and sanitized logging that redacts sensitive secrets.
- 📖 **Interactive Documentation:**
  - Public web landing at `/` and fully featured **OpenAPI 3.0.3 / Swagger UI** playground at `/api/v1/docs` (JSON spec at `/api/v1/docs.json`).

### 🛠️ Tech Stack

- **Runtime & Framework:** Node.js (v20+), Express 4, TypeScript 5
- **Database & ORM:** PostgreSQL (via Supabase), Prisma ORM, pg Pool
- **Validation & Security:** Zod, Helmet, bcryptjs, crypto, express-rate-limit
- **Documentation:** OpenAPI 3.0.3, Swagger UI
- **Testing:** Vitest, Supertest
- **Deployment:** Vercel Serverless Functions

---

<div align="center">
  <sub>Desarrollado con dedicación por Christian Moreno Díaz · © RCManager API</sub>
</div>
