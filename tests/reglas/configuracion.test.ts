import { describe, expect, it } from "vitest";
import {
  DIAS_VENTANA_ALERTA,
  LIMITE_HISTORIAL,
  LOTES_RECHAZADOS_PARA_ALERTA,
  MAX_INSPECCIONES,
  MUESTRA_MINIMA_PIEZAS,
  PORCENTAJE_MUESTRA,
  UMBRAL_APROBACION_PCT,
  UMBRAL_REVISION_PCT,
  ZONA_HORARIA,
} from "@/lib/config/calidad";

describe("configuración de reglas", () => {
  it("T-01 mantiene los umbrales de decisión", () => {
    expect([UMBRAL_APROBACION_PCT, UMBRAL_REVISION_PCT]).toEqual([3, 5]);
  });

  it("T-02 mantiene las reglas de muestreo", () => {
    expect([PORCENTAJE_MUESTRA, MUESTRA_MINIMA_PIEZAS]).toEqual([10, 20]);
  });

  it("T-03 mantiene el resto de valores configurables", () => {
    expect([
      MAX_INSPECCIONES,
      DIAS_VENTANA_ALERTA,
      LOTES_RECHAZADOS_PARA_ALERTA,
      LIMITE_HISTORIAL,
      ZONA_HORARIA,
    ]).toEqual([2, 30, 3, 200, "America/Bogota"]);
  });
});