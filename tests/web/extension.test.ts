import { strict as assert } from "node:assert";

Deno.test("web extension entry points export activate and deactivate", async () => {
  const ext = await import("../../src/web/extension.ts");
  assert.equal(typeof ext.activate, "function");
  assert.equal(typeof ext.deactivate, "function");
});
