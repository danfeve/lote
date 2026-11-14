import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;
function cadenaConexion() {
  const cadena = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!cadena) return undefined;
  const url = new URL(cadena);
  url.searchParams.delete("sslmode");
  return url.toString();
}

const connectionString = cadenaConexion();

if (!connectionString) {
  console.error("FALLA: falta DATABASE_URL o POSTGRES_URL en el entorno.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      archivo text primary key,
      aplicado_en timestamptz not null default now()
    )
  `);
  const carpeta = join(process.cwd(), "supabase", "migrations");
  const archivos = (await readdir(carpeta))
    .filter((archivo) => archivo.endsWith(".sql"))
    .sort();
  const aplicadas = await client.query("select archivo from public.schema_migrations");
  const conocidas = new Set(aplicadas.rows.map((fila) => fila.archivo));

  for (const archivo of archivos) {
    if (conocidas.has(archivo)) {
      console.log(`OMITIDA: ${archivo} ya estaba aplicada.`);
      continue;
    }
    const sql = await readFile(join(carpeta, archivo), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (archivo) values ($1)",
        [archivo],
      );
      await client.query("commit");
      console.log(`OK: ${archivo}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} catch (error) {
  console.error("FALLA: no se pudieron aplicar las migraciones.", error);
  process.exitCode = 1;
} finally {
  await client.end();
}