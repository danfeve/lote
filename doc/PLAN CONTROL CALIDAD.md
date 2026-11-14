# Control de Calidad por Lotes · Plan técnico de implementación

> Versión técnica 3.0, derivada del plan funcional de Daniel Vergara (versión 2)
> Asignatura: Lógica y Programación (SIST0200) · Ingeniería Industrial · Universidad Sergio Arboleda, Santa Marta
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres + Zod · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_CONTROL_CALIDAD.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Alcance](#2-alcance)
3. [Usuario y acceso](#3-usuario-y-acceso)
4. [Estados del lote](#4-estados-del-lote)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Casos de uso](#6-casos-de-uso)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Arquitectura del código](#8-arquitectura-del-código)
9. [Contratos de API](#9-contratos-de-api)
10. [Pantallas](#10-pantallas)
11. [Identidad visual](#11-identidad-visual)
12. [Fechas y zona horaria](#12-fechas-y-zona-horaria)
13. [Seguridad e integridad de los registros](#13-seguridad-e-integridad-de-los-registros)
14. [Pruebas](#14-pruebas)
15. [Plan de ejecución](#15-plan-de-ejecución)
16. [Funcionalidad opcional: alerta por proveedor](#16-funcionalidad-opcional-alerta-por-proveedor)
17. [Glosario](#17-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_CONTROL_CALIDAD.md` | Este documento |
| `doc/PROMPTS_CONTROL_CALIDAD.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue.
- Login funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login (JWT propio en cookie, Supabase Auth u otro) | El adaptador `lib/auth/sesionUsuario.ts` debe envolverlo sin reescribirlo |
| Ruta a la que redirige el login | Se cambia a `/calidad` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable `DATABASE_URL` | El registro de inspecciones usa transacciones con `pg` |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 11) |
| Rutas `/calidad` o `/api/calidad` | No deben existir antes; si existen, se reporta el conflicto |

### 1.3 Regla sobre el login

El login existente no se reescribe. Solo se agrega:

1. Un adaptador `lib/auth/sesionUsuario.ts` que expone `obtenerUsuario()` y `exigirUsuario()` usando el mecanismo que ya existe.
2. Protección de las rutas `/calidad/*` y `/api/calidad/*`.
3. La redirección posterior al login hacia `/calidad`.

---

## 2. Alcance

### 2.1 Funcionalidades

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar un lote con su proveedor y cantidad | CU-01, CU-02, CU-03 | P04, P05, P07 |
| F2 | Registrar la inspección de una muestra | CU-04 | P04, P05, P08 |
| F3 | Calcular el resultado del lote | CU-04 | P02, P04, P08 |
| F4 | Consultar el historial filtrando por estado o proveedor | CU-05, CU-06 | P04, P05, P07 |
| F5 | Alertar por proveedor con lotes rechazados (opcional) | CU-08 | P10 |

El módulo mínimo es F1 a F4. F5 solo se construye con la fase 6 cerrada.

### 2.2 Fuera de alcance

Se mantiene la lista del plan funcional: sensores o cámaras, trazabilidad al lote de materia prima (solo se guarda el proveedor), usuarios y permisos múltiples, facturación y contratos, cambio automático de proveedor, indicadores y reportes por periodo, y exportación a PDF o Excel.

### 2.3 Ajustes respecto al plan funcional

| Plan funcional | Plan técnico | Motivo |
|---|---|---|
| Interfaz de consola con menú | Aplicación web en Next.js | El proyecto del semestre se construye en Next.js y ya está desplegado en Vercel. Las reglas no cambian; cambia la forma de capturar los datos |
| Sin inicio de sesión | Se usa el login existente, con un solo usuario y sin roles | La aplicación está en una URL pública: sin login cualquier persona podría crear o alterar registros de calidad. No se agregan usuarios, roles ni permisos |
| Colecciones `lotes` e `inspecciones` | Tablas `lotes` e `inspecciones` en Postgres (Supabase), más `proveedores` | Misma estructura de datos; Supabase es la base de datos del curso |
| Proveedor como texto libre en el lote | Catálogo `proveedores` y el lote guarda la referencia | El filtro por proveedor (F4) y la alerta (F5) cuentan lotes por proveedor: con texto libre, "Plasticos SA" y "Plásticos S.A." serían dos proveedores distintos. Se sigue guardando solo el nombre, sin lote de materia prima |
| Esquemas de validación por colección | Esquemas Zod en el servidor y en los formularios, más restricciones CHECK en la base de datos | Los tipos y rangos de la sección 5 del plan funcional quedan validados en tres puntos: formulario, API y base de datos |
| Caso límite "0 % defectuosas pero 1 crítica" | "1 defectuosa crítica en 50 muestreadas (2 %)" | Contradice la regla 8 del propio plan (`piezas_criticas` no puede ser mayor que `piezas_defectuosas`): una pieza crítica también es defectuosa. El caso corregido conserva lo que se quería probar: la regla 2 se aplica antes que el porcentaje (sección 5.2) |
| Observación escrita a mano en la planilla (situación actual) | Campo opcional `observaciones` en la inspección | La planilla actual la registra; omitirla sería perder información que hoy existe |

### 2.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Las inspecciones no se editan ni se eliminan | Son el registro de trazabilidad del problema 2 del plan funcional. Antes de guardar, la pantalla muestra el resultado previsto y pide confirmación |
| Un lote se corrige o elimina solo si está `pendiente` y no tiene inspecciones | Permite corregir errores de digitación sin alterar decisiones ya tomadas |
| Los proveedores no se eliminan; se desactivan | Un proveedor con lotes registrados debe seguir apareciendo en el historial |
| El número de inspección lo asigna el sistema (1 si el lote está `pendiente`, 2 si está `en_revision`) | Evita que el inspector registre una segunda inspección como primera |
| La segunda inspección usa la misma validación de muestra que la primera; el sistema no verifica que las piezas sean distintas | La regla 4 pide "una muestra nueva", pero el sistema no puede identificar piezas individuales. En lotes donde la primera muestra fue el lote completo (por ejemplo, 20 piezas), la segunda inspección revisa de nuevo el lote completo |
| Las decisiones se calculan con aritmética entera (sección 5.3) | Los porcentajes exactos de 3 % y 5 % deben caer siempre en la zona de revisión, sin errores de redondeo |
| La fecha de decisión de un lote es la fecha de la inspección que lo aprueba o rechaza | La alerta opcional (F5) cuenta rechazos de los últimos 30 días a partir de esta fecha |

---

## 3. Usuario y acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Responsable de calidad (inspector) | Login existente | Gestionar proveedores, registrar lotes e inspecciones, consultar el historial |
| Sistema | Interno | Calcula la muestra mínima, valida entradas, decide el resultado, asigna el número de inspección |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/calidad` |
| `/calidad/*` | Redirige al login | Sí |
| `/api/calidad/*` | 401 | Sí |

---

## 4. Estados del lote

### 4.1 Diagrama

```text
                    inspección 1
pendiente ──────────────────────────────┬──► aprobado   (regla 3)
                                        ├──► rechazado  (reglas 2 o 6)
                                        └──► en_revision (regla 4)
                                                  │ inspección 2
                                                  ├──► aprobado  (regla 3)
                                                  └──► rechazado (reglas 2, 5 o 6)
```

### 4.2 Estados (columna `lotes.estado`)

| Código | Etiqueta en pantalla | Significado |
|---|---|---|
| `pendiente` | Pendiente | Registrado, sin inspecciones |
| `en_revision` | En revisión | La primera inspección cayó entre 3 % y 5 %; falta la segunda |
| `aprobado` | Aprobado | Decisión final: el lote cumple |
| `rechazado` | Rechazado | Decisión final: el lote no cumple |

El plan funcional escribe el estado como `en revision`; en código se usa `en_revision` para evitar espacios.

### 4.3 Acciones por estado

| Estado | Acciones disponibles |
|---|---|
| `pendiente` sin inspecciones | Registrar inspección (número 1) · Editar lote · Eliminar lote |
| `en_revision` | Registrar inspección (número 2) |
| `aprobado` | Ninguna (solo consulta) |
| `rechazado` | Ninguna (solo consulta) |

El panel muestra únicamente estas acciones. El servidor vuelve a validar cada una.

---

## 5. Reglas de negocio

### 5.1 Tabla de reglas

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | Muestra mínima: si el lote tiene menos de 20 piezas, el lote completo; si no, el mayor entre 20 y el 10 % de la cantidad producida redondeado hacia arriba | Regla 1 | Dominio `calcularMuestraMinima`; se guarda en el lote al registrarlo |
| RN-02 | Con 1 o más piezas críticas el lote se rechaza, sin importar el porcentaje | Regla 2 | Dominio `decidirResultado` |
| RN-03 | Sin críticas y con porcentaje defectuoso menor a 3 %, el lote se aprueba | Regla 3 | Dominio `decidirResultado` |
| RN-04 | Sin críticas y con porcentaje entre 3 % y 5 % inclusive, en la primera inspección el lote queda en revisión | Regla 4 | Dominio `decidirResultado` |
| RN-05 | En la segunda inspección se aplican las reglas 2, 3 y 6; si el porcentaje vuelve a quedar entre 3 % y 5 %, el lote se rechaza. No existe tercera inspección | Regla 5 | Dominio `decidirResultado` y `validarLoteAdmiteInspeccion`; BD `inspecciones_numero_valido`, `inspecciones_segunda_sin_revision` |
| RN-06 | Sin críticas y con porcentaje mayor a 5 %, el lote se rechaza | Regla 6 | Dominio `decidirResultado` |
| RN-07 | Proveedor en alerta con 3 o más lotes rechazados en los últimos 30 días (opcional) | Regla 7 | Sección 16 |
| RN-08a | Piezas muestreadas: entero, mayor o igual a la muestra mínima y menor o igual a la cantidad producida | Regla 8 | Dominio `validarInspeccion`; Zod |
| RN-08b | Piezas defectuosas: entero entre 0 y las piezas muestreadas | Regla 8 | Dominio; BD `inspecciones_defectuosas_rango` |
| RN-08c | Piezas críticas: entero entre 0 y las piezas defectuosas | Regla 8 | Dominio; BD `inspecciones_criticas_rango` |
| RN-08d | Un lote aprobado o rechazado no admite inspecciones | Regla 8 | Dominio `validarLoteAdmiteInspeccion` |
| RN-09 | El código del lote es único, se guarda en mayúsculas y solo admite letras, dígitos y guiones (3 a 30 caracteres) | Sección 4.1 del plan funcional | Dominio `normalizarCodigo`; Zod; BD UNIQUE y CHECK |
| RN-10 | La cantidad producida es un entero mayor a 0; producto y proveedor son obligatorios | Sección 4.1 del plan funcional | Zod; BD CHECK |
| RN-11 | La fecha de producción no puede ser posterior a hoy (zona `America/Bogota`) | Agregada | Dominio `validarFechaProduccion` |
| RN-12 | El porcentaje defectuoso se calcula, no se digita: `defectuosas / muestreadas × 100`, mostrado con dos decimales | Sección 4.2 del plan funcional | BD columna generada; dominio `calcularPorcentaje` |
| RN-13 | Toda decisión guarda la regla aplicada y una explicación en lenguaje claro | Sección 4.3 del plan funcional | Dominio `decidirResultado`; BD `regla_aplicada` |
| RN-14 | El nombre del proveedor es único sin distinguir mayúsculas; un proveedor inactivo no se puede asignar a lotes nuevos | Agregada | BD índice único; servicio |
| RN-15 | Las inspecciones son inmutables; un lote solo se edita o elimina si está `pendiente` sin inspecciones | Agregada | Servicio; BD `ON DELETE RESTRICT` |

### 5.2 Casos límite (corregidos)

| Caso | Resultado | Regla | Porqué |
|---|---|---|---|
| 6 defectuosas de 200 (3,00 %), sin críticas, primera inspección | En revisión | R4 | La aprobación exige estrictamente menos de 3 % |
| 10 defectuosas de 200 (5,00 %), sin críticas, primera inspección | En revisión | R4 | El rechazo exige estrictamente más de 5 % |
| 1 defectuosa crítica de 50 (2,00 %) | Rechazado | R2 | La regla 2 se aplica antes que el porcentaje |
| Lote de 195 piezas | Muestra mínima de 20 | RN-01 | 10 % = 19,5, se redondea a 20 |
| Lote de 15 piezas | Se muestrean las 15 | RN-01 | Hay menos de 20 piezas en total |
| Segunda inspección con 8 de 200 (4,00 %) | Rechazado | R5 | No se permite una tercera inspección |
| Lote de 1100 piezas | Muestra mínima de 110 | RN-01 | 10 % exacto; se calcula con enteros (5.3) |
| Lote de 201 piezas | Muestra mínima de 21 | RN-01 | 10 % = 20,1, se redondea a 21 |

### 5.3 Aritmética entera en las decisiones

Los decimales como 0,1 no tienen representación exacta en binario. En JavaScript, `1.1 * 100` da `110.00000000000001`, y `Math.ceil` convertiría ese valor en 111. Un error así en una frontera cambia la decisión de un lote. Por eso las reglas comparan con enteros y nunca dividen para decidir:

```ts
// Muestra mínima (RN-01): sin multiplicar por 0.1
const diezPorCiento = Math.ceil((cantidad * PORCENTAJE_MUESTRA) / 100);

// Clasificación del porcentaje (RN-03, RN-04, RN-06):
// p < 3   equivale a  defectuosas * 100 <  3 * muestreadas
// p <= 5  equivale a  defectuosas * 100 <= 5 * muestreadas
const bajoUmbralAprobacion = defectuosas * 100 < UMBRAL_APROBACION_PCT * muestreadas;
const dentroZonaRevision   = defectuosas * 100 <= UMBRAL_RECHAZO_PCT * muestreadas;
```

Los umbrales de la configuración son enteros. El porcentaje con decimales se usa solo para mostrar, y siempre junto a la fracción ("6 de 200 · 3,00 %"), para que el redondeo de pantalla no se confunda con la decisión.

### 5.4 Explicaciones por regla

`decidirResultado` devuelve una explicación con los datos de la inspección:

| Regla | Plantilla de explicación |
|---|---|
| R2 | Se encontraron {c} piezas críticas. Con una o más piezas críticas el lote se rechaza sin importar el porcentaje (regla 2). |
| R3 | {d} de {n} piezas defectuosas ({p} %), sin piezas críticas. El porcentaje es menor a 3 %: el lote se aprueba (regla 3). |
| R4 | {d} de {n} piezas defectuosas ({p} %), entre 3 % y 5 %. El lote queda en revisión y requiere una segunda inspección con una muestra nueva (regla 4). |
| R5 | Segunda inspección: {d} de {n} piezas defectuosas ({p} %), de nuevo entre 3 % y 5 %. El lote se rechaza porque no se permite una tercera inspección (regla 5). |
| R6 | {d} de {n} piezas defectuosas ({p} %). El porcentaje es mayor a 5 %: el lote se rechaza (regla 6). |

Cuando hay una sola pieza crítica, la explicación R2 usa el singular ("Se encontró 1 pieza crítica").

---

## 6. Casos de uso

### 6.1 Catálogo

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Gestionar proveedores | nombre; activar o desactivar | Nombre no repetido | Proveedor creado, renombrado o con estado cambiado | `DATOS_INVALIDOS`, `PROVEEDOR_DUPLICADO`, `PROVEEDOR_NO_ENCONTRADO` |
| CU-02 Registrar lote | código, producto, fecha de producción, cantidad, proveedor | Código no repetido; proveedor activo | Lote `pendiente` con su muestra mínima calculada | `DATOS_INVALIDOS`, `CODIGO_DUPLICADO`, `FECHA_FUTURA`, `PROVEEDOR_INACTIVO` |
| CU-03 Corregir o eliminar lote | campos del lote | Lote `pendiente` sin inspecciones | Lote actualizado (muestra mínima recalculada) o eliminado | `LOTE_NO_ENCONTRADO`, `LOTE_NO_MODIFICABLE` y los de CU-02 |
| CU-04 Registrar inspección y calcular resultado | código del lote, muestreadas, defectuosas, críticas, observaciones | Lote `pendiente` o `en_revision` | Inspección guardada con porcentaje, resultado y regla; estado del lote actualizado; fecha de decisión si es final | `LOTE_NO_ENCONTRADO`, `LOTE_CERRADO`, `MUESTRA_INSUFICIENTE`, `MUESTRA_EXCEDE_LOTE`, `DEFECTUOSAS_EXCEDEN_MUESTRA`, `CRITICAS_EXCEDEN_DEFECTUOSAS`, `INSPECCION_DUPLICADA` |
| CU-05 Consultar historial | filtros: estado, proveedor, código | Ninguna | Lista con código, producto, proveedor, fecha, última inspección (fracción y porcentaje), número de inspecciones y estado | `DATOS_INVALIDOS` |
| CU-06 Consultar detalle del lote | código | Lote existe | Datos del lote, explicación de la muestra mínima, inspecciones con su explicación, acciones disponibles | `LOTE_NO_ENCONTRADO` |
| CU-07 Consultar bandeja de trabajo | ninguna | Ninguna | Lotes pendientes de primera inspección y lotes en revisión | Ninguno |
| CU-08 Alerta por proveedor (opcional) | proveedor del lote rechazado | Sección 16 | Aviso "proveedor en alerta de calidad" | Ninguno |

### 6.2 Secuencia de CU-04 (registro de inspección)

Todo ocurre dentro de `conTransaccion`:

1. `SELECT ... FROM lotes WHERE codigo = $1 FOR UPDATE` (si no existe: `LOTE_NO_ENCONTRADO`). El bloqueo evita que dos registros simultáneos tomen el mismo número de inspección.
2. `validarLoteAdmiteInspeccion(estado)` devuelve el número de inspección (1 o 2) o lanza `LOTE_CERRADO`.
3. `validarInspeccion({ cantidad, muestraMinima, muestreadas, defectuosas, criticas })`.
4. `decidirResultado({ numeroInspeccion, muestreadas, defectuosas, criticas })` devuelve resultado, regla y explicación.
5. Insertar la inspección con `fecha_inspeccion = hoyBogota()`, resultado y regla.
6. Actualizar el lote: `estado = resultado`, `regla_decision = regla`; si el resultado es `aprobado` o `rechazado`, `fecha_decision = hoyBogota()`.
7. Confirmar y devolver inspección, nuevo estado del lote y decisión.

```ts
export async function registrarInspeccion(codigo: string, d: DatosInspeccion): Promise<ResultadoInspeccion> {
  return conTransaccion(async (tx) => {
    const lote = await bloquearLotePorCodigo(tx, codigo);
    const numeroInspeccion = validarLoteAdmiteInspeccion(lote.estado);
    validarInspeccion({ cantidad: lote.cantidadProducida, muestraMinima: lote.muestraMinima, ...d });
    const decision = decidirResultado({ numeroInspeccion, ...d });
    const hoy = hoyBogota();
    const inspeccion = await insertarInspeccion(tx, { loteId: lote.id, numeroInspeccion, fecha: hoy, ...d, decision });
    const esFinal = decision.resultado !== 'en_revision';
    await actualizarDecisionLote(tx, lote.id, decision.resultado, decision.regla, esFinal ? hoy : null);
    return { inspeccion, estadoLote: decision.resultado, decision };
  });
}
```

---

## 7. Modelo de datos

### 7.1 Relaciones

```text
proveedores 1 ──── N lotes 1 ──── 0..2 inspecciones

v_lotes = lotes + nombre del proveedor + última inspección + número de inspecciones
```

Las migraciones se guardan en `supabase/migrations/` y continúan la numeración existente (P00 la identifica). En este documento se nombran M1 y M2.

### 7.2 M1 · Tablas

```sql
-- M1: tablas del módulo Control de Calidad por Lotes

CREATE TABLE IF NOT EXISTS proveedores (
  id          BIGSERIAL     PRIMARY KEY,
  nombre      VARCHAR(120)  NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT proveedores_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_proveedores_nombre ON proveedores (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS lotes (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(30)   NOT NULL,
  producto            VARCHAR(120)  NOT NULL,
  fecha_produccion    DATE          NOT NULL,
  cantidad_producida  INTEGER       NOT NULL,
  proveedor_id        BIGINT        NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  muestra_minima      INTEGER       NOT NULL,          -- calculada con la regla vigente al registrar
  estado              VARCHAR(12)   NOT NULL DEFAULT 'pendiente',
  regla_decision      VARCHAR(3),                      -- regla de la última inspección
  fecha_decision      DATE,                            -- solo cuando el lote queda aprobado o rechazado
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT lotes_codigo_unico       UNIQUE (codigo),
  CONSTRAINT lotes_codigo_formato     CHECK (codigo ~ '^[A-Z0-9-]{3,30}$'),
  CONSTRAINT lotes_producto_minimo    CHECK (char_length(btrim(producto)) >= 2),
  CONSTRAINT lotes_cantidad_positiva  CHECK (cantidad_producida > 0),
  CONSTRAINT lotes_muestra_valida     CHECK (muestra_minima > 0 AND muestra_minima <= cantidad_producida),
  CONSTRAINT lotes_estado_valido      CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
  CONSTRAINT lotes_regla_valida       CHECK (regla_decision IS NULL OR regla_decision IN ('R2', 'R3', 'R4', 'R5', 'R6')),
  CONSTRAINT lotes_decision_coherente CHECK (
    (estado IN ('aprobado', 'rechazado') AND fecha_decision IS NOT NULL AND regla_decision IS NOT NULL) OR
    (estado = 'en_revision' AND fecha_decision IS NULL AND regla_decision = 'R4') OR
    (estado = 'pendiente' AND fecha_decision IS NULL AND regla_decision IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_lotes_estado    ON lotes (estado);
CREATE INDEX IF NOT EXISTS idx_lotes_proveedor ON lotes (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_lotes_decision  ON lotes (proveedor_id, estado, fecha_decision);

CREATE TABLE IF NOT EXISTS inspecciones (
  id                     BIGSERIAL     PRIMARY KEY,
  lote_id                UUID          NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  numero_inspeccion      SMALLINT      NOT NULL,
  fecha_inspeccion       DATE          NOT NULL,
  piezas_muestreadas     INTEGER       NOT NULL,
  piezas_defectuosas     INTEGER       NOT NULL,
  piezas_criticas        INTEGER       NOT NULL,
  porcentaje_defectuoso  NUMERIC(5,2)  GENERATED ALWAYS AS
                           (ROUND(piezas_defectuosas * 100.0 / piezas_muestreadas, 2)) STORED,
  resultado              VARCHAR(12)   NOT NULL,
  regla_aplicada         VARCHAR(3)    NOT NULL,
  observaciones          VARCHAR(500),
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT inspecciones_numero_valido        CHECK (numero_inspeccion IN (1, 2)),
  CONSTRAINT inspecciones_una_por_numero       UNIQUE (lote_id, numero_inspeccion),
  CONSTRAINT inspecciones_muestra_positiva     CHECK (piezas_muestreadas > 0),
  CONSTRAINT inspecciones_defectuosas_rango    CHECK (piezas_defectuosas BETWEEN 0 AND piezas_muestreadas),
  CONSTRAINT inspecciones_criticas_rango       CHECK (piezas_criticas BETWEEN 0 AND piezas_defectuosas),
  CONSTRAINT inspecciones_resultado_valido     CHECK (resultado IN ('aprobado', 'en_revision', 'rechazado')),
  CONSTRAINT inspecciones_regla_valida         CHECK (regla_aplicada IN ('R2', 'R3', 'R4', 'R5', 'R6')),
  CONSTRAINT inspecciones_segunda_sin_revision CHECK (NOT (numero_inspeccion = 2 AND resultado = 'en_revision'))
);
CREATE INDEX IF NOT EXISTS idx_inspecciones_lote ON inspecciones (lote_id, numero_inspeccion);

CREATE OR REPLACE FUNCTION calidad_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proveedores_updated_at ON proveedores;
CREATE TRIGGER trg_proveedores_updated_at BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION calidad_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_lotes_updated_at ON lotes;
CREATE TRIGGER trg_lotes_updated_at BEFORE UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION calidad_actualizar_updated_at();
```

### 7.3 M2 · Vista del historial y seguridad

```sql
-- M2: vista del historial y cierre de acceso público

CREATE OR REPLACE VIEW v_lotes
WITH (security_invoker = true) AS
SELECT
  l.*,
  p.nombre  AS proveedor_nombre,
  p.activo  AS proveedor_activo,
  ui.numero_inspeccion      AS ultima_numero,
  ui.fecha_inspeccion       AS ultima_fecha,
  ui.piezas_muestreadas     AS ultima_muestreadas,
  ui.piezas_defectuosas     AS ultima_defectuosas,
  ui.piezas_criticas        AS ultima_criticas,
  ui.porcentaje_defectuoso  AS ultimo_porcentaje,
  (SELECT COUNT(*) FROM inspecciones i2 WHERE i2.lote_id = l.id) AS total_inspecciones
FROM lotes l
JOIN proveedores p ON p.id = l.proveedor_id
LEFT JOIN LATERAL (
  SELECT i.numero_inspeccion, i.fecha_inspeccion, i.piezas_muestreadas,
         i.piezas_defectuosas, i.piezas_criticas, i.porcentaje_defectuoso
  FROM inspecciones i
  WHERE i.lote_id = l.id
  ORDER BY i.numero_inspeccion DESC
  LIMIT 1
) ui ON true;

ALTER TABLE proveedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON proveedores, lotes, inspecciones FROM anon, authenticated;
REVOKE ALL ON v_lotes FROM anon, authenticated;
```

Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas. Todo el acceso ocurre en el servidor mediante `DATABASE_URL`.

### 7.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `lotes_codigo_unico` | `CODIGO_DUPLICADO` |
| `23505` | `ux_proveedores_nombre` | `PROVEEDOR_DUPLICADO` |
| `23505` | `inspecciones_una_por_numero` | `INSPECCION_DUPLICADA` |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `LOTE_NO_MODIFICABLE` |
| `23514` | cualquier CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 8. Arquitectura del código

### 8.1 Capas

```text
Pantallas (app/calidad/*) ──┐
                            ├──► Rutas API (app/api/calidad/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─┘          │                                   │
                                       └──── lib/validacion (Zod)          └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reglas como funciones puras. No importan `pg`, no leen variables de entorno y no leen el reloj (excepto `ahoraBogota` en `fechas.ts`). Se prueban con Vitest. Los formularios también las usan para mostrar la muestra mínima y el resultado previsto antes de guardar.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única. Las rutas y las páginas importan datos solo desde aquí.
- Rutas API: validan con Zod, verifican la sesión, llaman a `dataService` y responden con `lib/http/respuestas.ts`.
- Las páginas (componentes de servidor) pueden leer con `dataService`. Las acciones que modifican datos se hacen desde componentes cliente que llaman a `/api/calidad/*` y luego ejecutan `router.refresh()` o navegan.

### 8.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_calidad_tablas.sql
supabase/migrations/NNNN_calidad_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/calidad.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/muestra.ts
lib/reglas/inspeccion.ts
lib/reglas/decision.ts
lib/reglas/lote.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesionUsuario.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/proveedores.ts
lib/datos/lotes.ts
lib/datos/inspecciones.ts
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/configuracion.test.ts
tests/reglas/muestra.test.ts
tests/reglas/inspeccion.test.ts
tests/reglas/decision.test.ts
tests/reglas/lote.test.ts
vitest.config.ts

app/page.tsx                                  (solo si hoy es la plantilla de Next.js)
app/calidad/layout.tsx
app/calidad/page.tsx                          (bandeja de trabajo)
app/calidad/lotes/page.tsx                    (historial)
app/calidad/lotes/nuevo/page.tsx
app/calidad/lotes/[codigo]/page.tsx           (detalle)
app/calidad/lotes/[codigo]/editar/page.tsx
app/calidad/lotes/[codigo]/inspeccion/page.tsx
app/calidad/proveedores/page.tsx

app/api/calidad/sesion/route.ts
app/api/calidad/bandeja/route.ts
app/api/calidad/proveedores/route.ts
app/api/calidad/proveedores/[id]/route.ts
app/api/calidad/lotes/route.ts
app/api/calidad/lotes/[codigo]/route.ts
app/api/calidad/lotes/[codigo]/inspecciones/route.ts

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Selector.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/calidad/NavegacionCalidad.tsx
components/calidad/InsigniaEstadoLote.tsx
components/calidad/InsigniaRegla.tsx
components/calidad/TablaLotes.tsx
components/calidad/FiltrosHistorial.tsx
components/calidad/FormularioLote.tsx
components/calidad/VistaMuestraMinima.tsx
components/calidad/FormularioInspeccion.tsx
components/calidad/VistaPreviaDecision.tsx
components/calidad/TarjetaResultado.tsx
components/calidad/TarjetaInspeccion.tsx
components/calidad/AccionesLote.tsx
components/calidad/TablaProveedores.tsx
components/calidad/FormularioProveedor.tsx
```

### 8.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio y con el plan funcional |
| Las reglas solo viven en `lib/reglas/` | Una sola fuente de verdad, probada con Vitest |
| Las decisiones usan comparaciones con enteros, nunca porcentajes con decimales | Sección 5.3 |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única de acceso a datos |
| Toda ruta `/api/calidad/*` llama `exigirUsuario()` como primera instrucción | Protección aunque falle el middleware |
| Fechas como texto `YYYY-MM-DD` entre capas | Evita errores de zona horaria (sección 12) |
| El código del lote se normaliza con `normalizarCodigo` antes de buscar o guardar | RN-09; las URLs usan el código normalizado |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 8.4 Configuración

```ts
// lib/config/calidad.ts
// Valores de las reglas en un solo lugar (sección 9 del plan funcional).
// Los umbrales son enteros: las reglas comparan con enteros (sección 5.3 del plan técnico).

export const PORCENTAJE_MUESTRA = 10;          // % de la cantidad producida (regla 1)
export const MUESTRA_MINIMA_PIEZAS = 20;       // mínimo de piezas a muestrear (regla 1)
export const UMBRAL_APROBACION_PCT = 3;        // se aprueba si el porcentaje es menor (regla 3)
export const UMBRAL_RECHAZO_PCT = 5;           // se rechaza si el porcentaje es mayor (regla 6)
export const MAX_INSPECCIONES = 2;             // no existe tercera inspección (regla 5)
export const DIAS_VENTANA_ALERTA = 30;         // ventana de la alerta por proveedor (regla 7, opcional)
export const LOTES_RECHAZADOS_PARA_ALERTA = 3; // rechazos que activan la alerta (regla 7, opcional)
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_HISTORIAL = 200;           // filas máximas por consulta del historial
```

### 8.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'PROVEEDOR_NO_ENCONTRADO' | 'PROVEEDOR_DUPLICADO' | 'PROVEEDOR_INACTIVO'
  | 'LOTE_NO_ENCONTRADO' | 'CODIGO_DUPLICADO' | 'FECHA_FUTURA' | 'LOTE_CERRADO' | 'LOTE_NO_MODIFICABLE'
  | 'MUESTRA_INSUFICIENTE' | 'MUESTRA_EXCEDE_LOTE' | 'DEFECTUOSAS_EXCEDEN_MUESTRA' | 'CRITICAS_EXCEDEN_DEFECTUOSAS'
  | 'INSPECCION_DUPLICADA' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 9.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 9.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function ahoraBogota(reloj?: Date): { fecha: string; hora: string };
export function hoyBogota(reloj?: Date): string;                     // 'YYYY-MM-DD'
export function sumarDias(fecha: string, dias: number): string;
export function diasEntre(desde: string, hasta: string): number;     // hasta - desde

// lib/reglas/muestra.ts
export function calcularMuestraMinima(cantidadProducida: number): number;
export function explicarMuestraMinima(cantidadProducida: number): string;
// 195 → "10 % de 195 = 19,5, redondeado a 20. Se aplica el mínimo de 20 piezas: muestra mínima de 20."
// 15  → "El lote tiene menos de 20 piezas: se inspecciona el lote completo (15 piezas)."
// 1100 → "10 % de 1100 = 110. Muestra mínima de 110 piezas."

// lib/reglas/inspeccion.ts
export function validarLoteAdmiteInspeccion(estado: EstadoLote): 1 | 2;  // LOTE_CERRADO
export function validarInspeccion(d: {
  cantidad: number; muestraMinima: number; muestreadas: number; defectuosas: number; criticas: number;
}): void;
// Orden: enteros no negativos (DATOS_INVALIDOS) → MUESTRA_INSUFICIENTE → MUESTRA_EXCEDE_LOTE
//        → DEFECTUOSAS_EXCEDEN_MUESTRA → CRITICAS_EXCEDEN_DEFECTUOSAS

// lib/reglas/decision.ts
export type EstadoLote = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
export type ResultadoInspeccion = 'aprobado' | 'en_revision' | 'rechazado';
export type ReglaAplicada = 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
export type AccionLote = 'REGISTRAR_INSPECCION' | 'EDITAR_LOTE' | 'ELIMINAR_LOTE';
export const ETIQUETA_ESTADO: Record<EstadoLote, string>;                 // sección 4.2
export const DESCRIPCION_REGLA: Record<ReglaAplicada, string>;            // "Regla 2 · Defecto crítico", etc.
export function calcularPorcentaje(defectuosas: number, muestreadas: number): number; // 2 decimales, solo para mostrar
export function clasificarPorcentaje(defectuosas: number, muestreadas: number): 'bajo' | 'zona' | 'alto'; // enteros
export function decidirResultado(d: {
  numeroInspeccion: 1 | 2; muestreadas: number; defectuosas: number; criticas: number;
}): { resultado: ResultadoInspeccion; regla: ReglaAplicada; explicacion: string };
export function accionesPermitidas(estado: EstadoLote, totalInspecciones: number): AccionLote[]; // sección 4.3

// lib/reglas/lote.ts
export function normalizarCodigo(codigo: string): string;                // trim + mayúsculas
export function validarFechaProduccion(fecha: string, hoy: string): void; // FECHA_FUTURA
```

Orden de evaluación en `decidirResultado` (la primera condición que se cumple decide):

1. `criticas >= 1` → `rechazado`, R2.
2. `clasificarPorcentaje` es `bajo` → `aprobado`, R3.
3. `zona` y `numeroInspeccion === 1` → `en_revision`, R4.
4. `zona` y `numeroInspeccion === 2` → `rechazado`, R5.
5. `alto` → `rechazado`, R6.

### 8.6 Firmas de `dataService`

```ts
// Proveedores
listarProveedores(f?: { incluirInactivos?: boolean }): Promise<FilaProveedor[]>
crearProveedor(nombre: string): Promise<{ id: number }>
actualizarProveedor(id: number, cambios: { nombre?: string; activo?: boolean }): Promise<void>

// Lotes
registrarLote(d: DatosLote): Promise<{ codigo: string; muestraMinima: number }>
actualizarLote(codigo: string, d: DatosLote): Promise<{ codigo: string; muestraMinima: number }>
eliminarLote(codigo: string): Promise<void>
obtenerDetalleLote(codigo: string): Promise<DetalleLote>
listarHistorial(f: { estado?: EstadoLote; proveedorId?: number; codigo?: string }): Promise<FilaLote[]>
obtenerBandeja(): Promise<{ pendientes: FilaLote[]; enRevision: FilaLote[] }>

// Inspecciones
registrarInspeccion(codigo: string, d: DatosInspeccion): Promise<ResultadoRegistroInspeccion>
```

Tipos de salida principales (`lib/datos/tipos.ts`):

```ts
interface FilaProveedor { id: number; nombre: string; activo: boolean; totalLotes: number }

interface FilaLote {
  codigo: string; producto: string; proveedor: string; fechaProduccion: string;
  cantidadProducida: number; muestraMinima: number; estado: EstadoLote; totalInspecciones: number;
  ultima: { numero: number; fecha: string; muestreadas: number; defectuosas: number;
            criticas: number; porcentaje: number } | null;
}

interface DetalleLote {
  lote: { codigo: string; producto: string; fechaProduccion: string; cantidadProducida: number;
          proveedorId: number; proveedor: string; muestraMinima: number; explicacionMuestra: string;
          estado: EstadoLote; reglaDecision: ReglaAplicada | null; fechaDecision: string | null; creadoEn: string };
  inspecciones: Array<{ numero: 1 | 2; fecha: string; muestreadas: number; defectuosas: number; criticas: number;
                        porcentaje: number; resultado: ResultadoInspeccion; regla: ReglaAplicada;
                        explicacion: string; observaciones: string | null }>;
  acciones: AccionLote[];
  siguienteNumeroInspeccion: 1 | 2 | null;
}

interface ResultadoRegistroInspeccion {
  numeroInspeccion: 1 | 2; porcentaje: number; estadoLote: ResultadoInspeccion;
  decision: { resultado: ResultadoInspeccion; regla: ReglaAplicada; explicacion: string };
}
```

La explicación de cada inspección guardada se reconstruye con `decidirResultado` a partir de sus piezas y su número; no se guarda el texto.

### 8.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids y COUNT) → number
types.setTypeParser(1700, (v) => parseFloat(v));     // NUMERIC (porcentaje) → number, solo para mostrar

const globalParaPool = globalThis as unknown as { poolCalidad?: Pool };

export const pool = globalParaPool.poolCalidad ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolCalidad = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  // BEGIN → trabajo(tx) → COMMIT; en error: ROLLBACK y relanzar; siempre release()
}
```

`DATABASE_URL` es la cadena del pooler en modo transacción de Supabase (puerto 6543).

---

## 9. Contratos de API

### 9.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "MUESTRA_INSUFICIENTE", "mensaje": "La muestra debe tener al menos 20 piezas.", "detalles": { "muestraMinima": 20 } } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 9.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `PROVEEDOR_NO_ENCONTRADO` | 404 | El proveedor no existe. |
| `PROVEEDOR_DUPLICADO` | 409 | Ya existe un proveedor con ese nombre. |
| `PROVEEDOR_INACTIVO` | 409 | El proveedor está inactivo y no se puede asignar a lotes nuevos. |
| `LOTE_NO_ENCONTRADO` | 404 | No existe un lote con ese código. |
| `CODIGO_DUPLICADO` | 409 | Ya existe un lote con ese código. |
| `FECHA_FUTURA` | 422 | La fecha de producción no puede ser posterior a hoy. |
| `LOTE_CERRADO` | 409 | El lote ya está aprobado o rechazado y no admite más inspecciones. |
| `LOTE_NO_MODIFICABLE` | 409 | El lote ya tiene inspecciones y no se puede modificar ni eliminar. |
| `MUESTRA_INSUFICIENTE` | 422 | La muestra debe tener al menos {muestraMinima} piezas. |
| `MUESTRA_EXCEDE_LOTE` | 422 | La muestra no puede superar la cantidad producida ({cantidad} piezas). |
| `DEFECTUOSAS_EXCEDEN_MUESTRA` | 422 | Las piezas defectuosas no pueden superar las muestreadas. |
| `CRITICAS_EXCEDEN_DEFECTUOSAS` | 422 | Las piezas críticas no pueden superar las defectuosas: toda pieza crítica también es defectuosa. |
| `INSPECCION_DUPLICADA` | 409 | Esta inspección ya fue registrada. Actualice la página. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

Los mensajes con `{...}` se completan con los valores de `detalles`.

### 9.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/calidad/sesion` | | `{ nombre, correo }` |
| `GET /api/calidad/bandeja` | | `{ pendientes: FilaLote[], enRevision: FilaLote[] }` |
| `GET /api/calidad/proveedores?incluirInactivos=true` | | `FilaProveedor[]` |
| `POST /api/calidad/proveedores` | `{ nombre }` | `{ id }` (201) |
| `PATCH /api/calidad/proveedores/[id]` | `{ nombre?, activo? }` | `{ actualizado: true }` |
| `GET /api/calidad/lotes?estado=&proveedorId=&codigo=` | | `FilaLote[]` |
| `POST /api/calidad/lotes` | `{ codigo, producto, fechaProduccion, cantidadProducida, proveedorId }` | `{ codigo, muestraMinima }` (201) |
| `GET /api/calidad/lotes/[codigo]` | | `DetalleLote` |
| `PATCH /api/calidad/lotes/[codigo]` | mismos campos de POST | `{ codigo, muestraMinima }` |
| `DELETE /api/calidad/lotes/[codigo]` | | `{ eliminado: true }` |
| `POST /api/calidad/lotes/[codigo]/inspecciones` | `{ piezasMuestreadas, piezasDefectuosas, piezasCriticas, observaciones? }` | `ResultadoRegistroInspeccion` (201) |

### 9.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaCodigoLote` | texto, `trim`, `toUpperCase`, `^[A-Z0-9-]{3,30}$`, mensaje "Use de 3 a 30 letras, números o guiones" |
| `esquemaFecha` | `^\d{4}-\d{2}-\d{2}$` y fecha real |
| `esquemaEntero(min)` | `z.coerce.number().int().min(min)` con mensajes en español |
| `esquemaProveedor` | nombre recortado de 2 a 120 caracteres |
| `esquemaCambiosProveedor` | nombre opcional, activo opcional; al menos uno |
| `esquemaLote` | codigo, producto (2 a 120, recortado), fechaProduccion, cantidadProducida entero ≥ 1, proveedorId entero ≥ 1 |
| `esquemaInspeccion` | piezasMuestreadas entero ≥ 1, piezasDefectuosas entero ≥ 0, piezasCriticas entero ≥ 0, observaciones opcional (máximo 500) |
| `esquemaFiltrosHistorial` | estado opcional (enum), proveedorId opcional (entero), codigo opcional (máximo 30) |

Las comparaciones entre campos (defectuosas contra muestreadas, muestra contra cantidad) las hace `validarInspeccion`, porque dependen del lote guardado.

---

## 10. Pantallas

### 10.1 Mapa

| Ruta | Contenido |
|---|---|
| Layout `/calidad` | Verifica la sesión con `obtenerUsuario()`; sin sesión redirige al login. Barra superior con el nombre del sistema, navegación (Bandeja, Historial, Registrar lote, Proveedores), nombre del usuario y botón de cerrar sesión del login existente. En móvil, menú desplegable. |
| `/calidad` · Bandeja | Botón principal "Registrar lote". Tabla "Pendientes de inspección": código, producto, proveedor, cantidad, muestra mínima, botón "Inspeccionar". Tabla "En revisión: requieren segunda inspección": código, producto, proveedor, primera inspección (fracción y porcentaje), botón "Segunda inspección". Estados vacíos con texto propio. Sin indicadores ni gráficas (quedan fuera de alcance). |
| `/calidad/lotes` · Historial | Filtros: estado, proveedor (incluye inactivos) y búsqueda por código; se reflejan en la URL. Tabla: código (enlace al detalle), producto, proveedor, fecha de producción, última inspección ("6 de 200 · 3,00 %"), inspecciones ("1 de 2"), estado. Ordenado del más reciente al más antiguo; máximo `LIMITE_HISTORIAL` filas con aviso si se alcanza. |
| `/calidad/lotes/nuevo` | `FormularioLote`: código (se convierte a mayúsculas al escribir), producto, fecha de producción (por defecto hoy, máximo hoy), cantidad producida, proveedor (selector de activos con botón "Agregar proveedor" que abre un modal). `VistaMuestraMinima` muestra en vivo la muestra mínima y su explicación. Al guardar, navega al detalle con un aviso de éxito. |
| `/calidad/lotes/[codigo]` · Detalle | Encabezado: código e insignia de estado. Tarjeta de datos: producto, proveedor, fecha de producción, cantidad, muestra mínima con su explicación. Si el lote está cerrado: tarjeta de decisión final con estado, regla (`InsigniaRegla`) y fecha de decisión. Lista de inspecciones (`TarjetaInspeccion`): número, fecha, muestreadas, defectuosas, críticas, fracción y porcentaje, resultado, regla y explicación, observaciones. `AccionesLote`: solo las acciones de la sección 4.3. Eliminar pide confirmación. |
| `/calidad/lotes/[codigo]/editar` | `FormularioLote` en modo edición. Si el lote no admite edición, muestra el aviso de `LOTE_NO_MODIFICABLE` y un enlace al detalle. |
| `/calidad/lotes/[codigo]/inspeccion` | Resumen del lote. Indicador del número de inspección: en la segunda, aviso "Use una muestra nueva. Si el resultado vuelve a quedar entre 3 % y 5 %, el lote se rechaza". `FormularioInspeccion`: muestreadas (con la muestra mínima visible), defectuosas, críticas, observaciones. `VistaPreviaDecision` en vivo: errores de `validarInspeccion` junto al campo correspondiente, fracción y porcentaje, resultado previsto con su regla y explicación. Botón "Registrar inspección" que abre un modal de confirmación ("La inspección no se puede modificar después de registrarla"). Tras guardar, `TarjetaResultado` reemplaza el formulario: estado grande con su color, regla, explicación y enlaces "Ver lote", "Volver a la bandeja" y, si quedó en revisión, "Registrar segunda inspección". Si el lote está cerrado, aviso de `LOTE_CERRADO` y enlace al detalle. |
| `/calidad/proveedores` | Tabla: nombre, estado (activo o inactivo), lotes registrados, acciones Renombrar y Activar/Desactivar. Formulario para agregar proveedor. |

### 10.2 Textos fijos

Vista previa antes de guardar:

> Resultado previsto. Se confirma al registrar la inspección.

Confirmación:

> La inspección no se puede modificar ni eliminar después de registrarla. Revise las cantidades antes de confirmar.

---

## 11. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1F4E5F` | Botones principales, barra superior |
| `--color-primario-suave` | `#E6EEF1` | Fondos de selección, hover |
| `--color-aprobado` | `#2F7D4F` | Estado aprobado, regla 3 |
| `--color-revision` | `#B7791F` | Estado en revisión, regla 4 |
| `--color-rechazado` | `#B83232` | Estado rechazado, reglas 2, 5 y 6, errores |
| `--color-pendiente` | `#5B6770` | Estado pendiente |
| `--color-fondo` | `#F5F6F7` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas, modales |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes del login. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

| Insignia | Fondo / texto |
|---|---|
| `pendiente` | gris claro / `--color-pendiente` |
| `en_revision` | ámbar claro / `--color-revision` |
| `aprobado` | verde claro / `--color-aprobado` |
| `rechazado` | rojo claro / `--color-rechazado` |
| Regla (R2 a R6) | borde del color del resultado, texto "Regla 2 · Defecto crítico" |

Criterios: tipografía del proyecto (si no hay, Inter con `next/font`); números de piezas y porcentajes con fuente de ancho fijo (`tabular-nums`); porcentajes con `Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`; fechas con `Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })` sobre fechas `YYYY-MM-DD`; bordes redondeados de 8 px; sin emojis; tablas convertidas en tarjetas apiladas en pantallas menores a 640 px. El estado nunca se comunica solo con color: la insignia siempre lleva el texto.

---

## 12. Fechas y zona horaria

Vercel ejecuta el servidor en UTC; Colombia está en UTC-5 sin horario de verano. Si "hoy" se calcula en UTC, entre las 19:00 y la medianoche una inspección quedaría con la fecha del día siguiente y una fecha de producción de hoy sería rechazada como futura.

| Regla | Implementación |
|---|---|
| "Hoy" | Solo con `hoyBogota()` (usa `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })`) |
| Fechas entre capas | Texto `YYYY-MM-DD` |
| Lectura desde BD | Parsers de `pg` devuelven texto (sección 8.7) |
| Diferencia de días | `diasEntre` con `Date.UTC` sobre ambas fechas, dividido entre 86 400 000 |
| Campo de fecha del formulario | `max` igual a `hoyBogota()` |

---

## 13. Seguridad e integridad de los registros

| Medida | Detalle |
|---|---|
| Acceso solo con sesión | Middleware o proxy existente y `exigirUsuario()` en cada ruta de `/api/calidad` |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Validación en tres puntos | Formulario (Zod y reglas puras), API (Zod y reglas puras) y base de datos (CHECK, UNIQUE, llaves foráneas) |
| Inspecciones inmutables | No existe ruta para editarlas ni eliminarlas; la llave foránea impide borrar un lote con inspecciones |
| Número de inspección controlado | Asignado por el sistema con el lote bloqueado (`FOR UPDATE`) y protegido por `inspecciones_una_por_numero` |
| Coherencia del estado | `lotes_decision_coherente` impide un lote cerrado sin fecha de decisión o en revisión con una regla distinta de R4 |
| SQL parametrizado | Ningún valor se concatena en una consulta |
| Errores internos | Se registran con `console.error` en el servidor; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 14. Pruebas

### 14.1 Pruebas unitarias de reglas (Vitest)

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `calcularMuestraMinima` | 195 | 20 |
| T-02 | `calcularMuestraMinima` | 15 | 15 |
| T-03 | `calcularMuestraMinima` | 20 | 20 |
| T-04 | `calcularMuestraMinima` | 200 | 20 |
| T-05 | `calcularMuestraMinima` | 201 | 21 |
| T-06 | `calcularMuestraMinima` | 1100 | 110 |
| T-07 | `calcularMuestraMinima` | 1 | 1 |
| T-08 | `validarInspeccion` | lote 200, mínimo 20, muestreadas 19 | `MUESTRA_INSUFICIENTE` |
| T-09 | `validarInspeccion` | lote 200, mínimo 20, muestreadas 201 | `MUESTRA_EXCEDE_LOTE` |
| T-10 | `validarInspeccion` | muestreadas 20, defectuosas 21 | `DEFECTUOSAS_EXCEDEN_MUESTRA` |
| T-11 | `validarInspeccion` | muestreadas 20, defectuosas 2, críticas 3 | `CRITICAS_EXCEDEN_DEFECTUOSAS` |
| T-12 | `validarInspeccion` | defectuosas -1 | `DATOS_INVALIDOS` |
| T-13 | `validarInspeccion` | muestreadas 20,5 | `DATOS_INVALIDOS` |
| T-14 | `validarInspeccion` | lote 200, mínimo 20, muestreadas 20, defectuosas 0, críticas 0 | sin error |
| T-15 | `validarLoteAdmiteInspeccion` | `pendiente` | 1 |
| T-16 | `validarLoteAdmiteInspeccion` | `en_revision` | 2 |
| T-17 | `validarLoteAdmiteInspeccion` | `aprobado` | `LOTE_CERRADO` |
| T-18 | `validarLoteAdmiteInspeccion` | `rechazado` | `LOTE_CERRADO` |
| T-19 | `decidirResultado` | inspección 1: 6 de 200 (3,00 %), 0 críticas | `en_revision`, R4 |
| T-20 | `decidirResultado` | inspección 1: 10 de 200 (5,00 %), 0 críticas | `en_revision`, R4 |
| T-21 | `decidirResultado` | inspección 1: 1 de 50 (2,00 %), 1 crítica | `rechazado`, R2 |
| T-22 | `decidirResultado` | inspección 1: 5 de 200 (2,50 %) | `aprobado`, R3 |
| T-23 | `decidirResultado` | inspección 1: 11 de 200 (5,50 %) | `rechazado`, R6 |
| T-24 | `decidirResultado` | inspección 1: 0 de 20 | `aprobado`, R3 |
| T-25 | `decidirResultado` | inspección 2: 8 de 200 (4,00 %) | `rechazado`, R5 |
| T-26 | `decidirResultado` | inspección 2: 4 de 200 (2,00 %) | `aprobado`, R3 |
| T-27 | `decidirResultado` | inspección 2: 3 de 200, 1 crítica | `rechazado`, R2 |
| T-28 | `decidirResultado` | inspección 2: 12 de 200 (6,00 %) | `rechazado`, R6 |
| T-29 | `decidirResultado` | 3 % exacto con n = 100, 200, 300 y 1000 (3, 6, 9 y 30 defectuosas); 5 % exacto con n = 20, 100, 200, 300 y 1000 (1, 5, 10, 15 y 50) | `en_revision`, R4 en todos los casos |
| T-30 | `decidirResultado` | 29 de 1000 (2,90 %) / 51 de 1000 (5,10 %) | `aprobado` R3 / `rechazado` R6 |
| T-31 | `calcularPorcentaje` | 1 de 30 / 6 de 200 | 3,33 / 3 |
| T-32 | `accionesPermitidas` | (`pendiente`, 0) / (`en_revision`, 1) / (`aprobado`, 1) | las tres acciones / solo `REGISTRAR_INSPECCION` / ninguna |
| T-33 | `normalizarCodigo` | `' cal-001 '` | `'CAL-001'` |
| T-34 | `validarFechaProduccion` | fecha 2030-01-03 con hoy 2030-01-02 / fecha igual a hoy | `FECHA_FUTURA` / sin error |
| T-35 | Configuración | umbrales de `lib/config/calidad.ts` | enteros y `UMBRAL_APROBACION_PCT < UMBRAL_RECHAZO_PCT` |

Comando: `npm test`. Las 35 pruebas deben pasar antes de continuar con la fase 3.

### 14.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` directamente con lotes de código `PRUEBA-` y el proveedor "Proveedor de prueba 9999". Imprime `OK` o `FALLA` por paso y, al final, borra los datos de prueba con `npm run db:limpiar`.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear proveedor "Proveedor de prueba 9999" | Creado |
| 2 | Crear "PROVEEDOR DE PRUEBA 9999" | `PROVEEDOR_DUPLICADO` |
| 3 | Registrar lote `PRUEBA-001` de 200 piezas | `pendiente`, muestra mínima 20 |
| 4 | Registrar otra vez `prueba-001` | `CODIGO_DUPLICADO` |
| 5 | Inspección de `PRUEBA-001` con 19 muestreadas | `MUESTRA_INSUFICIENTE` |
| 6 | Inspección: 20 muestreadas, 1 defectuosa, 0 críticas | Número 1, `en_revision`, R4 |
| 7 | Editar `PRUEBA-001` | `LOTE_NO_MODIFICABLE` |
| 8 | Inspección: 20 muestreadas, 0 defectuosas | Número 2, `aprobado`, R3, fecha de decisión igual a hoy |
| 9 | Tercera inspección de `PRUEBA-001` | `LOTE_CERRADO` |
| 10 | Lote `PRUEBA-002` de 1000: inspección 3 de 100, luego 4 de 100 | `en_revision` R4, luego `rechazado` R5 |
| 11 | Lote `PRUEBA-003` de 500: inspección 1 de 50 con 1 crítica | `rechazado`, R2 |
| 12 | Historial con estado `rechazado` y el proveedor de prueba | Contiene `PRUEBA-002` y `PRUEBA-003`; no contiene `PRUEBA-001` |
| 13 | Detalle de `PRUEBA-002` | 2 inspecciones con porcentajes 3 y 4; sin acciones |
| 14 | Registrar `PRUEBA-004` y eliminarlo; eliminar `PRUEBA-001` | Eliminado / `LOTE_NO_MODIFICABLE` |

### 14.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md` con resultado y evidencia por fila.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Crear los proveedores "Polímeros Uno" y "Resinas Dos" | Aparecen en Proveedores |
| A-02 | Registrar `CAL-001` (200 piezas, Polímeros Uno) | Muestra mínima 20 con su explicación |
| A-03 | Registrar otra vez `cal-001` | Rechazo por código duplicado |
| A-04 | Registrar `CAL-006` (15 piezas, Resinas Dos) | Muestra mínima 15: lote completo |
| A-05 | Registrar `CAL-007` (195 piezas, Polímeros Uno) y revisar la explicación | "19,5, redondeado a 20" |
| A-06 | Inspeccionar `CAL-001` con 19 muestreadas | El formulario lo marca y el botón no permite registrar |
| A-07 | Inspeccionar `CAL-001`: 20, 0, 0 | Aprobado, regla 3 |
| A-08 | Intentar inspeccionar `CAL-001` de nuevo | La acción no aparece; la ruta de inspección muestra que el lote está cerrado |
| A-09 | Registrar `CAL-002` (200, Polímeros Uno); inspección 20, 1, 0 | En revisión (5,00 %), regla 4; aparece en la bandeja como "requiere segunda inspección" |
| A-10 | Segunda inspección de `CAL-002`: 20, 0, 0 | Aprobado, regla 3 |
| A-11 | Registrar `CAL-003` (1000, Resinas Dos); inspección 100, 3, 0; segunda 100, 4, 0 | En revisión (3,00 %), luego rechazado, regla 5 |
| A-12 | Registrar `CAL-004` (500, Resinas Dos); inspección 50, 1, 1 | Rechazado, regla 2, aunque el porcentaje es 2,00 % |
| A-13 | Registrar `CAL-005` (300, Polímeros Uno); inspección 30, 2, 0 | Rechazado, regla 6 (6,67 %) |
| A-14 | Inspeccionar `CAL-006`: 16 muestreadas | Error: la muestra supera la cantidad producida |
| A-15 | Inspeccionar `CAL-006`: 15, 2, 3 | Error: críticas mayores que defectuosas |
| A-16 | Editar `CAL-007` cambiando la cantidad a 210 | Muestra mínima 21 |
| A-17 | Historial filtrado por "Rechazado" | `CAL-003`, `CAL-004` y `CAL-005` |
| A-18 | Historial filtrado por "Resinas Dos" | `CAL-003`, `CAL-004` y `CAL-006` |
| A-19 | Desactivar "Resinas Dos" e intentar registrar un lote con ese proveedor | No aparece en el selector; sus lotes siguen en el historial |
| A-20 | Cerrar el navegador, volver a entrar y abrir `CAL-003` | Las dos inspecciones y la decisión siguen guardadas |
| A-21 | Abrir `/calidad` en una ventana privada | Redirección al login |

---

## 15. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base verificada | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas`, 35 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, respuestas, esquemas, formato; `/api/calidad/sesion` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas de API; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, bandeja, proveedores, lotes, historial, detalle e inspección | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | P09 | `ACEPTACION.md` con A-01 a A-21; README actualizado | `FASE_6_COMPLETADA.md` |
| 7 · Opcional | P10 | Alerta por proveedor (sección 16) | `FASE_7_COMPLETADA.md` |

Condiciones entre fases:

- No se inicia una fase si la anterior no tiene su archivo de cierre.
- `npm run build` debe terminar sin errores al final de cada prompt.
- `npm test` debe pasar al final de cada prompt desde P02.
- Cada prompt termina con un commit del estudiante y un `git push`; Vercel despliega en cada push y un fallo de despliegue se corrige antes del siguiente prompt.

---

## 16. Funcionalidad opcional: alerta por proveedor

Se desarrolla solo con la fase 6 cerrada.

| Elemento | Definición |
|---|---|
| Regla | Un proveedor queda en alerta si tiene 3 o más lotes rechazados con `fecha_decision` dentro de los últimos 30 días calendario: desde hoy menos 29 días hasta hoy, ambos incluidos |
| Función pura | `evaluarAlertaProveedor(fechasRechazo: string[], hoy: string): { enAlerta: boolean; rechazosEnVentana: number }` en `lib/reglas/alerta.ts`, usando `DIAS_VENTANA_ALERTA` y `LOTES_RECHAZADOS_PARA_ALERTA` |
| Datos | `obtenerFechasRechazoProveedor(proveedorId, desde)` y `listarProveedoresEnAlerta()` en `lib/datos/proveedores.ts` |
| Momento de evaluación | Al registrar una inspección que deja el lote `rechazado`; la respuesta incluye `alertaProveedor: { proveedor, rechazosEnVentana } \| null` |
| Pantallas | `TarjetaResultado` muestra un Aviso de advertencia "Proveedor en alerta de calidad: {n} lotes rechazados en los últimos 30 días". La tabla de proveedores muestra la insignia "En alerta". La bandeja muestra un recuadro con los proveedores en alerta, si hay |
| Alcance | El sistema solo avisa; no bloquea al proveedor ni cambia lotes (sección 7 del plan funcional) |

Pruebas adicionales:

| ID | Entrada | Esperado |
|---|---|---|
| T-36 | 3 rechazos hace 0, 10 y 29 días | `enAlerta: true`, 3 |
| T-37 | 3 rechazos hace 0, 10 y 30 días | `enAlerta: false`, 2 |
| T-38 | 2 rechazos hace 1 y 2 días | `enAlerta: false`, 2 |
| T-39 | Lista vacía | `enAlerta: false`, 0 |

---

## 17. Glosario

| Término | Definición |
|---|---|
| Lote | Conjunto de piezas producidas en una corrida, identificado por un código |
| Muestra mínima | Número mínimo de piezas que se deben inspeccionar en un lote (regla 1) |
| Pieza defectuosa | Pieza fuera de la tolerancia del plano |
| Pieza crítica | Pieza defectuosa cuyo defecto obliga a rechazar el lote (regla 2); toda pieza crítica también se cuenta como defectuosa |
| Porcentaje defectuoso | Defectuosas sobre muestreadas por 100; se calcula, no se digita |
| Zona de revisión | Porcentaje entre 3 % y 5 % inclusive, sin piezas críticas |
| Decisión final | Estado aprobado o rechazado; el lote ya no admite inspecciones |
| Regla aplicada | Código R2 a R6 que explica por qué el lote quedó en su estado |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
