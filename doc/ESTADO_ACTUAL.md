# Estado actual

## Punto de partida

- El repositorio remoto clonado no tenía commits ni archivos de aplicación.
- No existían login, conexión PostgreSQL, migraciones ni tablas Supabase.
- Se inició la aplicación desde cero con Next.js App Router, TypeScript y Tailwind CSS, sin directorio `src/`.
- El proyecto utiliza Next.js 16; las rutas protegidas se aplican con `proxy.ts`.

## Decisiones tomadas

- El módulo agrega un inicio de sesión de un usuario por variables de entorno porque el login que el plan suponía existente no estaba en el repositorio.
- La contraseña y el secreto de firma solo viven en `.env.local`/Vercel; `.env*` se ignora en Git.
- La base de datos usa `pg`, SQL parametrizado y las migraciones en `supabase/migrations/`.
- No se ha configurado ni aplicado una conexión real a Supabase.

## Variables necesarias

`DATABASE_URL`, `AUTH_EMAIL`, `AUTH_PASSWORD`, `AUTH_NOMBRE` y `AUTH_SECRET`. Consulte `.env.example` y `README.md`.