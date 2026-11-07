export {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
} from "@/lib/datos/proveedores";
export {
  listarLotes,
  listarBandeja,
  obtenerFilaLote,
  obtenerDetalleLote,
  registrarLote,
  actualizarLote,
  eliminarLote,
} from "@/lib/datos/lotes";
export { registrarInspeccion } from "@/lib/datos/inspecciones";
export type {
  FilaLote,
  FilaProveedor,
  DetalleLote,
  ResultadoRegistroInspeccion,
} from "@/lib/datos/tipos";