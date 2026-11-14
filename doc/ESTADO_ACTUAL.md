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
- Las migraciones M1 y M2 ya se aplicaron y verificaron en Supabase; RLS está activo en las tres tablas.
- En local, `DATABASE_URL` apunta a la conexión directa `POSTGRES_URL_NON_POOLING` porque el pooler `POSTGRES_URL` no completó el handshake desde esta red. La app y los scripts también aceptan `POSTGRES_URL`, que es la opción de pooler recomendada para Vercel.
- El proveedor de prueba solicitado, `Santiago`, quedó registrado.

## Variables necesarias

`DATABASE_URL` o `POSTGRES_URL`, `AUTH_EMAIL`, `AUTH_PASSWORD`, `AUTH_NOMBRE` y `AUTH_SECRET`. Consulte `.env.example` y `README.md`. Los valores reales se mantienen en `.env.local`, fuera de Git.