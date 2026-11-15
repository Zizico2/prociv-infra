import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import {
  checkProtoPins,
  protoProjects,
  releases,
  services,
} from "./releases.ts";

const manifest = releases();
mkdirSync(".sources", { recursive: true });
// Fetch exact public source revisions; no sibling checkout is required.
for (const name of [
  ...services,
  ...protoProjects,
  "prociv-openapi" as const,
  "prociv-app" as const,
]) {
  const directory = `.sources/${name}`;
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory);
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", directory, ...args], { stdio: "inherit" });
  git("init", "--quiet");
  git("remote", "add", "origin", manifest[name].repository);
  git("fetch", "--quiet", "--depth=1", "origin", manifest[name].revision);
  git("checkout", "--quiet", "--detach", manifest[name].revision);
  console.log(`${name}: ${manifest[name].revision}`);
}
checkProtoPins(".sources", manifest);
