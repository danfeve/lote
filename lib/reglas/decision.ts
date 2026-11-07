import {
  UMBRAL_APROBACION_PCT,
  UMBRAL_REVISION_PCT,
} from "@/lib/config/calidad";

export type EstadoLote =
  | "pendiente"
  | "en_revision"
  | "aprobado"
  | "rechazado";
export type ReglaAplicada = "R2" | "R3" | "R4" | "R5" | "R6";
export type AccionLote = "INSPECCIONAR" | "EDITAR_LOTE" | "ELIMINAR_LOTE";

export const ETIQUETA_ESTADO: Record<EstadoLote, string> = {
  pendiente: "Pendiente de inspección",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const DESCRIPCION_REGLA: Record<ReglaAplicada, string> = {
  R2: "Regla 2 · Defecto crítico",
  R3: "Regla 3 · Aprobación",
  R4: "Regla 4 · Zona de revisión",
  R5: "Regla 5 · Segunda inspección",
  R6: "Regla 6 · Rechazo por porcentaje",
};

export function calcularPorcentaje(
  defectuosas: number,
  muestreadas: number,
): number {
  if (muestreadas <= 0) return 0;
  return Math.round((defectuosas * 10000) / muestreadas) / 100;
}

export function formatearPorcentaje(
  defectuosas: number,
  muestreadas: number,
): string {
  if (muestreadas <= 0) return "0,00";
  const centesimas = Math.round((defectuosas * 10000) / muestreadas);
  return `${Math.floor(centesimas / 100)},${String(centesimas % 100).padStart(2, "0")}`;
}

export function clasificarPorcentaje(
  defectuosas: number,
  muestreadas: number,
): "bajo" | "zona_revision" | "alto" {
  if (defectuosas * 100 < UMBRAL_APROBACION_PCT * muestreadas) {
    return "bajo";
  }
  if (defectuosas * 100 <= UMBRAL_REVISION_PCT * muestreadas) {
    return "zona_revision";
  }
  return "alto";
}

export function decidirResultado(entrada: {
  numeroInspeccion: 1 | 2;
  piezasMuestreadas: number;
  piezasDefectuosas: number;
  piezasCriticas: number;
}): {
  estado: "aprobado" | "en_revision" | "rechazado";
  regla: ReglaAplicada;
  explicacion: string;
} {
  const {
    numeroInspeccion,
    piezasMuestreadas,
    piezasDefectuosas,
    piezasCriticas,
  } = entrada;
  const porcentaje = formatearPorcentaje(
    piezasDefectuosas,
    piezasMuestreadas,
  );

  if (piezasCriticas > 0) {
    const pieza = piezasCriticas === 1 ? "pieza crítica" : "piezas críticas";
    return {
      estado: "rechazado",
      regla: "R2",
      explicacion: `Hay ${piezasCriticas} ${pieza} en la muestra. Un defecto crítico rechaza el lote sin importar el porcentaje (${porcentaje} %).`,
    };
  }

  if (clasificarPorcentaje(piezasDefectuosas, piezasMuestreadas) === "bajo") {
    return {
      estado: "aprobado",
      regla: "R3",
      explicacion: `El ${porcentaje} % de piezas defectuosas es menor al ${UMBRAL_APROBACION_PCT} %: el lote se aprueba.`,
    };
  }

  if (clasificarPorcentaje(piezasDefectuosas, piezasMuestreadas) === "alto") {
    return {
      estado: "rechazado",
      regla: "R6",
      explicacion: `El ${porcentaje} % de piezas defectuosas supera el ${UMBRAL_REVISION_PCT} %: el lote se rechaza.`,
    };
  }

  if (numeroInspeccion === 1) {
    return {
      estado: "en_revision",
      regla: "R4",
      explicacion: `El ${porcentaje} % de piezas defectuosas está entre ${UMBRAL_APROBACION_PCT} % y ${UMBRAL_REVISION_PCT} % (ambos inclusive): el lote queda en revisión y requiere una segunda inspección con una muestra nueva.`,
    };
  }

  return {
    estado: "rechazado",
    regla: "R5",
    explicacion: `En la segunda inspección el ${porcentaje} % de piezas defectuosas sigue entre ${UMBRAL_APROBACION_PCT} % y ${UMBRAL_REVISION_PCT} %: el lote se rechaza. No se permite una tercera inspección.`,
  };
}

export function accionesPermitidas(
  estado: EstadoLote,
  totalInspecciones: number,
): AccionLote[] {
  if (estado === "pendiente" && totalInspecciones === 0) {
    return ["INSPECCIONAR", "EDITAR_LOTE", "ELIMINAR_LOTE"];
  }
  if (estado === "en_revision" && totalInspecciones === 1) {
    return ["INSPECCIONAR"];
  }
  return [];
}

export function siguienteNumeroInspeccion(
  estado: EstadoLote,
): 1 | 2 | null {
  if (estado === "pendiente") return 1;
  if (estado === "en_revision") return 2;
  return null;
}