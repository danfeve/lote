import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { crearProveedor, listarProveedores } from "@/lib/dataService";
import { conManejoDeErrores, leerJson, respuestaOk } from "@/lib/http/respuestas";
import { esquemaProveedor } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirUsuario();
  const url = new URL(request.url);
  const incluirInactivos = url.searchParams.get("incluirInactivos") === "true";
  return respuestaOk(await listarProveedores(incluirInactivos));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirUsuario();
  const datos = await leerJson(request, esquemaProveedor);
  return respuestaOk(await crearProveedor(datos), 201);
});