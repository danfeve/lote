export type CodigoError =
  | "NO_AUTORIZADO"
  | "DATOS_INVALIDOS"
  | "FECHA_FUTURA"
  | "MUESTRA_INSUFICIENTE"
  | "MUESTRA_EXCEDE_LOTE"
  | "DEFECTUOSAS_EXCEDEN_MUESTRA"
  | "CRITICAS_EXCEDEN_DEFECTUOSAS"
  | "LOTE_NO_ENCONTRADO"
  | "PROVEEDOR_NO_ENCONTRADO"
  | "LOTE_DUPLICADO"
  | "PROVEEDOR_DUPLICADO"
  | "INSPECCION_DUPLICADA"
  | "LOTE_CERRADO"
  | "LOTE_NO_MODIFICABLE"
  | "PROVEEDOR_INACTIVO"
  | "ERROR_INTERNO";

export const MENSAJES: Record<CodigoError, string> = {
  NO_AUTORIZADO: "Debe iniciar sesión para continuar.",
  DATOS_INVALIDOS: "Hay datos que no son válidos. Revise los campos marcados.",
  FECHA_FUTURA: "La fecha de producción no puede ser posterior a hoy.",
  MUESTRA_INSUFICIENTE: "La muestra debe tener al menos {muestraMinima} piezas.",
  MUESTRA_EXCEDE_LOTE: "La muestra no puede superar las {cantidad} piezas del lote.",
  DEFECTUOSAS_EXCEDEN_MUESTRA:
    "Las piezas defectuosas no pueden superar las piezas muestreadas.",
  CRITICAS_EXCEDEN_DEFECTUOSAS:
    "Las piezas críticas no pueden superar las piezas defectuosas.",
  LOTE_NO_ENCONTRADO: "No existe un lote con ese código.",
  PROVEEDOR_NO_ENCONTRADO: "No existe el proveedor indicado.",
  LOTE_DUPLICADO: "Ya existe un lote con ese código.",
  PROVEEDOR_DUPLICADO: "Ya existe un proveedor con ese nombre.",
  INSPECCION_DUPLICADA: "Esta inspección ya fue registrada para el lote.",
  LOTE_CERRADO: "El lote ya tiene una decisión final y no admite más inspecciones.",
  LOTE_NO_MODIFICABLE:
    "Solo se puede editar o eliminar un lote que no tenga inspecciones.",
  PROVEEDOR_INACTIVO: "El proveedor está inactivo. Actívelo o elija otro.",
  ERROR_INTERNO: "Ocurrió un error inesperado. Intente de nuevo.",
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  NO_AUTORIZADO: 401,
  DATOS_INVALIDOS: 400,
  FECHA_FUTURA: 422,
  MUESTRA_INSUFICIENTE: 422,
  MUESTRA_EXCEDE_LOTE: 422,
  DEFECTUOSAS_EXCEDEN_MUESTRA: 422,
  CRITICAS_EXCEDEN_DEFECTUOSAS: 422,
  LOTE_NO_ENCONTRADO: 404,
  PROVEEDOR_NO_ENCONTRADO: 404,
  LOTE_DUPLICADO: 409,
  PROVEEDOR_DUPLICADO: 409,
  INSPECCION_DUPLICADA: 409,
  LOTE_CERRADO: 409,
  LOTE_NO_MODIFICABLE: 409,
  PROVEEDOR_INACTIVO: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  name = "ErrorDeNegocio";

  constructor(
    public codigo: CodigoError,
    mensaje?: string,
    public detalles?: Record<string, unknown>,
  ) {
    const mensajeBase = mensaje ?? MENSAJES[codigo];
    const mensajeFinal = mensajeBase.replace(/\{(\w+)\}/g, (_, clave: string) =>
      String(detalles?.[clave] ?? `{${clave}}`),
    );
    super(mensajeFinal);
  }
}