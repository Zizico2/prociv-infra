# prociv-infra

Portable OCI packaging, local Compose, Cloud Run Terraform and Vercel release orchestration for the Prociv ecosystem. Mirrors the separation and stack of ipma-infra, with one current-occurrence API pair.

- [prociv-openapi](https://github.com/Zizico2/prociv-openapi): source contract and generated Progenitor HTTP client.
- [prociv-proto](https://github.com/Zizico2/prociv-proto): independent protobuf contract and Rust bindings.
- [prociv-proxy](https://github.com/Zizico2/prociv-proxy): Rust tonic HTTP adapter, port 50101.
- [prociv-gateway](https://github.com/Zizico2/prociv-gateway): Rust tonic/Moka policy cache, port 50102.
- [prociv-app](https://github.com/Zizico2/prociv-app): Pulso, Next.js/Bun/Astryx/StyleX/TanStack DB/Hono sample map.

`releases.json` pins full source commits. Fetching sources requires no sibling checkout, and verifies both services pin the same protobuf revision. Containers are non-root, read-only, drop capabilities, handle SIGTERM through Tini, and map PORT to native gRPC h2c. There is no history database or provider SDK dependency in the services.

## Local

The pinned Nix flake supplies deployment/build tools, matching IPMA. Docker's daemon must already be running.

```sh
rtk proxy nix --extra-experimental-features 'nix-command flakes' develop
rtk npm ci --ignore-scripts
rtk just verify
rtk just terraform-check
rtk just sources
rtk just images
rtk just up
rtk just smoke
rtk just down
```

Compose publishes 50101/50102 on loopback. Override local bindings with `PROCIV_ADAPTER_PORT` and `PROCIV_GATEWAY_PORT` if running the Rust services separately. For custom bindings, pass both origins to `rtk npm run smoke -- http://127.0.0.1:PORT1 http://127.0.0.1:PORT2`. Start the app from its checkout with `rtk bun run dev`; its server-only PROCIV_GRPC_URL defaults to the gateway. The smoke script checks native gRPC connectivity, stable IDs, source/retrieval mapping and exact cache reuse. Live source rows may change between direct and cached requests.

## Cloud Run

`providers/cloud-run/bootstrap` configures Artifact Registry, build/deploy/runtime identities and repository/workflow/branch-scoped GitHub OIDC. `providers/cloud-run/app` deploys the two immutable image digests in Madrid by default, one vCPU/512 MiB each, minimum zero and maximum two instances per service. The public API is unauthenticated. Existing organization policy must permit public invokers. Runtime data and cache are disposable. No load balancer, NAT, database or remote cache is provisioned.

Cloud resources have not been provisioned by this repository's creation. To release:

1. Choose a billing-enabled GCP project and an HCP Terraform organization. Create `prociv-bootstrap`, `prociv-staging`, `prociv-production` workspaces in Local execution mode (`rtk npm run hcp:setup`, with normal Terraform credentials outside the repository).
2. Apply bootstrap deliberately with project_id and immutable numeric github_repository_id. Backend organization/workspace settings are supplied at init time by HCP/TF_WORKSPACE, as in IPMA.
3. Configure repository variables `GCP_PROJECT_ID`, `GCP_REGION`, `TF_CLOUD_ORGANIZATION`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_BUILD_SERVICE_ACCOUNT`, `GCP_DEPLOY_SERVICE_ACCOUNT`; set `TF_API_TOKEN` privately in GitHub Actions.
4. Run `rtk npm run github:setup` to create staging/production reviewer gates limited to main. Environments reject administrator bypass; the owner can review the saved plan.
5. Manually dispatch **Deploy Cloud Run** from main. It verifies code, builds and smoke-tests containers, publishes immutable images, saves the Terraform binary plan and readable diff, and waits for the selected environment's review. Apply uses that exact artifact, then checks both deployed gRPC endpoints.

Bootstrap and application provider versions are locked. `terraform-check` initializes with backend disabled and validates locally; the application test uses a mock Google provider and creates no resources. The flake only supplies tools; entering it performs no authentication or infrastructure changes.

## Vercel

Connect prociv-app to a Vercel project. Set `PROCIV_GRPC_URL` separately in Preview and Production to the corresponding HTTPS native gRPC gateway, as a Config variable. Keep Node 24 and the app's pinned Bun version. Set infra repository variables `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and a narrowly scoped `VERCEL_TOKEN` secret. The CLI reads that token from the environment.

The manually dispatched **Deploy Vercel app** workflow builds the pinned app once, records its source revision, target, gateway URL and artifact hash, then waits for the chosen GitHub environment's approval. It deploys the reviewed standalone output with `--prebuilt`, without rebuilding. Staging maps to Preview and production to Production. Pulled environment files are excluded from artifacts. Hosted smoke tests support a private `VERCEL_AUTOMATION_BYPASS_SECRET`; authentication-bearing traces are not uploaded.

Automatic main deployment is disabled in prociv-app/vercel.json; Git branch previews are optional. No Vercel project, cloud service or public domain is created by local checks. See the app README for desktop/mobile behavior and fixture-based tests.
