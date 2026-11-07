import { exigirUsuario } from "@/lib/auth/sesionUsuario";
import {
  actualizarLote,
  eliminarLote,
  obtenerDetalleLote,
} from "@/lib/dataService";
import { conManejoDeErrores, leerJson, respuestaOk } from "@/lib/http/respuestas";
import { esquemaLote } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

type ContextoRuta = { params: Promise<{ codigo: string }> };

export const GET = conManejoDeErrores(async (_request: Request, contexto: ContextoRuta) => {
  await exigirUsuario();
  const { codigo } = await contexto.params;
  return respuestaOk(await obtenerDetalleLote(codigo));
});

export const PATCH = conManejoDeErrores(async (request: Request, contexto: ContextoRuta) => {
  await exigirUsuario();
  const { codigo } = await contexto.params;
  const datos = await leerJson(request, esquemaLote);
  return respuestaOk(await actualizarLote(codigo, datos));
});

export const DELETE = conManejoDeErrores(async (_request: Request, contexto: ContextoRuta) => {
  await exigirUsuario();
  const { codigo } = await contexto.params;
  await eliminarLote(codigo);
  return respuestaOk({ eliminado: true });
});