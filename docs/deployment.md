# Deployment configuration

Prociv uses the dedicated Google Cloud project `prociv-proxy-zizico2` (number `153694727013`), with billing linked to the same account as IPMA. Its Artifact Registry and native HTTP/2 Cloud Run services use `europe-southwest1` (Madrid). IPMA resources are managed separately.

Bootstrap state is held in the HCP Terraform organization `prociv-proxy`, workspace `prociv-bootstrap`. Staging and production have separate state workspaces `prociv-staging` and `prociv-production`. Runtime identities, the `prociv` registry and repository-scoped GitHub OIDC trust are ready. No application service is created by bootstrap. The original bootstrap state copy in the IPMA organization was backed up and locked during the organization migration.

Vercel project `prociv-app` is `prj_4YvbCAbxCsrdKeR70sKHhjIGxkkb` in team `team_Em7GNLb8UiXwORrcERbfy9rh`. Node.js is 24. The app uses Vercel's default function region, matching IPMA; `mad1` is not a supported Vercel function region. Preview is configured for the future staging gateway and Production uses the deployed production gateway.

Production launched on 15 November 2026 after the owner approved both deployment gates:

- App: https://prociv-app.vercel.app
- Adapter: https://prociv-adapter-production-7fmgf26iuq-no.a.run.app
- Gateway: https://prociv-gateway-production-7fmgf26iuq-no.a.run.app
- Backend release: [Cloud Run run 43772833591](https://github.com/Zizico2/prociv-infra/actions/runs/43772833591), four resources added without changes or deletions; deployed source mapping and cache reuse checks passed.
- App release: [Vercel run 43771615839](https://github.com/Zizico2/prociv-infra/actions/runs/43771615839), desktop and mobile live smoke tests passed. The public app and `/api/occurrences` returned HTTP 200 with current ANEPC data after deployment.

Repository Actions variables hold these public identifiers. A project-specific automation bypass for protected-deployment smoke tests is stored as `VERCEL_AUTOMATION_BYPASS_SECRET` in GitHub. Account credentials are configured directly in GitHub: `TF_API_TOKEN` for the HCP state and `VERCEL_TOKEN` for the Vercel project. Do not commit or paste credentials. `staging` and `production` require the owner to review and approve the saved plan/build; administrator bypass is disabled.

`TF_API_TOKEN` must be a user or team API token with state read/write and lock/unlock permissions on `prociv-staging` and `prociv-production` in `prociv-proxy`. An organization API token can configure workspaces but cannot perform the state operations this pipeline needs. The Cloud Run workflow verifies the token's effective workspace permissions before installing the build toolchain.

For the first launch, dispatch **Deploy Cloud Run** and **Deploy Vercel app** with `production`. Vercel requires the first deployment of a new project to be Production; later staging releases can use Preview. Review the `cloud-run-plan` artifact and approve the backend first. Review `vercel-app-build` and approve the app. The app deployment waits for its reviewed gateway to serve a valid ANEPC snapshot before publishing, so early app approval does not publish against an unavailable backend.
