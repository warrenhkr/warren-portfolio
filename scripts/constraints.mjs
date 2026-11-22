import fs from "fs";
import pg from "pg";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  }),
);

const u = new URL((env.DATABASE_URL_DIRECT || env.DATABASE_URL).replace(/^['"]|['"]$/g, ""));
const client = new pg.Client({
  host: u.hostname,
  port: Number(u.port),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const constraints = await client.query(
  "select conname, pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.documents'::regclass order by conname",
);
for (const row of constraints.rows) console.log(`${row.conname} => ${row.def}`);
await client.end();
