import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { actualizarProveedor } from "@/lib/dataService";
import { conManejoDeErrores, leerJson, respuestaOk } from "@/lib/http/respuestas";
import { esquemaCambiosProveedor } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

type ContextoRuta = { params: Promise<{ id: string }> };

export const PATCH = conManejoDeErrores(async (request: Request, contexto: ContextoRuta) => {
  await exigirUsuario();
  const { id } = await contexto.params;
  const datos = await leerJson(request, esquemaCambiosProveedor);
  const proveedorId = Number(id);
  if (!Number.isSafeInteger(proveedorId) || proveedorId <= 0) {
    const { ErrorDeNegocio } = await import("@/lib/reglas/errores");
    throw new ErrorDeNegocio("DATOS_INVALIDOS");
  }
  return respuestaOk(await actualizarProveedor(proveedorId, datos));
});