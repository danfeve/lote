This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Control de calidad por lotes

Aplicación web para registrar lotes de producción, inspeccionar muestras y consultar decisiones de calidad con reglas consistentes.

## Requisitos

- Node.js 24 LTS (el proyecto también requiere Node.js 20.9 o posterior).
- Una base PostgreSQL de Supabase con acceso mediante la cadena Transaction pooler.
- Configuración local de una cuenta única de inspector.

## Preparación

1. Copie `.env.example` a `.env.local`.
2. Configure `DATABASE_URL` con la cadena Transaction pooler de Supabase (puerto 6543).
3. Configure `AUTH_EMAIL`, `AUTH_PASSWORD`, `AUTH_NOMBRE` y `AUTH_SECRET`. Use una clave secreta aleatoria de al menos 32 caracteres para `AUTH_SECRET`.
4. Aplique las migraciones y compruebe el esquema:

```bash
npm run db:migrar
npm run db:verificar
```

5. Inicie la aplicación con `npm run dev` y abra `http://localhost:3000/login`.

## Comandos

- `npm run dev`: servidor local.
- `npm run build`: compilación de producción.
- `npm run lint`: ESLint.
- `npm test`: pruebas unitarias de las reglas.
- `npm run db:migrar`: aplica las migraciones pendientes en orden y dentro de transacciones.
- `npm run db:verificar`: verifica tablas, vista y RLS.

## Alcance implementado

El módulo mínimo incluye reglas puras T-01 a T-35, autenticación de un usuario, proveedores, lotes, inspecciones, historial, bandeja y API protegida. Las inspecciones son inmutables y el registro actualiza el lote dentro de una transacción.

La aplicación se inició desde un repositorio vacío. El login que el plan suponía existente se implementó mediante variables de entorno y una cookie JWT firmada. No hay credenciales en el repositorio.

## Despliegue

En Vercel configure `DATABASE_URL`, `AUTH_EMAIL`, `AUTH_PASSWORD`, `AUTH_NOMBRE` y `AUTH_SECRET` en Production, Preview y Development. Aplique las migraciones a Supabase antes de probar la aplicación. La aceptación A-01 a A-21 debe diligenciarse después del despliegue.
