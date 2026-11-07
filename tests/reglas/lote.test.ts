import { describe, expect, it } from "vitest";
import { normalizarCodigo, validarFechaProduccion } from "@/lib/reglas/lote";
import { ErrorDeNegocio } from "@/lib/reglas/errores";

describe("reglas del lote", () => {
  it("T-31 recorta y normaliza el código", () => {
    expect(normalizarCodigo("  cal-001 ")).toBe("CAL-001");
  });

  it("T-32 permite producir hoy", () => {
    expect(() => validarFechaProduccion("2030-03-31", "2030-03-31")).not.toThrow();
  });

  it("T-33 rechaza una fecha posterior a hoy", () => {
    try {
      validarFechaProduccion("2030-04-01", "2030-03-31");
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeNegocio);
      expect(error).toMatchObject({ codigo: "FECHA_FUTURA" });
      return;
    }
    throw new Error("Se esperaba FECHA_FUTURA");
  });
});