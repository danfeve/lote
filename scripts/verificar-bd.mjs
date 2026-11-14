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

let fallas = 0;
function resultado(nombre, correcto) {
  console.log(`${correcto ? "OK" : "FALLA"}: ${nombre}`);
  if (!correcto) fallas += 1;
}

try {
  await client.connect();
  for (const tabla of ["proveedores", "lotes", "inspecciones"]) {
    const consulta = await client.query(
      `select c.relrowsecurity as rls
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = $1`,
      [tabla],
    );
    resultado(`tabla public.${tabla} existe`, consulta.rowCount === 1);
    resultado(`RLS activo en public.${tabla}`, consulta.rows[0]?.rls === true);
  }
  const vista = await client.query("select to_regclass('public.v_lotes') as vista");
  resultado("vista public.v_lotes existe", vista.rows[0]?.vista !== null);
  const migraciones = await client.query(
    "select count(*)::int as total from public.schema_migrations",
  );
  resultado("dos migraciones registradas", migraciones.rows[0]?.total >= 2);
} catch (error) {
  console.error("FALLA: no fue posible verificar la base de datos.", error);
  fallas += 1;
} finally {
  await client.end();
}

if (fallas > 0) process.exitCode = 1;