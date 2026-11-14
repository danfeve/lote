# Control de Calidad por Lotes · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_CONTROL_CALIDAD.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: dos caminos. Si ya tienes el proyecto Next.js desplegado en Vercel, con Supabase conectado y login funcionando, empieza en **P00**. Si partes de cero (no hay proyecto todavía), empieza en **P-INIT**, que levanta toda la infraestructura, y luego sigue con P00.

---

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_CONTROL_CALIDAD.md` y `PROMPTS_CONTROL_CALIDAD.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt:
   - Revisar los cambios propuestos y aceptarlos (**Keep**).
   - Hacer la verificación indicada en "Verificación del estudiante".
   - Hacer commit con el mensaje sugerido y `git push`. Vercel desplegará automáticamente; si el despliegue falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final de este archivo.

| Fase | Prompts |
|---|---|
| Fundación (solo si partes de cero) | P-INIT |
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 6 · Aceptación | P09 |
| 7 · Opcional | P10 |

---

## P-INIT · Fundación: crear el proyecto, Supabase, login y despliegue (solo si partes de cero)

**Fase:** fundación · **Crea:** el proyecto Next.js completo con login y conexión a Supabase · **Omitir si:** ya tienes el proyecto desplegado en Vercel con Supabase y login (en ese caso empieza en P00).

> Este prompt levanta la infraestructura que los demás prompts dan por hecha. Hay pasos que Copilot no puede hacer por ti (crear la cuenta de Supabase, la de Vercel, y copiar las claves): el prompt te los indica y espera a que los hagas. Al terminar, tendrás el mismo punto de partida que asume P00.

Antes de pegar el prompt, ten listo:
- Node.js 20 o superior instalado y una cuenta de GitHub.
- Una cuenta en Supabase (supabase.com) y otra en Vercel (vercel.com), ambas gratuitas.

````text
Actúa como ingeniero de software senior trabajando en modo agente. Vamos a crear desde cero el proyecto "Control de Calidad por Lotes" sobre el stack del curso: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres, con despliegue en Vercel y un login. El plan técnico está en doc/PLAN_CONTROL_CALIDAD.md; léelo (secciones 1, 9 y 10) para conocer el stack y las convenciones. NO implementes todavía las funcionalidades del dominio (lotes, inspecciones): este prompt solo deja la base lista.

Trabaja en pasos y, cuando un paso dependa de algo que yo deba hacer a mano (crear una cuenta, copiar una clave), detente, dime exactamente qué hacer y espera mi confirmación antes de seguir.

PASO 1. Crea el proyecto Next.js con TypeScript, Tailwind y App Router en la carpeta actual (si ya hay un package.json, detente y avísame; quizá no partes de cero y debes usar P00). Usa create-next-app con TypeScript, ESLint, Tailwind, carpeta app y alias de importación "@/*". Instala las dependencias.

PASO 2. Agrega las dependencias del proyecto: pg y @types/pg (acceso a Postgres), zod (validación) y vitest con su configuración de pruebas. Crea vitest.config.ts (environment node, include ['tests/**/*.test.ts'], alias "@"). Agrega a package.json los scripts: "test": "vitest run", "test:ver": "vitest", "type-check": "tsc --noEmit".

PASO 3. Verifica que el proyecto compila: ejecuta npm run build. Si falla, corrige lo mínimo para que compile (es un proyecto recién creado) y vuelve a intentar.

PASO 4. Detente y dame estas instrucciones para crear la base de datos, y espera mi confirmación:
- Entrar a supabase.com, crear un proyecto nuevo (elegir la región más cercana y guardar la contraseña de la base de datos).
- En el proyecto de Supabase, botón "Connect": copiar la cadena de conexión "Transaction pooler" (puerto 6543) y reemplazar [YOUR-PASSWORD] por la contraseña de la base.
- Crear un archivo .env.local en la raíz con esa cadena como DATABASE_URL=... (y, si el login la necesita, las claves públicas de Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, que están en Settings → API).
Confírmame cuando .env.local tenga la conexión. Recuérdame que .env.local NUNCA se sube a git.

PASO 5. Cuando confirme, crea o verifica que .gitignore excluye .env*. Crea lib/db/conexion.ts con un Pool de pg que lea DATABASE_URL (ssl rejectUnauthorized:false; max 3; reutilizar el pool en desarrollo con globalThis; parsers para que DATE y TIMESTAMP se lean como texto y BIGINT como número), tal como describe la sección 10.7 del plan. Escribe un script temporal o una ruta de prueba que haga un SELECT 1 y pídeme ejecutarlo para confirmar que la conexión funciona; cuando confirme, elimínalo.

PASO 6. Login: implementa un login mínimo como puerta de acceso (no roles). La forma más simple y segura que encaje con la versión de Next del proyecto: una página /login con una contraseña de acceso del personal guardada como variable de entorno (CLAVE_ACCESO en .env.local), que al validarla fija una cookie de sesión firmada (puedes usar un secreto COOKIE_SECRET en .env.local); y un archivo de protección de rutas (proxy.ts en Next 16, o middleware.ts en versiones anteriores) que proteja todo salvo /login y los recursos públicos. Crea también lib/auth/sesion.ts con obtenerSesion() y exigirSesion(). Documenta en un comentario qué variables de entorno agregó (CLAVE_ACCESO, COOKIE_SECRET) y dime que las ponga en .env.local y luego en Vercel.

PASO 7. Deja una página de inicio protegida mínima (por ejemplo, app/page.tsx que, con sesión, muestre "Control de Calidad por Lotes" y un enlace a cerrar sesión; sin sesión, redirija a /login). Esto confirma que el login y la protección funcionan; las pantallas reales se crean en los prompts P06 en adelante.

PASO 8. Verifica localmente: npm run build sin errores; npm run dev y comprobar que sin sesión / redirige a /login y que con la clave correcta entra. Pídeme que lo pruebe y espera mi confirmación.

PASO 9. Detente y dame estas instrucciones para desplegar, y espera mi confirmación:
- Subir el proyecto a un repositorio de GitHub nuevo (git init, primer commit, push).
- En vercel.com, "Add New Project", importar ese repositorio.
- En la configuración del proyecto en Vercel, agregar las variables de entorno (DATABASE_URL, CLAVE_ACCESO, COOKIE_SECRET y las de Supabase si se usan) para Production, Preview y Development.
- Desplegar y abrir la URL; comprobar que pide la clave y entra.
Si el despliegue falla, usa el prompt de "Despliegue fallido en Vercel" del final de este archivo.

AL TERMINAR:
- Crea doc/ (si no existe) y copia allí los dos documentos del proyecto si aún no están.
- Confírmame que ya existe: proyecto Next que compila, conexión a Postgres probada, login funcionando en local y en Vercel.
- Dime que el siguiente paso es ejecutar P00 (auditoría) en una conversación nueva, que a partir de aquí encontrará el proyecto ya montado.

