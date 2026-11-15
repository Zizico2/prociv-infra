import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const services = ["prociv-proxy", "prociv-gateway"] as const;
export const protoProjects = ["prociv-proto"] as const;
export const serviceConfig = {
  "prociv-proxy": { proto: "prociv-proto", image: "adapter" },
  "prociv-gateway": { proto: "prociv-proto", image: "gateway" },
} as const;
export const projects = [
  ...services,
  ...protoProjects,
  "prociv-openapi",
  "prociv-app",
] as const;
export type Project = (typeof projects)[number];
export type Releases = Record<
  Project,
  { repository: string; revision: string }
>;

export function validateReleases(value: unknown): Releases {
  assert(value && typeof value === "object", "Invalid releases manifest");
  const data = value as Releases;
  assert.deepEqual(Object.keys(data).sort(), [...projects].sort());
  for (const name of projects) {
    assert.equal(
      data[name]?.repository,
      `https://github.com/Zizico2/${name}.git`,
    );
    assert.match(
      data[name]?.revision,
      /^[a-f0-9]{40}$/,
      `${name}: use a full commit SHA`,
    );
    assert(
      !/^0{40}$/.test(data[name].revision),
      `${name}: unresolved revision`,
    );
  }
  return data;
}

export function releases(): Releases {
  return validateReleases(JSON.parse(readFileSync("releases.json", "utf8")));
}

export function checkProtoPins(root: string, manifest: Releases): void {
  for (const name of services) {
    const proto = serviceConfig[name].proto;
    const cargo = readFileSync(`${root}/${name}/Cargo.toml`, "utf8");
    const dependency = cargo
      .split("\n")
      .find((line) => line.startsWith(`${proto} = `));
    assert(
      dependency?.includes(`git = "${manifest[proto].repository}"`) &&
        dependency.includes(`rev = "${manifest[proto].revision}"`) &&
        !dependency.includes("path ="),
      `${name}: ${proto} pin differs`,
    );
    assert(
      !/\[patch(?:\.|\])|\[replace\]/.test(cargo),
      `${name}: API override`,
    );
  }
  const adapter = readFileSync(`${root}/prociv-proxy/Cargo.toml`, "utf8");
  const upstream = manifest["prociv-openapi"];
  const dependency = adapter
    .split("\n")
    .find((line) => line.startsWith("anepc-client = "));
  assert(
    dependency?.includes(`git = "${upstream.repository}"`) &&
      dependency.includes(`rev = "${upstream.revision}"`),
    "Proxy OpenAPI client pin differs",
  );
  assert.equal(
    readFileSync(
      `${root}/prociv-proto/proto/prociv/v1/occurrences.proto`,
      "utf8",
    ),
    readFileSync(
      `${root}/prociv-app/proto/prociv/v1/occurrences.proto`,
      "utf8",
    ),
    "App schema differs from the pinned protobuf contract",
  );
}
