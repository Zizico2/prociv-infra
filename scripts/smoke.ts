import assert from "node:assert/strict";
import { client } from "./grpc.ts";
const adapter = client(process.argv[2] ?? "http://127.0.0.1:50101");
const gateway = client(process.argv[3] ?? "http://127.0.0.1:50102");
try {
  await Promise.all([adapter.ready(), gateway.ready()]);
  await adapter.call("Ping");
  await gateway.call("Ping");
  const direct = await adapter.call("ListOccurrences");
  const first = await gateway.call("ListOccurrences");
  const second = await gateway.call("ListOccurrences");
  assert.deepEqual(first, second, "Gateway did not reuse a current snapshot");
  for (const value of [direct, first]) {
    assert(value.fetchedAt, "Missing retrieval timestamp");
    const rows = (value.occurrences ?? []) as Array<Record<string, unknown>>;
    assert.equal(
      new Set(rows.map((r) => r.id)).size,
      rows.length,
      "Duplicate stable occurrence keys",
    );
    console.log(`${rows.length} current occurrences`);
  }
  console.log("Adapter, gateway, source mapping and cache reuse verified");
} finally {
  adapter.close();
  gateway.close();
}