RESTRICCIONES: no implementes lotes, inspecciones ni reglas del dominio todavía (eso es de P01 en adelante). No subas .env.local a git. No inventes claves: cuando una variable deba tener un valor real (contraseña de la base, secreto de cookie), pídemela o indícame cómo generarla.
````

**Verificación del estudiante:** al terminar P-INIT debes tener la app en una URL de Vercel que pide la clave de acceso y, al entrar, muestra la página de inicio. Ese es el punto de partida que asume P00. Guarda en un lugar seguro la contraseña de la base de datos, la clave de acceso y el secreto de cookie.

**Commit sugerido:** `chore: fundación del proyecto (Next, Supabase, login y despliegue)`

> A partir de aquí, el punto de partida es el mismo tengas o no hayas hecho P-INIT: un proyecto Next desplegado en Vercel, con Supabase conectado y login funcionando. Continúa con P00.

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "Control de Calidad por Lotes" ya está desplegado en Vercel, conectado a Supabase y tiene login funcionando. El plan técnico está en doc/PLAN_CONTROL_CALIDAD.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control que usarán los prompts siguientes.

Lee completo doc/PLAN_CONTROL_CALIDAD.md, en especial las secciones 0, 1, 2.3, 8 y 15.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres en el repositorio. No supongas: si algo no existe, escribe "No existe".
1. Versiones (desde package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, jose, bcryptjs, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si el proyecto usa carpeta src/.
4. Alias de importación definidos en tsconfig.json.
5. Autenticación: archivos involucrados; mecanismo (JWT propio en cookie, Supabase Auth u otro); nombre de la cookie; función que lee la sesión y qué devuelve; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión; tabla de usuarios y roles, si existen.
6. Acceso a datos: clientes de Supabase existentes (archivos), uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control (_migrations u otra), script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (nunca copies valores). Indica explícitamente si existe DATABASE_URL.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/calidad, app/api/calidad, lib/dataService.ts y components/ui; contenido actual de app/page.tsx (plantilla de Next.js o contenido propio); tablas existentes llamadas proveedores, lotes o inspecciones.
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas a usar (proxy.ts en Next.js 16, middleware.ts en versiones anteriores) y si ya existe.
    - Mecanismo de migraciones a usar (el existente o scripts/migrar.mjs).
    - Nombres exactos que tendrán M1 y M2 continuando la numeración existente (sección 7 del plan).
    - Prefijo de imports para lib (por ejemplo @/lib o @/src/lib).
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md con el contenido siguiente. Reemplaza únicamente las partes marcadas [AJUSTAR] con lo encontrado en la TAREA 1:

```markdown
# Control de Calidad por Lotes · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_CONTROL_CALIDAD.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable DATABASE_URL.
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR: mecanismo y archivos principales]. No se reescribe. Un solo usuario, sin roles.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Comentarios breves, solo donde aclaran una regla.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin variables de entorno y sin leer el reloj (excepto ahoraBogota y hoyBogota en fechas.ts).
- Las decisiones de calidad se calculan con aritmética entera (defectuosas * 100 comparado con umbral * muestreadas). Nunca se decide con un porcentaje con decimales.
- Los valores de las reglas solo se leen de lib/config/calidad.ts.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/calidad/ llama await exigirUsuario() como primera instrucción.
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- El código del lote se normaliza con normalizarCodigo antes de buscar o guardar.
- Fechas 'YYYY-MM-DD' como texto entre capas. Zona horaria America/Bogota.
- En rutas dinámicas params es una Promise: const { codigo } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- Las inspecciones no se editan ni se eliminan.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR: proxy.ts o middleware.ts].
- Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa los cambios y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md con esta plantilla:

```markdown
# Estado de ejecución · Control de Calidad por Lotes

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base, bandeja y proveedores | pendiente | | | |
| P07 Lotes: registro, historial y detalle | pendiente | | | |
| P08 Inspección y resultado | pendiente | | | |
| P09 Aceptación | pendiente | | | |
| P10 Opcional: alerta por proveedor | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas encontrados y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego ejecuta npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si la compilación falla, NO corrijas nada: describe el error.

TAREA 5. Si la cadena de conexión a Postgres no existe en .env.local, explícame al final, en lenguaje sencillo, el flujo para tenerla. El camino normal es bajarla desde Vercel, no copiarla a mano desde Supabase:
- `vercel link` para vincular la carpeta al proyecto de Vercel, y luego `vercel env pull .env.local`, que baja a .env.local las variables ya configuradas en Vercel.
- La integración Supabase-Vercel suele dejar varias: POSTGRES_URL y POSTGRES_PRISMA_URL (pooler, puerto 6543) y POSTGRES_URL_NON_POOLING (puerto 5432). Para `pg` en serverless se usa la del pooler (6543). Indícame cuál de las descargadas es y con qué nombre; lib/db/conexion.ts leerá esa (si el proyecto espera DATABASE_URL, puede mapearse a la del pooler).
- Solo si en Vercel tampoco está: en Supabase, botón "Connect", "Transaction pooler" (puerto 6543), reemplazar [YOUR-PASSWORD], agregarla en Vercel (Settings, Environment Variables) para Production, Preview y Development, y volver a hacer `vercel env pull`.
Indica que no se debe continuar con P01 hasta tenerla.

RESTRICCIONES: no modifiques ningún archivo de código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, existencia de DATABASE_URL, mecanismo de login detectado y las decisiones derivadas.
- En ESTADO_EJECUCION.md marca P00 como completado y agrega su sección en la bitácora.
- Muéstrame un resumen breve de lo encontrado y cualquier riesgo para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe el login real y que la sección 8 dice si existe `DATABASE_URL`. Si no existe, agregarla antes de P01.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** dos migraciones, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 7 y 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar las dos migraciones del módulo y dejar un script que demuestre que la base de datos protege las reglas.

TAREA 1. Crea en supabase/migrations/ dos archivos con los nombres definidos en la sección 12 de ESTADO_ACTUAL.md:
- Migración M1 (tablas) con el SQL exacto de la sección 7.2 del plan.
- Migración M2 (vista y seguridad) con el SQL exacto de la sección 7.3.
No cambies nombres de tablas, columnas ni restricciones: el código posterior depende de ellos (sección 7.4).

TAREA 2. Aplica las migraciones:
- Si ESTADO_ACTUAL.md indica un mecanismo de migraciones existente, úsalo y explica en la bitácora cómo lo ejecutaste.
- Si no existe:
  a) Instala pg y @types/pg si faltan.
  b) Crea scripts/migrar.mjs que: lea DATABASE_URL de process.env; se conecte con ssl { rejectUnauthorized: false }; cree la tabla _migrations (id serial primary key, archivo text unique not null, aplicada_en timestamptz default now()) si no existe; recorra supabase/migrations/*.sql en orden alfabético; aplique dentro de una transacción cada archivo no registrado y lo registre; imprima "aplicada: archivo" u "omitida: archivo"; termine con código 1 si algo falla.
  c) Si hay migraciones anteriores del login que ya se aplicaron por otro medio (las tablas ya existen), regístralas en _migrations sin ejecutarlas, antes de aplicar las nuevas, y explícalo en la bitácora.
  d) Agrega a package.json el script "db:migrar": "node --env-file=.env.local scripts/migrar.mjs" y ejecútalo.

TAREA 3. Crea scripts/verificar-bd.mjs y el script "db:verificar": "node --env-file=.env.local scripts/verificar-bd.mjs". Debe imprimir:
1. Existencia (sí/no) de proveedores, lotes, inspecciones y de la vista v_lotes.
2. Número de filas de cada tabla.
3. Restricciones de lotes e inspecciones (pg_constraint) e índices únicos (pg_indexes).
4. Si RLS está activo en las tres tablas (pg_class.relrowsecurity).
5. Pruebas de integridad dentro de UNA transacción que SIEMPRE termina en ROLLBACK, usando un SAVEPOINT antes de cada caso que debe fallar:
   a) Insertar proveedor "Verificación BD" y lote 'VERIF-001' (200 piezas, muestra mínima 20, estado pendiente).
   b) Insertar lote con código 'verif-002' en minúsculas: debe fallar con 23514.
   c) Inspección número 1 con 20 muestreadas y 21 defectuosas: debe fallar con 23514.
   d) Inspección número 1 con 20 muestreadas, 2 defectuosas y 3 críticas: debe fallar con 23514.
   e) Inspección número 1 válida (200 muestreadas, 6 defectuosas, 0 críticas, resultado 'en_revision', regla 'R4'): debe funcionar y su porcentaje_defectuoso debe ser 3.00.
   f) Otra inspección número 1 del mismo lote: debe fallar con 23505.
   g) Inspección número 2 con resultado 'en_revision': debe fallar con 23514.
   h) Actualizar el lote a estado 'aprobado' sin fecha_decision: debe fallar con 23514.
   i) Inspección número 3: debe fallar con 23514.
   Para cada caso imprime "OK    caso: descripción" o "FALLA caso: descripción · detalle".
6. Al final, el total de fallas; termina con código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida completa de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, sección Table Editor, deben aparecer `proveedores`, `lotes` e `inspecciones`. La salida de `npm run db:verificar` no debe tener ninguna línea con FALLA.

**Commit sugerido:** `feat(bd): tablas, vista del historial y restricciones de calidad`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/calidad.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 4, 5, 8.3, 8.4, 8.5, 9.2, 12 y 14.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas de calidad como funciones puras y probarlas con Vitest. Este es el núcleo lógico del proyecto: cada regla del plan funcional queda en una función que se prueba con números, sin base de datos.

TAREA 1. Instala vitest como dependencia de desarrollo. Agrega a package.json "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el mismo alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/calidad.ts con el contenido exacto de la sección 8.4.

TAREA 3. Crea los archivos de lib/reglas/ con las firmas exactas de la sección 8.5:
- errores.ts: tipo CodigoError; MENSAJES y ESTADO_HTTP con los valores de la tabla 9.2; clase ErrorDeNegocio (name = 'ErrorDeNegocio'; si no recibe mensaje usa MENSAJES[codigo] reemplazando {clave} por los valores de detalles).
- fechas.ts: ahoraBogota y hoyBogota con Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) y formatToParts; sumarDias y diasEntre con Date.UTC (sección 12).
- muestra.ts: calcularMuestraMinima con aritmética entera, exactamente como la sección 5.3 (Math.ceil((cantidad * PORCENTAJE_MUESTRA) / 100), nunca cantidad * 0.1); si la cantidad es menor que MUESTRA_MINIMA_PIEZAS devuelve la cantidad; si no, el mayor entre MUESTRA_MINIMA_PIEZAS y el 10 %. explicarMuestraMinima con los textos de la sección 8.5 (decimales con coma).
- inspeccion.ts: validarLoteAdmiteInspeccion (pendiente → 1; en_revision → 2; aprobado o rechazado → LOTE_CERRADO). validarInspeccion en el orden de la sección 8.5; los errores MUESTRA_INSUFICIENTE y MUESTRA_EXCEDE_LOTE llevan detalles { muestraMinima } y { cantidad }.
- decision.ts: ETIQUETA_ESTADO (4.2); DESCRIPCION_REGLA ("Regla 2 · Defecto crítico", "Regla 3 · Aprobación", "Regla 4 · Zona de revisión", "Regla 5 · Segunda inspección", "Regla 6 · Rechazo por porcentaje"); calcularPorcentaje (redondeo a 2 decimales, solo para mostrar); clasificarPorcentaje con las comparaciones enteras de la sección 5.3; decidirResultado en el orden de la sección 8.5 con las explicaciones de la sección 5.4 (porcentajes con dos decimales y coma); accionesPermitidas según la tabla 4.3.
- lote.ts: normalizarCodigo y validarFechaProduccion (FECHA_FUTURA si la fecha es posterior a hoy; se comparan textos YYYY-MM-DD).

Ningún archivo de lib/reglas/ importa pg, next ni process.env, ni llama new Date() (la única excepción es el valor por defecto del parámetro de ahoraBogota y hoyBogota). Ninguna decisión usa calcularPorcentaje.

TAREA 4. Crea tests/reglas/ayudas.ts con una función esperarCodigo(fn, codigo) que ejecute fn, capture el error y verifique que sea ErrorDeNegocio con ese código (falla si no se lanzó error).

TAREA 5. Crea las pruebas en tests/reglas/ (configuracion, muestra, inspeccion, decision y lote) cubriendo TODAS las filas T-01 a T-35 de la sección 14.1. Cada caso lleva el ID en su nombre, por ejemplo: it('T-19 3,00 % exacto en la primera inspección queda en revisión', ...). T-29 recorre todos los tamaños de muestra indicados dentro de la misma prueba.

TAREA 6. Ejecuta npm test hasta que las 35 pruebas pasen. Si una prueba falla, corrige la regla, no la prueba, salvo que la prueba contradiga el plan; en ese caso explícalo en la bitácora.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test (número de pruebas y archivos).
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ejecutar `npm test`. Deben pasar 35 pruebas. Abrir `lib/reglas/decision.ts` y ubicar el orden de las reglas 2 a 6 dentro de `decidirResultado`.

**Commit sugerido:** `feat(reglas): reglas de calidad puras con 35 pruebas unitarias`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión del usuario, respuestas HTTP, esquemas, formato y `/api/calidad/sesion` · **Modifica:** archivo de protección de rutas y la redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 1.3, 3, 7.4, 8.1, 8.3, 8.7, 9.1, 9.2, 9.4, 11 y 13), doc/ESTADO_ACTUAL.md (en especial la sección 5, Autenticación) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura que usarán todas las rutas: conexión a Postgres con transacciones, sesión del usuario, formato de respuestas, esquemas de validación y utilidades de formato.

TAREA 1. lib/db/conexion.ts exactamente como la sección 8.7, implementando consultar (pool.query y devolver rows) y conTransaccion (BEGIN, trabajo, COMMIT; ROLLBACK y relanzar en error; release siempre). Si ESTADO_ACTUAL.md reporta un pool de pg existente, no lo dupliques: reutilízalo agregando los parsers de tipo y explícalo en la bitácora.

TAREA 2. lib/auth/sesionUsuario.ts:
- obtenerUsuario(): Promise<{ id: string; nombre: string; correo: string } | null>, usando el mecanismo de sesión del login existente descrito en ESTADO_ACTUAL.md. Cualquier usuario autenticado puede usar el sistema (no hay roles).
- exigirUsuario(): igual que obtenerUsuario, pero lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión válida.
- Solo importa funciones del login; no modifica sus archivos.

TAREA 3. Protección de rutas. En el archivo de protección indicado en ESTADO_ACTUAL.md (proxy.ts o middleware.ts) agrega /calidad/:path* y /api/calidad/:path* al matcher, conservando lo que ya protege. Sin sesión: las páginas redirigen a la ruta del login y las rutas /api/calidad responden 401 con el formato de la sección 9.1. Si el archivo no existe, créalo con esa única responsabilidad usando una verificación de sesión compatible con su runtime. Si la verificación no es posible en ese archivo, deja la protección en el layout de /calidad (P06) y en exigirUsuario(), y anótalo en la bitácora.

TAREA 4. Cambia SOLO el destino de la redirección posterior al login para que sea /calidad (archivo y línea indicados en ESTADO_ACTUAL.md). Si la ruta anterior la usan otras partes del proyecto, déjala funcionando.

TAREA 5. lib/http/respuestas.ts:
- responderOk(datos, estado = 200): { ok: true, datos }.
- responderError(error: unknown):
  · ErrorDeNegocio: estado ESTADO_HTTP[codigo] y { ok: false, error: { codigo, mensaje, detalles } }.
  · ZodError: 400 DATOS_INVALIDOS con detalles = error.flatten().
  · Error de pg con code 23505, 23503 o 23514: traducir con la tabla de la sección 7.4 usando error.constraint.
  · Cualquier otro: console.error con el error completo y 500 ERROR_INTERNO sin detalles.
- conManejoDeErrores(handler): envuelve un route handler con try/catch y responderError.
- leerCuerpo(request, esquema): request.json() (si falla, DATOS_INVALIDOS) y esquema.parse.
- Todas las respuestas llevan el header Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con todos los esquemas de la sección 9.4, exportando también sus tipos (z.infer). Mensajes de validación en español. Este archivo se usa en el servidor y en los formularios del navegador, así que no importa nada del servidor.

TAREA 7. lib/formato.ts:
- formatearPorcentaje(3.333) → "3,33 %"; formatearPorcentaje(3) → "3,00 %".
- formatearFraccion(6, 200) → "6 de 200".
- formatearInspeccion(6, 200, 3) → "6 de 200 · 3,00 %".
- formatearFecha('2026-08-15') → fecha media en español (Intl con timeZone 'UTC').
- formatearEntero(1100) → "1.100".

TAREA 8. app/api/calidad/sesion/route.ts: GET envuelto en conManejoDeErrores; primera instrucción await exigirUsuario(); responde { nombre, correo }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Luego inicia npm run dev y comprueba GET /api/calidad/sesion sin sesión (debe dar 401). Si no puedes iniciar sesión tú mismo, pídeme que inicie sesión en el navegador y abra http://localhost:3000/api/calidad/sesion, y espera mi confirmación de que responde 200 con el nombre. Comprueba también que el login sigue funcionando y que ahora redirige a /calidad (puede mostrar 404 hasta P06).

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados de la verificación.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora (incluye el diff resumido de los archivos del login o de protección que tocaste).
- Muéstrame un resumen.
````

**Verificación del estudiante:** iniciar sesión en el navegador: debe llevar a `/calidad` (por ahora una página 404). Abrir `http://localhost:3000/api/calidad/sesion` con sesión: debe mostrar el nombre. En una ventana privada debe mostrar el error 401.

**Commit sugerido:** `feat(servidor): conexión con transacciones, sesión y utilidades de API`

---

## P04 · Datos: proveedores, lotes e inspecciones

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 2.4, 4, 5, 6, 7.4, 8.5, 8.6, 12 y 14.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa también lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso, y comprobar el flujo completo contra la base de datos real.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 8.6 (DatosLote, DatosInspeccion, FilaProveedor, FilaLote, DetalleLote, ResultadoRegistroInspeccion). Reutiliza los tipos de lib/reglas y de lib/validacion en lugar de duplicarlos.

TAREA 2. lib/datos/proveedores.ts:
- listarProveedores({ incluirInactivos }): orden por nombre; incluye totalLotes (COUNT de lotes).
- crearProveedor(nombre): inserta el nombre recortado; el duplicado se traduce por ux_proveedores_nombre.
- actualizarProveedor(id, cambios): actualiza nombre y/o activo; si no existe, PROVEEDOR_NO_ENCONTRADO.
- obtenerProveedorActivo(tx, id) (interna): si no existe, PROVEEDOR_NO_ENCONTRADO; si está inactivo, PROVEEDOR_INACTIVO.

TAREA 3. lib/datos/lotes.ts:
- registrarLote(d): normalizarCodigo; validarFechaProduccion(d.fechaProduccion, hoyBogota()); en transacción: obtenerProveedorActivo; muestra_minima = calcularMuestraMinima(cantidad); insertar con estado 'pendiente'. Devuelve { codigo, muestraMinima }.
- actualizarLote(codigo, d): en transacción bloquea el lote (SELECT ... FOR UPDATE); si no existe, LOTE_NO_ENCONTRADO; si no está 'pendiente' o tiene inspecciones, LOTE_NO_MODIFICABLE; valida fecha y proveedor igual que registrarLote (si el proveedor no cambia, puede seguir aunque esté inactivo); recalcula muestra_minima; permite cambiar el código (normalizado).
- eliminarLote(codigo): misma verificación de LOTE_NO_MODIFICABLE; borra.
- obtenerDetalleLote(codigo): desde v_lotes y las inspecciones del lote ordenadas por número. Agrega explicacionMuestra = explicarMuestraMinima(cantidad), la explicación de cada inspección reconstruida con decidirResultado, acciones = accionesPermitidas(estado, totalInspecciones) y siguienteNumeroInspeccion (1, 2 o null).
- listarHistorial({ estado, proveedorId, codigo }): desde v_lotes; código con LIKE sobre el valor normalizado; orden por created_at descendente; LIMIT LIMITE_HISTORIAL; arma el objeto ultima o null.
- obtenerBandeja(): lotes en 'pendiente' (orden por created_at ascendente: el más antiguo primero) y en 'en_revision' (mismo orden).

TAREA 4. lib/datos/inspecciones.ts: registrarInspeccion(codigo, d) exactamente como la sección 6.2, con funciones internas bloquearLotePorCodigo, insertarInspeccion y actualizarDecisionLote. Devuelve ResultadoRegistroInspeccion con el porcentaje leído de la fila insertada (RETURNING porcentaje_defectuoso).

TAREA 5. lib/dataService.ts como fachada: reexporta las funciones públicas de proveedores, lotes e inspecciones y los tipos de lib/datos/tipos.ts. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 6. scripts/limpiar-prueba.mjs con el script "db:limpiar": "node --env-file=.env.local scripts/limpiar-prueba.mjs". Opciones:
- --prueba: borra los lotes con código 'PRUEBA-%' y el proveedor "Proveedor de prueba 9999".
- --demo: borra los lotes 'DEMO-%' y los proveedores cuyo nombre empieza por "Proveedor Demo".
- --codigo CAL-001 CAL-002 ...: borra esos lotes.
En una transacción borra primero las inspecciones de esos lotes, luego los lotes y, al final, los proveedores indicados que ya no tengan lotes. Imprime cuántas filas borró por tabla. Uso: npm run db:limpiar -- --prueba

TAREA 7. Instala tsx como dependencia de desarrollo. Crea scripts/probar-flujo.ts con los 14 pasos de la sección 14.2, usando solo funciones de lib/dataService.ts:
- Cada paso imprime "OK    Paso N · descripción" o "FALLA Paso N · descripción · detalle". Los pasos que esperan error verifican el código de ErrorDeNegocio.
- Antes de empezar y en un bloque finally, limpia los datos de prueba (misma lógica de --prueba; puede usar consultar de lib/db/conexion.ts solo para la limpieza) y cierra el pool.
- Termina con código 1 si hubo fallas.
- Script "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts". Si tsx no acepta --env-file en esta versión, usa "node --env-file=.env.local --import tsx scripts/probar-flujo.ts".
Ejecuta npm run probar:flujo. Si un paso falla, corrige lib/datos o lib/reglas (nunca el script para que pase) y repite hasta tener 0 fallas.

TAREA 8. scripts/cargar-demo.ts con el script "db:demo" (mismo formato que probar:flujo). Usando solo dataService, crea los proveedores "Proveedor Demo Norte", "Proveedor Demo Sur" y "Proveedor Demo Centro", y los lotes DEMO-001 a DEMO-008 con cantidades entre 15 y 1000 y fechas de producción de los últimos días, de modo que queden: 2 pendientes, 1 en revisión, 2 aprobados (uno con segunda inspección) y 3 rechazados, los tres de "Proveedor Demo Sur" (uno por regla 2, uno por regla 5 y uno por regla 6). Si ya existen datos DEMO, primero los limpia. Imprime una tabla con código, proveedor y estado final. Ejecútalo.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega en la bitácora la salida de npm run probar:flujo y de npm run db:demo. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ejecutar `npm run probar:flujo`: 14 líneas OK y 0 fallas. Ejecutar `npm run db:demo` y revisar en Supabase la tabla `lotes` con los 8 lotes DEMO.

**Commit sugerido:** `feat(datos): proveedores, lotes e inspecciones con transacciones y prueba de flujo`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/calidad/`

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 9.1, 9.2, 9.3 y 9.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesionUsuario.ts.

OBJETIVO: exponer todas las operaciones mediante rutas protegidas.

TAREA 1. Crea todas las rutas de la tabla 9.3 (la de sesion ya existe). Reglas para cada handler:
- Primera instrucción: await exigirUsuario().
- Envuelto en conManejoDeErrores; cuerpos validados con leerCuerpo y los esquemas de 9.4; parámetros de búsqueda validados con esquemaFiltrosHistorial.
- El parámetro [codigo] se obtiene con const { codigo } = await params y se normaliza con normalizarCodigo; el parámetro [id] de proveedores con z.coerce.number().int().positive().
- export const dynamic = 'force-dynamic'.
Detalles:
- GET /api/calidad/proveedores: incluirInactivos=true incluye los inactivos.
- POST /api/calidad/lotes y POST .../inspecciones responden 201.
- PATCH /api/calidad/lotes/[codigo] usa actualizarLote; DELETE usa eliminarLote.

TAREA 2. Verificación sin sesión: con npm run dev, haz peticiones a GET /api/calidad/bandeja, GET /api/calidad/lotes y POST /api/calidad/lotes/DEMO-001/inspecciones y confirma 401 en las tres.

TAREA 3. Verificación con sesión: pídeme que inicie sesión en el navegador y que abra http://localhost:3000/api/calidad/bandeja y http://localhost:3000/api/calidad/lotes?estado=rechazado. Espera mi confirmación de que la bandeja muestra los lotes DEMO pendientes y en revisión, y que el historial filtrado muestra los tres DEMO rechazados.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con la salida de npm run probar:flujo (P04) y los resultados de las verificaciones de este prompt.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** con sesión iniciada, abrir `http://localhost:3000/api/calidad/lotes/DEMO-001` y revisar que la respuesta incluye la explicación de la muestra mínima y las acciones disponibles. En una ventana privada, la misma dirección debe responder 401.

**Commit sugerido:** `feat(api): rutas protegidas de proveedores, lotes e inspecciones`

---

## P06 · Interfaz base, bandeja de trabajo y proveedores

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/calidad`, bandeja y proveedores · **Modifica:** `app/globals.css` y, según el caso, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 3, 4.2, 10 y 11), doc/ESTADO_ACTUAL.md (secciones 5, 9 y 11), doc/ESTADO_EJECUCION.md, lib/dataService.ts y lib/formato.ts.

OBJETIVO: construir los componentes reutilizables, la estructura de navegación, la bandeja de trabajo y la gestión de proveedores.

TAREA 1. Agrega los tokens de color de la sección 11 sin borrar nada existente: con Tailwind 4 en el bloque @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/:
- Boton: variantes primario, secundario, peligro y fantasma; prop cargando que deshabilita y muestra un texto de carga.
- Campo: label asociado, input, texto de ayuda y mensaje de error; acepta todas las props de input.
- Selector: select con label y error.
- Tarjeta.
- Insignia: prop tono (neutro, primario, aprobado, revision, rechazado, pendiente).
- Aviso: tonos info, exito, advertencia y error.
- Modal: fondo oscuro, cierre con Escape y con botón, foco en el primer elemento al abrir, role="dialog" y aria-modal="true".
- EstadoVacio: título, texto y acción opcional.
Todos con foco visible y contraste suficiente.

TAREA 3. components/calidad/:
- NavegacionCalidad: barra superior con el nombre "Control de Calidad", enlaces Bandeja (/calidad), Historial (/calidad/lotes), Registrar lote (/calidad/lotes/nuevo) y Proveedores (/calidad/proveedores), enlace activo resaltado, nombre del usuario y botón de cerrar sesión que usa el mecanismo existente del login. Menú desplegable en móvil.
- InsigniaEstadoLote: usa ETIQUETA_ESTADO y los tonos de la sección 11.
- InsigniaRegla: recibe la regla (R2 a R6) y muestra DESCRIPCION_REGLA con el color del resultado.

TAREA 4. app/calidad/layout.tsx: componente de servidor; llama obtenerUsuario(); sin sesión, redirect a la ruta del login; renderiza NavegacionCalidad y el contenido con ancho máximo de 1200 px y fondo --color-fondo.

TAREA 5. app/page.tsx: si es la plantilla de Next.js, reemplázala por una redirección a /calidad (el layout de /calidad redirige al login si no hay sesión). Si tiene contenido propio del proyecto, agrega un enlace visible a /calidad sin borrar lo existente.

TAREA 6. app/calidad/page.tsx (servidor), bandeja de trabajo según la sección 10.1:
- Botón principal "Registrar lote".
- Tabla "Pendientes de inspección": código (enlace al detalle), producto, proveedor, cantidad, muestra mínima, botón "Inspeccionar" hacia /calidad/lotes/[codigo]/inspeccion.
- Tabla "En revisión: requieren segunda inspección": código, producto, proveedor, primera inspección con formatearInspeccion, botón "Segunda inspección".
- EstadoVacio en cada tabla con texto propio ("No hay lotes pendientes de inspección", "No hay lotes en revisión").
- Sin indicadores ni gráficas.
- Tablas convertidas en tarjetas apiladas en pantallas menores a 640 px.

TAREA 7. components/calidad/TablaProveedores.tsx, FormularioProveedor.tsx y app/calidad/proveedores/page.tsx: tabla con nombre, estado (Insignia "Activo" o "Inactivo"), lotes registrados y acciones Renombrar (modal) y Activar/Desactivar (confirmación); formulario para agregar proveedor. Las acciones llaman a /api/calidad/proveedores, muestran error.mensaje si fallan y ejecutan router.refresh() si tienen éxito.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Comprueba: el login lleva a la bandeja; la bandeja muestra los lotes DEMO pendientes y en revisión; crear el proveedor "Proveedor Temporal", renombrarlo, intentar crear otro con el mismo nombre en mayúsculas (debe mostrar el error de duplicado), desactivarlo y activarlo. Revisa la navegación en vista móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** iniciar sesión y revisar la bandeja con los lotes DEMO. Crear y desactivar un proveedor. Hacer push y revisar lo mismo en la URL de Vercel.

**Commit sugerido:** `feat(interfaz): componentes base, navegación, bandeja de trabajo y proveedores`

---

## P07 · Lotes: registro, edición, historial y detalle

**Fase:** 5 · **Crea:** páginas de lotes y sus componentes

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 2.4, 4.3, 5.1, 8.5, 9.3, 10 y 11), doc/ESTADO_EJECUCION.md, lib/datos/tipos.ts y los componentes de components/ui/ y components/calidad/.

OBJETIVO: registrar y corregir lotes, consultar el historial con filtros y ver el detalle completo de cada lote.

TAREA 1. components/calidad/VistaMuestraMinima.tsx (cliente): recibe la cantidad que se está escribiendo y muestra en vivo calcularMuestraMinima y explicarMuestraMinima de lib/reglas/muestra.ts. Si la cantidad no es un entero mayor a 0, muestra "Ingrese la cantidad producida para calcular la muestra mínima".

TAREA 2. components/calidad/FormularioLote.tsx (cliente), modos crear y editar:
- Campos: código (se convierte a mayúsculas mientras se escribe), producto, fecha de producción (por defecto hoyBogota(), atributo max igual a hoyBogota()), cantidad producida, proveedor (selector con los proveedores activos; en modo editar incluye el proveedor actual aunque esté inactivo) y botón "Agregar proveedor" que abre un Modal con FormularioProveedor y, al crear, lo deja seleccionado.
- VistaMuestraMinima debajo de la cantidad.
- Validación en el navegador con esquemaLote antes de enviar; errores junto a cada campo.
- Crear: POST /api/calidad/lotes; al terminar navega a /calidad/lotes/[codigo] con un aviso de éxito (parámetro ?registrado=1 que el detalle muestra como Aviso).
- Editar: PATCH /api/calidad/lotes/[codigo]; al terminar navega al detalle (con el código nuevo si cambió).
- Errores del servidor con error.mensaje.

TAREA 3. app/calidad/lotes/nuevo/page.tsx y app/calidad/lotes/[codigo]/editar/page.tsx. Si el lote no admite edición (acciones sin EDITAR_LOTE), la página de edición muestra el Aviso de LOTE_NO_MODIFICABLE y un enlace al detalle en lugar del formulario. Lote inexistente: notFound().

TAREA 4. Historial:
- components/calidad/FiltrosHistorial.tsx (cliente): selector de estado (Todos y los cuatro estados), selector de proveedor (Todos y todos los proveedores, incluidos inactivos marcados "(inactivo)") y campo de código; actualiza los parámetros de la URL (estado, proveedorId, codigo) con espera de 300 ms en el campo de código; botón "Limpiar filtros".
- components/calidad/TablaLotes.tsx: columnas código (enlace), producto, proveedor, fecha de producción, última inspección (formatearInspeccion o "Sin inspección"), inspecciones ("1 de 2"), estado (InsigniaEstadoLote). Tarjetas apiladas en móvil.
- app/calidad/lotes/page.tsx (servidor): lee los filtros de searchParams (en Next.js 15 y 16 searchParams es una Promise), valida con esquemaFiltrosHistorial, llama listarHistorial y muestra la tabla; si llega a LIMITE_HISTORIAL filas, Aviso "Se muestran los 200 lotes más recientes. Use los filtros para acotar la búsqueda"; EstadoVacio si no hay resultados.

TAREA 5. Detalle:
- components/calidad/TarjetaInspeccion.tsx: número y fecha; muestreadas, defectuosas y críticas con números tabulares; formatearInspeccion; InsigniaEstadoLote del resultado; InsigniaRegla; explicación; observaciones si existen.
- components/calidad/AccionesLote.tsx (cliente): un botón por acción de detalle.acciones: "Registrar inspección" o "Registrar segunda inspección" según siguienteNumeroInspeccion (enlace a la página de inspección), "Editar lote" (enlace) y "Eliminar lote" (Modal de confirmación, DELETE y navegación al historial).
- app/calidad/lotes/[codigo]/page.tsx (servidor): obtenerDetalleLote (LOTE_NO_ENCONTRADO → notFound()). Encabezado con código e InsigniaEstadoLote; Aviso de éxito si viene ?registrado=1 o ?inspeccionado=1; tarjeta de datos (producto, proveedor, fecha de producción, cantidad, muestra mínima con su explicación); si el lote está aprobado o rechazado, tarjeta "Decisión final" con estado, InsigniaRegla y fecha de decisión; lista de TarjetaInspeccion (o "Sin inspecciones registradas"); AccionesLote.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Comprueba: registrar el lote PRUEBA-UI-1 de 195 piezas (la vista previa debe decir "19,5, redondeado a 20"); intentar registrarlo de nuevo con el código en minúsculas (error de duplicado); intentar una fecha de mañana (error); editarlo a 210 piezas (muestra mínima 21); filtrar el historial por estado Rechazado y por "Proveedor Demo Sur"; abrir el detalle de un lote DEMO rechazado y revisar la explicación de la regla; eliminar PRUEBA-UI-1. Al final ejecuta npm run db:limpiar -- --codigo PRUEBA-UI-1 por si quedó registrado.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** registrar un lote propio, revisar la explicación de la muestra mínima mientras se escribe la cantidad y filtrar el historial por estado y por proveedor.

**Commit sugerido:** `feat(interfaz): registro, edición, historial y detalle de lotes`

---

## P08 · Inspección y resultado

**Fase:** 5 (cierre) · **Crea:** página de inspección, vista previa de la decisión y tarjeta de resultado

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 4, 5, 6.2, 8.5, 9.2, 9.3, 10 y 11), doc/ESTADO_EJECUCION.md, lib/reglas/inspeccion.ts, lib/reglas/decision.ts y los componentes de components/ui/ y components/calidad/.

OBJETIVO: construir la pantalla central del sistema: el registro de una inspección con la decisión prevista antes de guardar y el resultado explicado después de guardar.

TAREA 1. components/calidad/VistaPreviaDecision.tsx (cliente): recibe el lote (cantidad, muestra mínima), el número de inspección y los tres valores que se están escribiendo.
- Si algún valor está vacío o no es entero, muestra "Complete las cantidades para ver el resultado previsto".
- Ejecuta validarInspeccion dentro de try/catch; si hay ErrorDeNegocio, devuelve el código para que el formulario muestre el mensaje junto al campo correspondiente (MUESTRA_INSUFICIENTE y MUESTRA_EXCEDE_LOTE en muestreadas, DEFECTUOSAS_EXCEDEN_MUESTRA en defectuosas, CRITICAS_EXCEDEN_DEFECTUOSAS en críticas).
- Si es válido, muestra el título "Resultado previsto. Se confirma al registrar la inspección.", formatearInspeccion, InsigniaEstadoLote del resultado, InsigniaRegla y la explicación de decidirResultado.

TAREA 2. components/calidad/FormularioInspeccion.tsx (cliente):
- Campos numéricos (inputMode="numeric"): piezas muestreadas (ayuda "Mínimo {muestraMinima} · máximo {cantidad}"), piezas defectuosas, piezas críticas (ayuda "Toda pieza crítica también se cuenta como defectuosa"), observaciones (textarea opcional con contador de 500 caracteres).
- VistaPreviaDecision a la derecha en escritorio y debajo en móvil.
- Botón "Registrar inspección" deshabilitado mientras haya errores o campos vacíos. Al presionarlo abre un Modal con el texto de confirmación de la sección 10.2, el resumen (fracción, porcentaje y resultado previsto) y los botones "Confirmar" y "Revisar de nuevo".
- Confirmar: POST /api/calidad/lotes/[codigo]/inspecciones. Si responde con error, muestra error.mensaje (si es LOTE_CERRADO o INSPECCION_DUPLICADA, agrega un enlace "Ver lote"). Si responde bien, entrega el resultado al componente padre.

TAREA 3. components/calidad/TarjetaResultado.tsx: estado grande con su color y texto (nunca solo color), InsigniaRegla, explicación, formatearInspeccion y enlaces "Ver lote" (detalle con ?inspeccionado=1), "Volver a la bandeja" y, si el resultado es en_revision, "Registrar segunda inspección".

TAREA 4. app/calidad/lotes/[codigo]/inspeccion/page.tsx: el componente de servidor obtiene el detalle (notFound() si no existe).
- Si siguienteNumeroInspeccion es null: Aviso con el mensaje de LOTE_CERRADO, InsigniaEstadoLote y enlace al detalle.
- Si no: resumen del lote (código, producto, proveedor, cantidad, muestra mínima con explicación), indicador "Inspección 1 de 2" o "Inspección 2 de 2"; en la segunda, Aviso de advertencia "Use una muestra nueva. Si el resultado vuelve a quedar entre 3 % y 5 %, el lote se rechaza" y la tarjeta de la primera inspección como referencia.
- Un componente cliente contenedor muestra FormularioInspeccion y, tras guardar, lo reemplaza por TarjetaResultado.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Registra PRUEBA-UI-2 (200 piezas, cualquier proveedor activo) y comprueba en la página de inspección:
- 19 muestreadas: error junto al campo y botón deshabilitado.
- 20 muestreadas, 21 defectuosas: error en defectuosas.
- 20, 2, 3: error en críticas.
- 20, 1, 0: vista previa "En revisión · Regla 4 · 1 de 20 · 5,00 %"; confirmar; la tarjeta de resultado ofrece la segunda inspección.
- Segunda inspección 20, 0, 0: aprobado, regla 3.
- Volver a la ruta de inspección: aviso de lote cerrado.
- Registra PRUEBA-UI-3 (500 piezas) e inspecciona 50, 1, 1: vista previa "Rechazado · Regla 2" aunque el porcentaje es 2,00 %.
Documenta y ejecuta npm run db:limpiar -- --codigo PRUEBA-UI-2 PRUEBA-UI-3.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md con el recorrido de P06, P07 y P08.
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** repetir en el navegador los casos del prompt y comprobar que la vista previa cambia mientras se escriben las cantidades. Hacer push y repetir un caso en la URL de Vercel.

**Commit sugerido:** `feat(interfaz): registro de inspección con decisión prevista y resultado explicado`

---

## P09 · Aceptación y cierre del módulo mínimo

**Fase:** 6 · **Crea:** `doc/ACEPTACION.md` · **Modifica:** `README.md` y lo que requieran las correcciones

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 5.3, 8.3, 13, 14 y 15) y doc/ESTADO_EJECUCION.md completo.

OBJETIVO: comprobar el criterio de terminado y dejar el módulo mínimo listo para la aceptación en Vercel.

TAREA 1. Ejecuta npm test, npm run db:verificar y npm run probar:flujo. Corrige cualquier falla en el código (no en las pruebas).

TAREA 2. Revisa el código contra las secciones 5.3, 8.3 y 13. Reporta en la bitácora cada incumplimiento encontrado y su corrección:
- Decisiones que usen porcentajes con decimales, multiplicaciones por 0.1 o calcularPorcentaje.
- Valores de reglas escritos directamente en el código en lugar de leerlos de lib/config/calidad.ts (3, 5, 10, 20, 2, 30).
- Archivos fuera de lib/datos que importen lib/db/conexion.ts o pg.
- Rutas de app/api/calidad sin await exigirUsuario() como primera instrucción.
- Rutas o funciones que permitan editar o eliminar inspecciones.
- Uso de new Date() para calcular "hoy" fuera de lib/reglas/fechas.ts.
- Textos de interfaz en inglés.
- SQL con valores concatenados.
- Estados comunicados solo con color.

TAREA 3. Prepara la base de datos para la aceptación: ejecuta npm run db:limpiar -- --prueba y npm run db:limpiar -- --codigo CAL-001 CAL-002 CAL-003 CAL-004 CAL-005 CAL-006 CAL-007. Conserva los datos DEMO.

TAREA 4. Crea doc/ACEPTACION.md con:
- Instrucciones: usar la URL del despliegue en Vercel; ejecutar las filas en orden; para repetir, limpiar con npm run db:limpiar -- --codigo CAL-001 ... CAL-007 y eliminar desde la interfaz los proveedores de prueba (o desactivarlos).
- Tabla A-01 a A-21 de la sección 14.3 con columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación. Deja vacías "resultado obtenido", "evidencia" y "observación": las llena el estudiante.

TAREA 5. Actualiza README.md con: descripción breve del problema y del sistema; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, npm run db:migrar, npm run db:demo, npm run dev); scripts disponibles con su propósito; estructura de carpetas resumida; tabla de las reglas 1 a 8 del plan funcional con la función o restricción que las aplica; una sección corta "Por qué se decide con enteros" con el ejemplo de la sección 5.3; enlace a doc/PLAN_CONTROL_CALIDAD.md.

TAREA 6. Verifica que .env.local esté en .gitignore y que ningún archivo versionado contenga valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_6_COMPLETADA.md con el resultado de las tres comprobaciones automáticas y la lista de revisión de la TAREA 2.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que la tabla de doc/ACEPTACION.md se ejecuta en el despliegue de Vercel.
````

**Verificación del estudiante:** hacer push, esperar el despliegue y ejecutar en la URL de Vercel las filas A-01 a A-21 de `doc/ACEPTACION.md`, llenando el resultado obtenido y la evidencia (captura o descripción). Hacer commit del archivo diligenciado.

**Commit sugerido:** `docs: aceptación del módulo mínimo y README`

---

## P10 · Opcional: alerta por proveedor

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_CONTROL_CALIDAD.md (secciones 2.4, 12 y 16), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: implementar la regla 7 del plan funcional (alerta por proveedor) sin alterar el módulo mínimo.

TAREA 1. lib/reglas/alerta.ts: evaluarAlertaProveedor(fechasRechazo, hoy) según la sección 16. La ventana va desde sumarDias(hoy, -(DIAS_VENTANA_ALERTA - 1)) hasta hoy, ambos incluidos; se comparan textos YYYY-MM-DD; enAlerta si el conteo es mayor o igual a LOTES_RECHAZADOS_PARA_ALERTA.

TAREA 2. tests/reglas/alerta.test.ts con T-36 a T-39 de la sección 16 (fecha de referencia fija, por ejemplo hoy = '2030-03-31'). Ejecuta npm test: deben pasar 39 pruebas.

TAREA 3. lib/datos/proveedores.ts:
- obtenerFechasRechazoProveedor(proveedorId, desde): fechas de decisión de lotes rechazados del proveedor desde esa fecha.
- listarProveedoresEnAlerta(): proveedores con su conteo, usando evaluarAlertaProveedor.
- listarProveedores agrega el campo enAlerta a cada fila.
Reexporta en lib/dataService.ts.

TAREA 4. En lib/datos/inspecciones.ts, después de confirmar la transacción de una inspección que deja el lote rechazado, evalúa la alerta del proveedor del lote y agrega alertaProveedor: { proveedor, rechazosEnVentana } | null a ResultadoRegistroInspeccion (actualiza el tipo).

TAREA 5. Interfaz:
- TarjetaResultado: si alertaProveedor no es null, Aviso de advertencia "Proveedor en alerta de calidad: {proveedor} tiene {n} lotes rechazados en los últimos 30 días."
- TablaProveedores: Insignia "En alerta" (tono rechazado) junto al nombre.
- Bandeja: si listarProveedoresEnAlerta devuelve proveedores, recuadro de advertencia con su nombre, su conteo y un enlace al historial filtrado por ese proveedor y estado rechazado.
- El sistema solo avisa: no bloquea proveedores ni cambia lotes.

VERIFICACIÓN: con los datos DEMO (tres lotes rechazados de "Proveedor Demo Sur" con fecha de decisión reciente), comprueba que la bandeja muestra la alerta y que la tabla de proveedores marca a "Proveedor Demo Sur". Si la carga demo es de hace más de 30 días, ejecuta npm run db:demo de nuevo. Registra PRUEBA-UI-4 con "Proveedor Demo Sur", inspecciónalo con un resultado de rechazo y comprueba el aviso en la tarjeta de resultado. Ejecuta npm run db:limpiar -- --codigo PRUEBA-UI-4.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P10 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** revisar la alerta en la bandeja y en Proveedores con los datos DEMO, y registrar un rechazo propio para ver el aviso en el resultado.

**Commit sugerido:** `feat(opcional): alerta de calidad por proveedor`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_CONTROL_CALIDAD.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora de ESTADO_EJECUCION.md la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_CONTROL_CALIDAD.md y doc/PROMPTS_CONTROL_CALIDAD.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
