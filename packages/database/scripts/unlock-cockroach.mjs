import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

await client.connect();
const { rows } = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
`);
console.log("tables:", rows.map((r) => r.table_name).join(", ") || "(none)");

for (const r of rows) {
  const name = r.table_name;
  try {
    await client.query(`ALTER TABLE "${name}" SET (schema_locked = false)`);
    console.log("unlocked", name);
  } catch (e) {
    console.log("skip", name, e instanceof Error ? e.message : e);
  }
}

await client.end();
