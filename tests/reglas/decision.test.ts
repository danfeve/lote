import { describe, expect, it } from "vitest";
import {
  accionesPermitidas,
  calcularPorcentaje,
  decidirResultado,
  formatearPorcentaje,
} from "@/lib/reglas/decision";

describe("decisión de calidad", () => {
  it.each([
    ["T-13", 1, 100, 1, 1, "rechazado", "R2"],
    ["T-14", 2, 100, 1, 1, "rechazado", "R2"],
    ["T-15", 1, 100, 0, 0, "aprobado", "R3"],
    ["T-16", 1, 100, 2, 0, "aprobado", "R3"],
    ["T-17", 1, 10000, 299, 0, "aprobado", "R3"],
    ["T-18", 1, 10000, 301, 0, "en_revision", "R4"],
    ["T-19", 1, 100, 3, 0, "en_revision", "R4"],
    ["T-20", 1, 100, 5, 0, "en_revision", "R4"],
    ["T-21", 1, 10000, 501, 0, "rechazado", "R6"],
    ["T-22", 1, 100, 6, 0, "rechazado", "R6"],
    ["T-23", 2, 100, 3, 0, "rechazado", "R5"],
    ["T-24", 2, 100, 5, 0, "rechazado", "R5"],
    ["T-25", 2, 100, 2, 0, "aprobado", "R3"],
    ["T-26", 2, 100, 6, 0, "rechazado", "R6"],
  ] as const)("%s aplica la regla correcta", (_id, numeroInspeccion, piezasMuestreadas, piezasDefectuosas, piezasCriticas, estado, regla) => {
    expect(decidirResultado({
      numeroInspeccion,
      piezasMuestreadas,
      piezasDefectuosas,
      piezasCriticas,
    })).toMatchObject({ estado, regla });
  });

  it("T-27 nunca deja una segunda inspección en revisión", () => {
    for (let piezasDefectuosas = 0; piezasDefectuosas <= 100; piezasDefectuosas += 1) {
      expect(decidirResultado({
        numeroInspeccion: 2,
        piezasMuestreadas: 100,
        piezasDefectuosas,
        piezasCriticas: 0,
      }).estado).not.toBe("en_revision");
    }
  });

  it("T-34 permite acciones según estado e inspecciones", () => {
    expect(accionesPermitidas("pendiente", 0)).toEqual([
      "INSPECCIONAR",
      "EDITAR_LOTE",
      "ELIMINAR_LOTE",
    ]);
    expect(accionesPermitidas("en_revision", 1)).toEqual(["INSPECCIONAR"]);
    expect(accionesPermitidas("aprobado", 1)).toEqual([]);
    expect(accionesPermitidas("rechazado", 2)).toEqual([]);
  });

  it("T-35 explica la regla y muestra el porcentaje con coma", () => {
    expect(decidirResultado({
      numeroInspeccion: 1,
      piezasMuestreadas: 100,
      piezasDefectuosas: 3,
      piezasCriticas: 0,
    }).explicacion).toContain("3,00 %");
    expect(decidirResultado({
      numeroInspeccion: 1,
      piezasMuestreadas: 100,
      piezasDefectuosas: 2,
      piezasCriticas: 0,
    }).explicacion).toContain("2,00 %");
    expect(decidirResultado({
      numeroInspeccion: 1,
      piezasMuestreadas: 100,
      piezasDefectuosas: 1,
      piezasCriticas: 1,
    }).explicacion).toContain("1 pieza crítica");
    expect(decidirResultado({
      numeroInspeccion: 1,
      piezasMuestreadas: 100,
      piezasDefectuosas: 2,
      piezasCriticas: 2,
    }).explicacion).toContain("2 piezas críticas");
    expect(formatearPorcentaje(57, 800)).toBe("7,13");
    expect(calcularPorcentaje(57, 800)).toBe(7.13);
  });
});