/** R3: por debajo de este porcentaje (estricto) el lote se aprueba. */
export const UMBRAL_APROBACION_PCT = 3;

/** R4 y R6: hasta este porcentaje (inclusive) el lote queda en zona de revisión. */
export const UMBRAL_REVISION_PCT = 5;

/** R1: porcentaje de la producción que se debe muestrear. */
export const PORCENTAJE_MUESTRA = 10;

/** R1: mínimo absoluto de piezas a muestrear. */
export const MUESTRA_MINIMA_PIEZAS = 20;

/** R5: número máximo de inspecciones por lote. */
export const MAX_INSPECCIONES = 2;

/** R7: días de la ventana de la alerta por proveedor (hoy incluido). */
export const DIAS_VENTANA_ALERTA = 30;

/** R7: lotes rechazados en la ventana que activan la alerta. */
export const LOTES_RECHAZADOS_PARA_ALERTA = 3;

/** Máximo de filas del historial. */
export const LIMITE_HISTORIAL = 200;

/** Máximo de caracteres de las observaciones de una inspección. */
export const MAX_OBSERVACIONES = 500;

/** Zona horaria con la que se calcula "hoy". */
export const ZONA_HORARIA = "America/Bogota";