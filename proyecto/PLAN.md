# Plan de Proyecto: Control de Calidad por Lotes

## 1. La situación actual

En una planta de producción pequeña o mediana (por ejemplo, una fábrica que produce piezas plásticas inyectadas, envases o componentes en serie), el control de calidad de los lotes se hace de forma manual. Un inspector toma una muestra de piezas de cada lote terminado, las revisa una por una y anota en una planilla de papel o en una hoja de Excel cuántas piezas resultaron defectuosas y de qué tipo fue el defecto.

La decisión de si un lote pasa o no depende del criterio del inspector en el momento, sin un registro sistemático de qué regla se aplicó. Cuando hay que verificar después por qué se aprobó o rechazó un lote específico, la información está dispersa entre planillas físicas, y en muchos casos no se guarda el detalle de cuántas piezas se revisaron ni qué tipo de defecto se encontró.

Tampoco existe un registro histórico que permita ver si un proveedor de materia prima está generando más lotes rechazados que otros a lo largo del tiempo; eso solo se nota "de memoria" cuando alguien lo comenta en una reunión.

## 2. El problema

- **Inconsistencia en las decisiones**: dos inspectores pueden aplicar criterios distintos ante el mismo porcentaje de piezas defectuosas, porque la regla no está escrita en ningún lugar accesible.
- **Pérdida de trazabilidad**: si un cliente reclama por un producto defectuoso semanas después, es difícil reconstruir si el lote correspondiente pasó control de calidad y bajo qué condiciones.
- **Detección tardía de proveedores problemáticos**: no hay una forma sistemática de ver que un proveedor de materia prima acumula varios lotes rechazados, lo que retrasa decisiones de cambio de proveedor.
- **A quién le afecta**: al área de calidad y producción de la planta (pierden tiempo reconstruyendo información y corrigen problemas tarde), y en última instancia a los clientes, que reciben productos con calidad inconsistente.

## 3. Qué hará el sistema

1. Registrar un lote de producción con sus datos básicos.
2. Registrar la inspección de una muestra tomada de un lote.
3. Calcular el porcentaje de piezas defectuosas y determinar el resultado del lote (aprobado, rechazado o en revisión).
4. Consultar el historial de lotes y filtrarlos por estado o por proveedor.
5. Alertar cuando un proveedor acumula demasiados lotes rechazados en un periodo reciente. *(opcional)*
6. Generar un resumen de indicadores de calidad por periodo (porcentaje de lotes aprobados, rechazados y en revisión). *(opcional)*

## 4. Entradas, procesos y salidas

### 4.1 Registrar un lote de producción
- **Entradas**: código del lote, producto, fecha de producción, cantidad de piezas producidas, proveedor de la materia prima.
- **Proceso**: el sistema valida que el código no exista ya, que la cantidad producida sea mayor a cero, y crea el registro del lote con estado inicial "pendiente de inspección".
- **Salidas**: confirmación de que el lote quedó registrado, con su código y estado.

### 4.2 Registrar la inspección de una muestra
- **Entradas**: código del lote a inspeccionar, cantidad de piezas muestreadas, cantidad de piezas defectuosas, tipo de defecto encontrado (ninguno, menor, mayor o crítico).
- **Proceso**: el sistema verifica que el lote exista y esté "pendiente de inspección"; valida que las piezas muestreadas cumplan el mínimo exigido por la regla de muestreo (ver sección 6); calcula el porcentaje de piezas defectuosas sobre la muestra.
- **Salidas**: el registro de la inspección queda guardado, asociado al lote.

### 4.3 Calcular resultado del lote
- **Entradas**: el porcentaje de piezas defectuosas calculado y el tipo de defecto reportado en la inspección.
- **Proceso**: se aplican las reglas de la sección 6 en orden (defecto crítico primero, luego los umbrales de porcentaje) para determinar si el lote pasa a estado "aprobado", "rechazado" o "en revisión".
- **Salidas**: el estado final del lote, visible en su registro, junto con la fecha en que se determinó.

### 4.4 Consultar historial de lotes
- **Entradas**: filtros opcionales (estado del lote, proveedor, rango de fechas).
- **Proceso**: el sistema busca en los lotes registrados y aplica los filtros indicados.
- **Salidas**: una lista de lotes con su código, producto, proveedor, porcentaje defectuoso y estado.

### 4.5 Alertar por proveedor problemático *(opcional)*
- **Entradas**: el registro histórico de lotes rechazados por proveedor.
- **Proceso**: cada vez que un lote queda "rechazado", el sistema cuenta cuántos lotes de ese mismo proveedor fueron rechazados en los últimos 30 días.
- **Salidas**: si el conteo alcanza el umbral definido en la regla, se genera una alerta marcando al proveedor como "en alerta de calidad".

