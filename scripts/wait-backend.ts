import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { client } from "./grpc.ts";

const endpoint = process.argv[2];
assert(endpoint, "Pass the reviewed gateway origin");
const gateway = client(endpoint, ".sources/prociv-app/proto");
const deadline = Date.now() + 20 * 60_000;
try {
  for (;;) {
    try {
      const snapshot = await gateway.call("ListOccurrences");
      assert(snapshot.fetchedAt && Array.isArray(snapshot.occurrences ?? []));
      console.log("Approved backend is ready and serving an ANEPC snapshot.");
      break;
    } catch {
      if (Date.now() >= deadline)
        throw new Error(
          "Backend is not ready. Approve the matching Cloud Run release before retrying.",
        );
      console.log(
        "Waiting for the matching Cloud Run release to become ready…",
      );
      await setTimeout(20_000);
    }
  }
} finally {
  gateway.close();
}
