import { describe, expect, it } from "vitest";
import { esquemaLote } from "@/lib/validacion/esquemas";

const loteBase = {
  codigo: "MED-001",
  producto: "Pieza plástica",
  fechaProduccion: "2026-11-14",
  cantidadProducida: 100,
  proveedorId: 1,
};

describe("dimensiones de la pieza en el lote", () => {
  it("permite registrar el lote sin dimensiones conocidas", () => {
    expect(esquemaLote.safeParse(loteBase).success).toBe(true);
  });

  it("acepta las tres dimensiones positivas en milímetros", () => {
    const resultado = esquemaLote.safeParse({
      ...loteBase,
      largoPiezaMm: 125.5,
      anchoPiezaMm: 40,
      altoPiezaMm: 18.25,
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza dimensiones incompletas", () => {
    const resultado = esquemaLote.safeParse({
      ...loteBase,
      largoPiezaMm: 125.5,
      anchoPiezaMm: 40,
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza dimensiones en cero o negativas", () => {
    const resultado = esquemaLote.safeParse({
      ...loteBase,
      largoPiezaMm: 0,
      anchoPiezaMm: 40,
      altoPiezaMm: 18,
    });
    expect(resultado.success).toBe(false);
  });
});