# Fase 2 · Reglas

- Se centralizaron los umbrales en `lib/config/calidad.ts`.
- Las reglas puras se implementaron bajo `lib/reglas/` sin dependencias de PostgreSQL, Next.js ni variables de entorno.
- T-01 a T-35 pasan en Vitest.
- Las decisiones comparan cantidades enteras; los porcentajes decimales solo se formatean para mostrarlos.