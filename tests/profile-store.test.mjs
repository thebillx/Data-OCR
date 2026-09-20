import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function moduleAt(name, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(js, { exports, require() { throw new Error("unexpected dependency"); }, Blob, ...globals });
  return exports;
}

const cardData = moduleAt("card-data");
const profiles = moduleAt("profile-store");

test("profile fingerprint changes with data, crop and photo identity", () => {
  const blank = cardData.emptyData();
  const base = profiles.profileFingerprint(blank, { zoom: 1, x: 50, y: 50 }, null);
  assert.notEqual(base, profiles.profileFingerprint({ ...blank, firstTh: "ทดสอบ" }, { zoom: 1, x: 50, y: 50 }, null));
  assert.notEqual(base, profiles.profileFingerprint(blank, { zoom: 1.1, x: 50, y: 50 }, null));
  assert.notEqual(base, profiles.profileFingerprint(blank, { zoom: 1, x: 50, y: 50 }, "photo-1"));
});

test("normalizes a valid local profile and rejects unknown schema versions", () => {
  const record = {
    id: "profile-1",
    name: " ETB Test ",
    schemaVersion: 1,
    data: cardData.emptyData(),
    photo: new Blob(["test"], { type: "image/png" }),
    photoName: "test.png",
    photoKey: "photo-key",
    crop: { zoom: 1.2, x: 40, y: 55 },
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T01:00:00.000Z",
  };
  const normalized = profiles.normalizeProfile(record);
  assert.equal(normalized.name, "ETB Test");
  assert.equal(normalized.data.firstTh, "");
  assert.notEqual(normalized.data, record.data);
  assert.equal(normalized.photo.size, 4);
  assert.equal(profiles.normalizeProfile({ ...record, schemaVersion: 99 }), null);
});

test("cloneCardData keeps nested dates independent", () => {
  const source = cardData.initialData;
  const clone = profiles.cloneCardData(source);
  assert.notEqual(clone.birth, source.birth);
  clone.birth.day = "1";
  assert.equal(source.birth.day, "9");
});
