import { describe, expect, it } from "vitest";
import {
  calcularMuestraMinima,
  explicarMuestraMinima,
} from "@/lib/reglas/muestra";

describe("muestra mínima", () => {
  it("T-28 redondea hacia arriba el diez por ciento", () => {
    expect(calcularMuestraMinima(195)).toBe(20);
  });

  it("T-29 calcula los límites de muestreo", () => {
    const cantidades = [15, 19, 20, 100, 195, 200, 201, 210, 500, 1000, 1100];
    const esperadas = [15, 19, 20, 20, 20, 20, 21, 21, 50, 100, 110];
    expect(cantidades.map(calcularMuestraMinima)).toEqual(esperadas);
  });

  it("T-30 explica por qué se exige ese tamaño de muestra", () => {
    expect(explicarMuestraMinima(195)).toBe(
      "El 10 % de 195 es 19,5, redondeado a 20 piezas.",
    );
    expect(explicarMuestraMinima(190)).toBe(
      "El 10 % de 190 es 19, por debajo del mínimo de 20: se muestrean 20 piezas.",
    );
    expect(explicarMuestraMinima(200)).toBe("El 10 % de 200 es 20 piezas.");
    expect(explicarMuestraMinima(15)).toBe(
      "El lote tiene menos de 20 piezas: se muestrea el lote completo (15 piezas).",
    );
  });
});