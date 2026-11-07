import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { listarLotes, registrarLote } from "@/lib/dataService";
import { conManejoDeErrores, leerJson, respuestaOk } from "@/lib/http/respuestas";
import { esquemaFiltrosHistorial, esquemaLote } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirUsuario();
  const url = new URL(request.url);
  const filtros = esquemaFiltrosHistorial.parse({
    estado: url.searchParams.get("estado") || undefined,
    proveedorId: url.searchParams.get("proveedorId") || undefined,
    codigo: url.searchParams.get("codigo") || undefined,
  });
  return respuestaOk(await listarLotes(filtros));
});

export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirUsuario();
  const datos = await leerJson(request, esquemaLote);
  return respuestaOk(await registrarLote(datos), 201);
});