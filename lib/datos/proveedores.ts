import { consultar } from "@/lib/db/conexion";
import { traducirErrorBd } from "@/lib/datos/erroresBd";
import type { CambiosProveedor, DatosProveedor } from "@/lib/validacion/esquemas";
import type { FilaProveedor } from "@/lib/datos/tipos";

interface ProveedorDb {
  id: number;
  nombre: string;
  activo: boolean;
  total_lotes: number;
}

function mapearProveedor(fila: ProveedorDb): FilaProveedor {
  return {
    id: fila.id,
    nombre: fila.nombre,
    activo: fila.activo,
    totalLotes: fila.total_lotes,
  };
}

export async function listarProveedores(
  incluirInactivos = false,
): Promise<FilaProveedor[]> {
  const filas = await consultar<ProveedorDb>(
    `select p.id, p.nombre, p.activo, count(l.codigo)::int as total_lotes
     from public.proveedores p
     left join public.lotes l on l.proveedor_id = p.id
     where ($1::boolean or p.activo = true)
     group by p.id
     order by lower(p.nombre), p.id`,
    [incluirInactivos],
  );
  return filas.map(mapearProveedor);
}

export async function crearProveedor(datos: DatosProveedor): Promise<FilaProveedor> {
  try {
    const filas = await consultar<ProveedorDb>(
      `insert into public.proveedores (nombre)
       values ($1)
       returning id, nombre, activo, 0::int as total_lotes`,
      [datos.nombre],
    );
    return mapearProveedor(filas[0]);
  } catch (error) {
    traducirErrorBd(error);
  }
}

export async function actualizarProveedor(
  id: number,
  cambios: CambiosProveedor,
): Promise<FilaProveedor> {
  const columnas: string[] = [];
  const parametros: unknown[] = [];
  if (cambios.nombre !== undefined) {
    parametros.push(cambios.nombre);
    columnas.push(`nombre = $${parametros.length}`);
  }
  if (cambios.activo !== undefined) {
    parametros.push(cambios.activo);
    columnas.push(`activo = $${parametros.length}`);
  }
  parametros.push(id);

  try {
    const filas = await consultar<ProveedorDb>(
      `with actualizado as (
         update public.proveedores set ${columnas.join(", ")}
         where id = $${parametros.length}
         returning id, nombre, activo
       )
       select a.id, a.nombre, a.activo, count(l.codigo)::int as total_lotes
       from actualizado a left join public.lotes l on l.proveedor_id = a.id
       group by a.id`,
      parametros,
    );
    if (!filas[0]) {
      const { ErrorDeNegocio } = await import("@/lib/reglas/errores");
      throw new ErrorDeNegocio("PROVEEDOR_NO_ENCONTRADO");
    }
    return mapearProveedor(filas[0]);
  } catch (error) {
    traducirErrorBd(error);
  }
}