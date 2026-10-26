# RCManager API — Theme Parks & Coaster Credits RESTful Backend

[Ver en Español](#-español) | [View in English](#-english)

**API en vivo & Docs:** [https://rc-manager-api.vercel.app](https://rc-manager-api.vercel.app) · **Frontend:** [https://rcmanager-nine.vercel.app](https://rcmanager-nine.vercel.app)

---

## 🇪🇸 Español

¡Hola! 👋 Soy **Christian**, desarrollador Web Full Stack.

**RCManager API** es el backend RESTful que da soporte a [RCManager](https://github.com/Chriiis85/RCManager) (gestión de parques temáticos, montañas rusas, *credits* y viajes). Está diseñado de forma desacoplada para servir tanto a la aplicación web como a desarrolladores y scripts externos que quieran consultar datos mediante **API Keys**.

### Características principales

- **Autenticación híbrida (JWT + 2FA + API Keys):**
  - Sesiones de usuario interactivas con **JWT**, soporte de **2FA** (TOTP con Google Authenticator/Authy y código OTP por email) y autenticación social mediante **Supabase OAuth**.
  - **API Keys (`rcm_live_...`)** para integraciones externas: almacenadas en base de datos únicamente mediante su **hash SHA-256**, validadas en tiempo constante (`crypto.timingSafeEqual`), con **permisos granulares** (`catalog:read`, `records:read`), fecha de expiración y rotación inmediata.
- **Versionado retrocompatible:**
  - Rutas `/api/v1/*`: respuestas tipadas con formato estándar (`{ success, data, meta }`).
  - Rutas `/api/*`: capa de compatibilidad para clientes existentes.
- **Seguridad y validación:**
  - Cabeceras HTTP protegidas con `helmet`, limitadores de tasa (**Rate Limiting**) por tipo de endpoint (global, login y 2FA), validación estricta de datos de entrada con **Zod**, límite de tamaño de petición a 100kb y logs sanitizados que omiten contraseñas y tokens.
- **Documentación interactiva:**
  - Landing con consola en `/` y especificación **OpenAPI 3.0 / Swagger UI** en `/api/v1/docs` para probar los endpoints directamente desde el navegador.

---

### Estructura del proyecto

```text
RCManagerAPI/
├── prisma/
│   └── schema.prisma              # Esquema PostgreSQL + modelo ApiKey
├── public/
│   └── index.html                 # Consola interactiva y documentación
├── src/
│   ├── config/                    # Variables de entorno, Prisma Client y OpenAPI
│   ├── middlewares/               # Auth (JWT/API Keys), Rate Limiting, Helmet y Zod
│   ├── validators/                # Esquemas de validación Zod por recurso
│   ├── services/                  # Lógica de negocio desacoplada
│   ├── controllers/               # Controladores HTTP
│   ├── routes/                    # Definición de rutas (/api/v1 y /api)
│   ├── utils/                     # Hashing, logger, respuestas y nodemailer
│   └── index.ts                   # Entrada de la aplicación Express
└── tests/
    └── api.test.ts                # Tests de integración con Vitest y Supertest
```

---

### Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar el cliente de Prisma y sincronizar con PostgreSQL
npm run prisma:generate
npm run prisma:push

# 4. Iniciar en desarrollo
npm run dev
# Servidor listo en: http://localhost:3001

# 5. Ejecutar tests
npm test
```

---

### Ejemplos de uso con cURL

#### 1. Consultar el catálogo de parques
```bash
curl -X GET "https://rc-manager-api.vercel.app/api/v1/parks?country=Espa%C3%B1a&page=1&limit=10"
```

#### 2. Iniciar sesión y generar una API Key
```bash
# 1) Obtener token JWT de sesión
curl -X POST "https://rc-manager-api.vercel.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"tu_usuario","password":"TuPasswordSegura123"}'

# 2) Generar una API Key con permisos de lectura
curl -X POST "https://rc-manager-api.vercel.app/api/v1/api-keys" \
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Script",
    "scopes": ["catalog:read", "records:read"],
    "expiresInDays": 90
  }'
```

#### 3. Consultar datos con la API Key generada
```bash
curl -X GET "https://rc-manager-api.vercel.app/api/v1/me/credits" \
  -H "X-API-Key: rcm_live_a1b2c3d4e5f6..."
```

---

## 🇬🇧 English

Hello! 👋 I'm **Christian**, a Full Stack Web Developer.

**RCManager API** is the RESTful backend supporting [RCManager](https://github.com/Chriiis85/RCManager). It is decoupled from the frontend, designed to serve both the web application and external developers needing programmatic access to theme park and coaster data via **API Keys**.

### Key Features

- **Hybrid Authentication (JWT + 2FA + API Keys):**
  - Web sessions using **JWT**, **2FA** support (TOTP via Google Authenticator/Authy and email OTP), and social logins via **Supabase OAuth**.
  - **API Keys (`rcm_live_...`)** for integrations: hashed using **SHA-256**, evaluated with constant-time equality checks (`crypto.timingSafeEqual`), **granular scopes**, automatic expiration, and immediate revocation.
- **Clean Versioning:**
  - Modern `/api/v1/*` routes returning uniform responses (`{ success, data, meta }`).
  - `/api/*` compatibility layer for existing clients.
- **Security & Validation:**
  - `helmet` headers, tiered rate limiting, schema validation via **Zod**, 100kb payload caps, and sanitized logs.
- **Interactive Documentation:**
  - Public console at `/` and **Swagger UI** playground at `/api/v1/docs`.

### Tech Stack

- **Runtime & Framework:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL (via Supabase), Prisma ORM
- **Security & Validation:** Zod, Helmet, bcryptjs, crypto, express-rate-limit
- **Documentation:** OpenAPI 3.0, Swagger UI
- **Testing:** Vitest, Supertest
- **Hosting:** Vercel

---

<div align="center">
  <sub>Christian Moreno Díaz · RCManager API</sub>
</div>