### 4.6 Resumen de indicadores por periodo *(opcional)*
- **Entradas**: rango de fechas a consultar.
- **Proceso**: el sistema cuenta los lotes en ese rango agrupados por estado (aprobado, rechazado, en revisión) y calcula el porcentaje que representa cada grupo sobre el total.
- **Salidas**: un resumen con el total de lotes inspeccionados y el porcentaje en cada estado.

## 5. Datos que se manejan

**Lote**
| Campo | Tipo |
|---|---|
| código | texto (único) |
| producto | texto |
| fecha_producción | fecha |
| cantidad_producida | entero |
| proveedor | texto |
| estado | texto (pendiente / aprobado / rechazado / en revisión) |

**Inspección**
| Campo | Tipo |
|---|---|
| código_lote | texto (referencia al lote) |
| fecha_inspección | fecha |
| piezas_muestreadas | entero |
| piezas_defectuosas | entero |
| tipo_defecto | texto (ninguno / menor / mayor / crítico) |
| porcentaje_defectuoso | decimal (calculado) |

**Proveedor** *(usado solo si se construye la funcionalidad opcional 5)*
| Campo | Tipo |
|---|---|
| nombre | texto |
| lotes_rechazados_30_días | entero (calculado) |
| en_alerta | booleano |

## 6. Reglas del sistema

1. **Tamaño de la muestra**: se debe inspeccionar al menos el 10 % de las piezas producidas, con un mínimo absoluto de 20 piezas si el 10 % da un número menor. Ejemplo: un lote de 150 piezas exige muestrear al menos 20 (porque el 10 % serían 15, por debajo del mínimo); un lote de 500 piezas exige muestrear al menos 50.
2. **Rechazo automático por defecto crítico**: si al menos 1 pieza de la muestra tiene un defecto marcado como "crítico", el lote se rechaza sin importar el porcentaje total de piezas defectuosas.
3. **Aprobación**: si no hay defectos críticos y el porcentaje de piezas defectuosas es **menor a 3 %**, el lote se aprueba.
4. **Revisión**: si no hay defectos críticos y el porcentaje de piezas defectuosas está **entre 3 % (inclusive) y 5 % (inclusive)**, el lote queda "en revisión" y requiere una segunda inspección antes de decidir aprobación o rechazo.
5. **Rechazo por porcentaje**: si no hay defectos críticos y el porcentaje de piezas defectuosas es **mayor a 5 %**, el lote se rechaza.
6. **Proveedor en alerta** *(regla de la funcionalidad opcional)*: si un proveedor acumula 3 o más lotes rechazados en los últimos 30 días, se marca como "en alerta de calidad".

**Casos límite ya resueltos:**
- Porcentaje defectuoso exactamente igual a 3.0 % → cae en la regla 4 (revisión), no en la regla 3 (aprobación), porque la aprobación exige ser *menor* a 3 %.
- Porcentaje defectuoso exactamente igual a 5.0 % → cae en la regla 4 (revisión), no en la regla 5 (rechazo), porque el rechazo exige ser *mayor* a 5 %.
- Un lote con 0 % de piezas defectuosas pero con 1 pieza marcada como defecto crítico → se rechaza igual, porque la regla 2 tiene prioridad sobre el porcentaje.
- Un lote de 195 piezas (10 % = 19.5) → se redondea hacia arriba, exigiendo muestrear 20 piezas como mínimo.

## 7. Qué queda fuera

- No se integra con sensores o máquinas de inspección automática (visión artificial, IoT); toda inspección se registra manualmente.
- No se gestiona la trazabilidad completa hasta el lote específico de materia prima recibido; solo se registra el nombre del proveedor asociado al lote de producción.
- No se maneja facturación, pagos ni contratos con proveedores.
- No se automatiza el cambio de proveedor cuando entra en "alerta de calidad"; el sistema solo notifica, la decisión la toma una persona.
- No se generan reportes exportables en PDF o Excel en esta primera versión.

## 8. Módulo mínimo y funcionalidades opcionales

**Módulo mínimo** (resuelve el problema central y se puede mostrar funcionando):
1. Registrar un lote de producción.
2. Registrar la inspección de una muestra.
3. Calcular el resultado del lote (aprobado / rechazado / en revisión) aplicando las reglas de la sección 6.
4. Consultar el historial de lotes.

**Funcionalidades opcionales** (se construyen solo si el tiempo alcanza):
5. Alertar por proveedor con lotes rechazados acumulados.
6. Generar un resumen de indicadores de calidad por periodo.

El módulo mínimo ya demuestra el valor del sistema: reemplaza la planilla manual, aplica las reglas de forma consistente y deja un historial consultable. Las funcionalidades 5 y 6 son mejoras sobre esa base, no requisitos para que el proyecto tenga sentido.
