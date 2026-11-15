# Deployment configuration

Prociv uses the dedicated Google Cloud project `prociv-proxy-zizico2` (number `153694727013`), with billing linked to the same account as IPMA. Its Artifact Registry and native HTTP/2 Cloud Run services use `europe-southwest1` (Madrid). IPMA resources are managed separately.

Bootstrap state is held in the HCP Terraform organization `prociv-proxy`, workspace `prociv-bootstrap`. Staging and production have separate empty state workspaces `prociv-staging` and `prociv-production`. Runtime identities, the `prociv` registry and repository-scoped GitHub OIDC trust are ready. No application service is created by bootstrap. The original bootstrap state copy in the IPMA organization was backed up and locked during the organization migration.

Vercel project `prociv-app` is `prj_4YvbCAbxCsrdKeR70sKHhjIGxkkb` in team `team_Em7GNLb8UiXwORrcERbfy9rh`. Node.js is 24. The app uses Vercel's default function region, matching IPMA; `mad1` is not a supported Vercel function region. The Preview gateway origin is configured for the future staging service and Production uses its own future production origin.

Repository Actions variables hold these public identifiers. A project-specific automation bypass for protected-deployment smoke tests is stored as `VERCEL_AUTOMATION_BYPASS_SECRET` in GitHub. Account credentials are configured directly in GitHub: `TF_API_TOKEN` for the HCP state and `VERCEL_TOKEN` for the Vercel project. Do not commit or paste credentials. `staging` and `production` require the owner to review and approve the saved plan/build; administrator bypass is disabled.

For the first launch, dispatch **Deploy Cloud Run** and **Deploy Vercel app** with `production`. Vercel requires the first deployment of a new project to be Production; later staging releases can use Preview. Review the `cloud-run-plan` artifact and approve the backend first. Review `vercel-app-build` and approve the app. The app deployment waits for its reviewed gateway to serve a valid ANEPC snapshot before publishing, so early app approval does not publish against an unavailable backend.
