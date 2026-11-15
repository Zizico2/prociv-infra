import { test } from "node:test";
import assert from "node:assert/strict";
import { releases, validateReleases } from "../scripts/releases.ts";
import { target, upstreamOrigin } from "../providers/vercel/app.ts";
test("exact release revisions and repository ownership", () => {
  const valid = releases();
  assert.deepEqual(validateReleases(valid), valid);
  const invalid = structuredClone(valid);
  invalid["prociv-app"].revision = "main";
  assert.throws(() => validateReleases(invalid));
});
test("deployment origins and targets", () => {
  assert.equal(target("staging"), "preview");
  assert.equal(target("production"), "production");
  assert.equal(upstreamOrigin("https://example.com"), "https://example.com");
  for (const url of [
    "http://example.com",
    "https://user@example.com",
    "https://example.com/path",
  ])
    assert.throws(() => upstreamOrigin(url));
});
