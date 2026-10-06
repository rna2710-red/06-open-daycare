# Open Daycare

Aplicación web para gestión de guarderías, construida con Next.js 16, Supabase y Tailwind CSS v4.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** estricto
- **Tailwind CSS v4** — configuración CSS-first (tokens en `app/globals.css`, no existe `tailwind.config.js`)
- **Supabase** — Postgres, Auth, Storage, Edge Functions, Realtime
- **Resend** — envío de emails transaccionales

## Prerrequisitos

- [Node.js](https://nodejs.org/) >= 18
- npm (viene incluido con Node.js)
- Cuenta en [Supabase](https://supabase.com/) con un proyecto creado

## Instalación

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repo>
   cd 06-open-daycare
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Copiar el archivo template y completar con los valores reales:

   ```bash
   cp .env.template .env
   ```

   Variables requeridas:

   | Variable | Descripción | Dónde obtenerla |
   |---|---|---|
   | `SUPABASE_DB_PASSWORD` | Contraseña del proyecto Supabase | Supabase Dashboard → Project Settings → Database |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase Dashboard → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key | Supabase Dashboard → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) | Supabase Dashboard → Project Settings → API |
   | `RESEND_API_KEY` | API key de Resend | [resend.com/api-keys](https://resend.com/api-keys) |
   | `RESEND_FROM` | Remitente de emails | Por defecto: `OpenDayCare <onboarding@resend.dev>` |
   | `APP_BASE_URL` | URL base de la app | `http://localhost:3000` en desarrollo |

4. **Levantar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción (incluye typecheck) |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linter con ESLint 9 (flat config) |

No hay framework de testing configurado. Para verificar cambios usar `npm run lint` + `npm run build`.

## MCP de Supabase

Este proyecto usa el [MCP de Supabase](https://supabase.com/docs/guides/getting-started/mcp) para interactuar con la base de datos, Auth, Edge Functions y más, directamente desde el agente de código.

### Autenticación del equipo

El MCP remoto de Supabase requiere autenticación. Cada miembro del equipo debe hacer login por separado:

1. **Instalar el CLI de Supabase** (si no lo tienen)

   ```bash
   npm install -g supabase
   ```

2. **Hacer login en Supabase**

   ```bash
   supabase login
   ```

   Esto abre el navegador para autenticarse con tu cuenta de Supabase. Una vez autenticado, el CLI almacena el token de acceso localmente.

3. **Vincular el proyecto** (para migraciones y gestión local)

   ```bash
   supabase link --project-ref bkkuthaqnbxnfvmzwdbq
   ```

   Se pedirá la contraseña de la base de datos (`SUPABASE_DB_PASSWORD` en tu `.env`).

### Configuración del MCP en OpenCode

El MCP de Supabase se configura como servidor remoto en `opencode.json` (raíz del proyecto). La autenticación se gestiona vía OAuth en el navegador al primer uso.

Validar que `opencode.json` contenga la siguiente configuración:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=bkkuthaqnbxnfvmzwdbq&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
      "enabled": true
    }
  }
}
```

- `project_ref`: identificador del proyecto Supabase (`bkkuthaqnbxnfvmzwdbq`)
- `features`: módulos habilitados del MCP (docs, account, database, debugging, development, functions, branching)

### Migraciones de base de datos

Las migraciones viven en `supabase/migrations/` con el formato `YYYYMMDDHHMMSS_descriptive_name.sql`. Se aplican usando el MCP (`supabase_apply_migration`). Ver `AGENTS.md` para las reglas completas de migración.

## Estructura del proyecto

```
├── app/                    # App Router (páginas, layouts, route handlers)
│   ├── globals.css         # Tailwind v4 config + tokens de tema
│   └── page.tsx            # Página principal (boilerplate)
├── lib/                    # Utilidades compartidas
├── utils/
│   └── supabase/           # Clientes de Supabase (server, client, middleware)
├── references/             # Mockups HTML y screenshots del producto
├── specs/                  # Especificaciones de features
├── supabase/
│   └── migrations/         # Migraciones SQL de la base de datos
├── public/                 # Assets estáticos
├── opencode.json           # Configuración de OpenCode (MCPs, agentes)
├── AGENTS.md               # Reglas y convenciones del proyecto
├── eslint.config.mjs       # ESLint 9 flat config
└── package.json
```

## Documentación de referencia

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- Mockups del producto en `references/pantallas/`
