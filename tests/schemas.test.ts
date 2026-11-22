import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { loadSeed } from "../scripts/lib/seed";
import { Slug, mediaIdsOf, validateVersion } from "../src/lib/content/schemas";

const seedDocs = loadSeed(resolve("db/seed/initial-content.json"));
const v = (data: unknown, extra = {}) => ({ v: 1, visible: true, order: 0, data, ...extra });
const L = (fr: string) => ({ fr, en: "" });

test("le contenu initial est entièrement valide et sans doublon", () => {
  assert.ok(seedDocs.length > 0);
  const keys = new Set<string>();
  for (const d of seedDocs) {
    validateVersion(d.collection, { v: 1, visible: d.visible, order: d.order, data: d.data });
    assert.ok(Slug.safeParse(d.slug).success, `slug invalide : ${d.slug}`);
    const key = `${d.collection}/${d.slug}`;
    assert.ok(!keys.has(key), `doublon : ${key}`);
    keys.add(key);
  }
});

test("le contenu initial ne contient aucune donnée personnelle inventée", () => {
  const social = seedDocs.filter((d) => d.collection === "social");
  const site = seedDocs.find((d) => d.collection === "site")!;
  assert.ok(social.every((d) => (d.data as { url: string }).url === ""), "les liens des réseaux doivent rester vides");
  assert.equal((site.data as { email: string }).email, "");
  assert.equal(seedDocs.filter((d) => d.collection === "project").length, 1, "un seul projet connu");
});

test("les URL non http(s) sont refusées", () => {
  assert.throws(() => validateVersion("social", v({ label: "X", platform: "x", url: "javascript:alert(1)" })), /Contenu invalide/);
  assert.throws(() => validateVersion("social", v({ label: "X", platform: "x", url: "data:text/html,<script>" })), /Contenu invalide/);
  validateVersion("social", v({ label: "GitHub", platform: "github", url: "https://github.com/exemple" }));
  validateVersion("social", v({ label: "GitHub", platform: "github", url: "" }));
});

test("les champs inconnus et les types incorrects sont refusés", () => {
  assert.throws(() => validateVersion("site", v({ name: "X", email: "", extra: 1 })));
  assert.throws(() => validateVersion("site", v({ name: "X", email: "pas-un-email" })));
  assert.throws(() => validateVersion("project", v({ title: L("T"), category: "autre", tech: [] })));
  assert.throws(() => validateVersion("project", v({ title: L("T"), category: "hardware", tech: [], image: "pas-un-uuid" })));
  assert.throws(() => validateVersion("nav_link", v({ label: L("A"), href: "https://externe.com" })));
  assert.throws(() => validateVersion("inconnue", v({})), /Collection inconnue/);
  assert.throws(() => validateVersion("site", { v: 2, visible: true, order: 0, data: { name: "X", email: "" } }));
});

test("les références de médias sont extraites sans doublon", () => {
  const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
  const data = { title: L("T"), category: "hardware", tech: [], image: a, gallery: [{ media: a, alt: L("x") }, { media: b, alt: L("y") }] };
  validateVersion("project", v(data));
  assert.deepEqual(mediaIdsOf("project", data).sort(), [a, b]);
  assert.deepEqual(mediaIdsOf("seo", { title: L("t"), description: L("d"), ogImage: b }), [b]);
  assert.deepEqual(mediaIdsOf("site", { name: "X", email: "" }), []);
});
