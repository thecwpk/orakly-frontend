import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

await client.connect();
try {
  const markets = await client.query(`SELECT count(*)::int AS c FROM "Market"`);
  const open = await client.query(
    `SELECT count(*)::int AS c FROM "Market" WHERE status = 'OPEN'`,
  );
  console.log("markets", markets.rows[0].c, "open", open.rows[0].c);
  const sample = await client.query(
    `SELECT slug, title, status FROM "Market" ORDER BY "createdAt" DESC LIMIT 5`,
  );
  console.log(JSON.stringify(sample.rows, null, 2));
} catch (e) {
  console.error("query failed:", e instanceof Error ? e.message : e);
}
await client.end();
