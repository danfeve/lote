import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));
types.setTypeParser(1700, (valor) => Number.parseFloat(valor));
types.setTypeParser(1082, (valor) => valor);

const global_ = globalThis as typeof globalThis & { __poolCalidad?: Pool };

export const pool =
  global_.__poolCalidad ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") global_.__poolCalidad = pool;

function exigirConexion(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta configurar DATABASE_URL en el archivo .env.local.");
  }
}

export async function consultar<T extends QueryResultRow = QueryResultRow>(
  texto: string,
  parametros: unknown[] = [],
): Promise<T[]> {
  exigirConexion();
  const resultado = await pool.query<T>(texto, parametros);
  return resultado.rows;
}

export async function conTransaccion<T>(
  trabajo: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  exigirConexion();
  const tx = await pool.connect();
  try {
    await tx.query("BEGIN");
    const resultado = await trabajo(tx);
    await tx.query("COMMIT");
    return resultado;
  } catch (error) {
    await tx.query("ROLLBACK");
    throw error;
  } finally {
    tx.release();
  }
}