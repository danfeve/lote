import { ErrorDeNegocio } from "@/lib/reglas/errores";

interface ErrorPostgres {
  code?: string;
  constraint?: string;
}

const traducciones: Record<string, string> = {
  ux_proveedores_nombre: "PROVEEDOR_DUPLICADO",
  pk_lotes: "LOTE_DUPLICADO",
  ux_inspecciones_lote_numero: "INSPECCION_DUPLICADA",
  fk_lotes_proveedor: "PROVEEDOR_NO_ENCONTRADO",
  fk_inspecciones_lote: "LOTE_NO_ENCONTRADO",
};

export function traducirErrorBd(error: unknown): never {
  const postgres = error as ErrorPostgres;
  const codigo = postgres.constraint ? traducciones[postgres.constraint] : undefined;
  if (codigo) throw new ErrorDeNegocio(codigo as ConstructorParameters<typeof ErrorDeNegocio>[0]);
  if (postgres.code === "23514" && postgres.constraint?.startsWith("ck_")) {
    throw new ErrorDeNegocio("DATOS_INVALIDOS", undefined, {
      restriccion: postgres.constraint,
    });
  }
  throw error;
}