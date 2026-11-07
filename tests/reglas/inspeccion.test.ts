import { describe, expect, it } from "vitest";
import { validarInspeccion, validarLoteAdmiteInspeccion } from "@/lib/reglas/inspeccion";
import { ErrorDeNegocio } from "@/lib/reglas/errores";

function esperarCodigoError(trabajo: () => void, codigo: string) {
  try {
    trabajo();
    throw new Error("Se esperaba un error de negocio");
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorDeNegocio);
    expect((error as ErrorDeNegocio).codigo).toBe(codigo);
  }
}

describe("validación de inspecciones", () => {
  it("T-04 permite la primera inspección en pendiente", () => {
    expect(validarLoteAdmiteInspeccion("pendiente")).toBe(1);
  });

  it("T-05 permite la segunda inspección en revisión", () => {
    expect(validarLoteAdmiteInspeccion("en_revision")).toBe(2);
  });

  it("T-06 cierra lotes aprobados", () => {
    esperarCodigoError(() => validarLoteAdmiteInspeccion("aprobado"), "LOTE_CERRADO");
  });

  it("T-07 cierra lotes rechazados", () => {
    esperarCodigoError(() => validarLoteAdmiteInspeccion("rechazado"), "LOTE_CERRADO");
  });

  it("T-08 exige la muestra mínima y devuelve el detalle", () => {
    try {
      validarInspeccion(
        { cantidadProducida: 210, muestraMinima: 21 },
        { piezasMuestreadas: 20, piezasDefectuosas: 0, piezasCriticas: 0 },
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeNegocio);
      expect(error).toMatchObject({
        codigo: "MUESTRA_INSUFICIENTE",
        detalles: { muestraMinima: 21 },
      });
      return;
    }
    throw new Error("Se esperaba MUESTRA_INSUFICIENTE");
  });

  it("T-09 impide muestrear más piezas que las producidas", () => {
    esperarCodigoError(
      () => validarInspeccion(
        { cantidadProducida: 200, muestraMinima: 20 },
        { piezasMuestreadas: 201, piezasDefectuosas: 0, piezasCriticas: 0 },
      ),
      "MUESTRA_EXCEDE_LOTE",
    );
  });

  it("T-10 impide que defectuosas superen la muestra", () => {
    esperarCodigoError(
      () => validarInspeccion(
        { cantidadProducida: 200, muestraMinima: 20 },
        { piezasMuestreadas: 20, piezasDefectuosas: 21, piezasCriticas: 0 },
      ),
      "DEFECTUOSAS_EXCEDEN_MUESTRA",
    );
  });

  it("T-11 impide que críticas superen las defectuosas", () => {
    esperarCodigoError(
      () => validarInspeccion(
        { cantidadProducida: 200, muestraMinima: 20 },
        { piezasMuestreadas: 20, piezasDefectuosas: 2, piezasCriticas: 3 },
      ),
      "CRITICAS_EXCEDEN_DEFECTUOSAS",
    );
  });

  it("T-12 acepta los límites válidos", () => {
    expect(() => validarInspeccion(
      { cantidadProducida: 200, muestraMinima: 20 },
      { piezasMuestreadas: 20, piezasDefectuosas: 20, piezasCriticas: 20 },
    )).not.toThrow();
  });
});