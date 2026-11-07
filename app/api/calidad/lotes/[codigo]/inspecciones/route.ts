import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import { registrarInspeccion } from "@/lib/dataService";
import { conManejoDeErrores, leerJson, respuestaOk } from "@/lib/http/respuestas";
import { esquemaInspeccion } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

type ContextoRuta = { params: Promise<{ codigo: string }> };

export const POST = conManejoDeErrores(async (request: Request, contexto: ContextoRuta) => {
  await exigirUsuario();
  const { codigo } = await contexto.params;
  const datos = await leerJson(request, esquemaInspeccion);
  return respuestaOk(await registrarInspeccion(codigo, datos), 201);
});