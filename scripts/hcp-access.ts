import assert from "node:assert/strict";
import { workspace } from "./hcp.ts";

const organization = process.env.TF_CLOUD_ORGANIZATION;
const environment = process.env.DEPLOY_ENVIRONMENT;
assert(organization, "Set TF_CLOUD_ORGANIZATION");
assert(environment === "staging" || environment === "production");
const name = `prociv-${environment}`;
const attributes = await workspace(organization, name);
const permissions = attributes.permissions as Record<string, boolean>;
const required = [
  "can-read-state-versions",
  "can-create-state-versions",
  "can-lock",
  "can-unlock",
];
console.log(
  `${organization}/${name}: ${JSON.stringify(
    Object.fromEntries(
      required.map((key) => [key, permissions?.[key] === true]),
    ),
  )}`,
);
const missing = required.filter((key) => permissions?.[key] !== true);
assert.equal(
  missing.length,
  0,
  `TF_API_TOKEN lacks ${missing.join(", ")}. Configure a user or team API token with state read/write and lock/unlock access to ${organization}/${name} in GitHub Actions secrets. Organization tokens cannot perform these state operations.`,
);
