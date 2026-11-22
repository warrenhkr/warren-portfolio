import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "pg";
import { migrate, migrationStatus } from "../scripts/lib/migrate";
import { loadSeed, seed } from "../scripts/lib/seed";

const adminUrl = process.env.TEST_DATABASE_URL;
const skip = adminUrl ? false : "TEST_DATABASE_URL non défini (voir docs/BACKUP-RESTORE.md, section Tests)";
const MIGRATIONS = resolve("db/migrations");
const SEED = loadSeed(resolve("db/seed/initial-content.json"));
const hasPgTools = spawnSync("pg_dump", ["--version"]).status === 0;

describe("base de données (PostgreSQL réel)", { skip }, () => {
  const dbName = `portfolio_test_${Date.now()}`;
  let admin: Client, db: Client, dbUrl: string;

  const count = async (sql: string, p: unknown[] = []) => Number((await db.query(sql, p)).rows[0].n);
  const sqlState = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); return null; } catch (e) { return (e as { code: string }).code; } };
  const doc = (slug: string, draft: unknown, published: unknown = null) =>
    db.query("insert into documents (collection, slug, draft, published) values ('site', $1, $2::jsonb, $3::jsonb) returning id", [slug, JSON.stringify(draft), published === null ? null : JSON.stringify(published)]);

  before(async () => {
    admin = new Client({ connectionString: adminUrl }); await admin.connect();
    await admin.query(`do $$ begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$`);
    await admin.query(`create database ${dbName}`);
    const u = new URL(adminUrl as string); u.pathname = `/${dbName}`; dbUrl = u.toString();
    db = new Client({ connectionString: dbUrl }); await db.connect();
  });
  after(async () => {
    await db?.end(); await admin?.query(`drop database if exists ${dbName} with (force)`); await admin?.end();
  });

  test("les migrations s'appliquent, puis sont idempotentes", async () => {
    const first = await migrate(db, MIGRATIONS);
    assert.deepEqual(first.applied, ["0001"]);
    for (const t of ["documents", "media", "document_media", "messages", "activity", "schema_migrations"]) {
      assert.equal(await count("select count(*)::int n from information_schema.tables where table_schema='public' and table_name=$1", [t]), 1, `table manquante : ${t}`);
    }
    const second = await migrate(db, MIGRATIONS);
    assert.deepEqual(second.applied, []);
    assert.deepEqual(second.alreadyApplied, ["0001"]);
    assert.equal((await migrationStatus(db, MIGRATIONS))[0].state, "appliquée");
  });

  test("une migration modifiée après application est détectée et refusée", async () => {
    await db.query("update schema_migrations set checksum = 'falsifie' where version = '0001'");
    await assert.rejects(migrate(db, MIGRATIONS), /a été modifiée après son application/);
    assert.equal((await migrationStatus(db, MIGRATIONS))[0].state, "MODIFIÉE");
    const real = (await import("../scripts/lib/migrate")).loadMigrations(MIGRATIONS)[0].checksum;
    await db.query("update schema_migrations set checksum = $1 where version = '0001'", [real]);
    assert.deepEqual((await migrate(db, MIGRATIONS)).applied, []);
  });

  test("une migration en échec est annulée en entier", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mig-"));
    try {
      const { writeFileSync, copyFileSync } = await import("node:fs");
      copyFileSync(join(MIGRATIONS, "0001_core.sql"), join(dir, "0001_core.sql"));
      writeFileSync(join(dir, "0002_casse.sql"), "create table tmp_ok (id int); select 1/0;");
      await assert.rejects(migrate(db, dir), /Échec de la migration 0002_casse \(annulée\)/);
      assert.equal(await count("select count(*)::int n from information_schema.tables where table_name='tmp_ok'"), 0, "la table créée avant l'erreur doit être annulée");
      assert.equal(await count("select count(*)::int n from schema_migrations where version='0002'"), 0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test("les contraintes de la base refusent les données invalides", async () => {
    assert.equal(await sqlState("insert into documents (collection, slug, draft) values ('Site','ok','{}')"), "23514", "collection invalide");
    assert.equal(await sqlState("insert into documents (collection, slug, draft) values ('site','Slug Invalide','{}')"), "23514", "slug invalide");
    assert.equal(await sqlState("insert into documents (collection, slug, draft) values ('site','tableau','[]')"), "23514", "draft doit être un objet");
    await doc("unique", { a: 1 });
    assert.equal(await sqlState("insert into documents (collection, slug, draft) values ('site','unique','{}')"), "23505", "doublon collection+slug");
    assert.equal(await sqlState("insert into messages (name, email, subject, body) values ('A','a@b.co','Sujet','trop court')"), "23514", "nom et message trop courts");
    assert.equal(await sqlState("insert into media (storage_path, filename, mime_type, size_bytes) values ('p/x.svg','x.svg','image/svg+xml',10)"), "23514", "SVG refusé");
  });

  test("brouillon et publié sont distincts : has_unpublished_changes est calculé par la base", async () => {
    const v1 = { v: 1, visible: true, order: 0, data: { name: "A", email: "" } };
    const { rows } = await doc("synchro", v1, v1);
    const id = rows[0].id;
    assert.equal((await db.query("select has_unpublished_changes h from documents where id=$1", [id])).rows[0].h, false);
    await db.query("update documents set draft = jsonb_set(draft, '{data,name}', '\"B\"') where id=$1", [id]);
    const after = (await db.query("select has_unpublished_changes h, published->'data'->>'name' pub, draft->'data'->>'name' dr from documents where id=$1", [id])).rows[0];
    assert.deepEqual([after.h, after.pub, after.dr], [true, "A", "B"], "le publié ne doit pas bouger tant qu'on ne publie pas");
    const never = (await doc("jamais-publie", v1)).rows[0].id;
    assert.equal((await db.query("select has_unpublished_changes h from documents where id=$1", [never])).rows[0].h, true);
  });

  test("updated_at est mis à jour automatiquement", async () => {
    const id = (await doc("horodatage", { a: 1 })).rows[0].id;
    const t1 = (await db.query("select updated_at from documents where id=$1", [id])).rows[0].updated_at;
    await new Promise((r) => setTimeout(r, 15));
    await db.query("update documents set draft = '{\"a\":2}' where id=$1", [id]);
    const t2 = (await db.query("select updated_at from documents where id=$1", [id])).rows[0].updated_at;
    assert.ok(t2 > t1);
  });

  test("un média utilisé ne peut pas être supprimé (intégrité référentielle)", async () => {
    const m = (await db.query("insert into media (storage_path, filename, mime_type, size_bytes) values ('2026/a.webp','a.webp','image/webp',1234) returning id")).rows[0].id;
    const d = (await doc("avec-media", { a: 1 })).rows[0].id;
    await db.query("insert into document_media (document_id, media_id, scope) values ($1,$2,'draft')", [d, m]);
    assert.equal(await sqlState("delete from media where id=$1", [m]), "23503", "suppression bloquée tant que le média est référencé");
    await db.query("delete from documents where id=$1", [d]);
    assert.equal(await count("select count(*)::int n from document_media where media_id=$1", [m]), 0, "les liens partent avec le document");
    await db.query("delete from media where id=$1", [m]);
    assert.equal(await count("select count(*)::int n from media where id=$1", [m]), 0);
  });

  test("sécurité : les rôles anon et authenticated (API Supabase) n'ont aucun accès", async () => {
    await doc("secret", { v: 1, visible: true, order: 0, data: { name: "x", email: "" } });
    for (const role of ["anon", "authenticated"]) {
      const c = new Client({ connectionString: dbUrl }); await c.connect();
      try {
        await c.query(`set role ${role}`);
        for (const t of ["documents", "messages", "media", "activity", "document_media"]) {
          await assert.rejects(c.query(`select * from ${t}`), (e: { code: string }) => e.code === "42501", `${role} ne doit pas lire ${t}`);
        }
        await assert.rejects(c.query("insert into messages (name,email,subject,body) values ('Aa','a@b.co','Sujet','Un message assez long')"), (e: { code: string }) => e.code === "42501");
      } finally { await c.end(); }
    }
    // Deuxième barrière : même avec un droit SELECT accordé par erreur, la sécurité par ligne renvoie 0 ligne.
    await db.query("grant select on documents to anon");
    const c = new Client({ connectionString: dbUrl }); await c.connect();
    try { await c.query("set role anon"); assert.equal(Number((await c.query("select count(*)::int n from documents")).rows[0].n), 0); }
    finally { await c.end(); await db.query("revoke select on documents from anon"); }
  });

  test("seed : importe le contenu actuel, sans doublon, sans jamais écraser une modification", async () => {
    await db.query("delete from documents");
    const first = await seed(db, SEED);
    assert.equal(first.inserted, SEED.length);
    assert.equal(await count("select count(*)::int n from documents"), SEED.length);
    assert.equal(await count("select count(*)::int n from documents where published is distinct from draft"), 0, "brouillon = publié à l'import");
    assert.equal(await count("select count(*)::int n from documents where has_unpublished_changes"), 0);
    const second = await seed(db, SEED);
    assert.deepEqual([second.inserted, second.skipped], [0, SEED.length]);
    await db.query("update documents set draft = jsonb_set(draft,'{data,name}','\"Modifié depuis l''ADMIN\"') where collection='site'");
    await seed(db, SEED);
    assert.equal((await db.query("select draft->'data'->>'name' n from documents where collection='site'")).rows[0].n, "Modifié depuis l'ADMIN");
  });

  test("un seed invalide est refusé en entier (aucune écriture partielle)", async () => {
    const before = await count("select count(*)::int n from documents");
    const bad = [{ collection: "site", slug: "autre", visible: true, order: 0, data: { name: "ok", email: "" } }, { collection: "social", slug: "x", visible: true, order: 0, data: { label: "X", platform: "x", url: "javascript:1" } }];
    await assert.rejects(seed(db, bad), /Contenu invalide/);
    assert.equal(await count("select count(*)::int n from documents"), before);
  });

  test("sauvegarde puis restauration : les données reviennent à l'identique", { skip: hasPgTools ? false : "pg_dump/pg_restore absents du PATH" }, async () => {
    await db.query("delete from documents"); await seed(db, SEED);
    const total = await count("select count(*)::int n from documents");
    const dir = mkdtempSync(join(tmpdir(), "bk-")); const file = join(dir, "test.dump");
    const run = (script: string, args: string[]) => spawnSync(process.execPath, ["--import", "tsx", script, ...args], { env: { ...process.env, DATABASE_URL: dbUrl, DATABASE_URL_DIRECT: "" }, encoding: "utf8" });
    try {
      const b = run("scripts/backup.ts", [file]);
      assert.equal(b.status, 0, b.stderr); assert.ok(existsSync(file));
      await db.query("delete from documents"); await doc("intrus", { a: 1 });
      const refused = run("scripts/restore.ts", [file]);
      assert.notEqual(refused.status, 0, "sans --yes la restauration doit être refusée");
      assert.equal(await count("select count(*)::int n from documents"), 1, "refus = aucune modification");
      const r = run("scripts/restore.ts", [file, "--yes"]);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(await count("select count(*)::int n from documents"), total);
      assert.equal(await count("select count(*)::int n from documents where slug='intrus'"), 0);
      assert.equal(await count("select count(*)::int n from schema_migrations"), 1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
