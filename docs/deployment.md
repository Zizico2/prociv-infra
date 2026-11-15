# Deployment configuration

Prociv uses the dedicated Google Cloud project `prociv-proxy-zizico2` (number `153694727013`), with billing linked to the same account as IPMA. Its Artifact Registry and native HTTP/2 Cloud Run services use `europe-southwest1` (Madrid). IPMA resources are managed separately.

Bootstrap was applied to the HCP Terraform organization `ipma-proxy`, workspace `prociv-bootstrap`. Staging and production have separate empty state workspaces `prociv-staging` and `prociv-production`. Runtime identities, the `prociv` registry and repository-scoped GitHub OIDC trust are ready. No application service is created by bootstrap.

Vercel project `prociv-app` is `prj_4YvbCAbxCsrdKeR70sKHhjIGxkkb` in team `team_Em7GNLb8UiXwORrcERbfy9rh`. Node.js is 24. The app uses Vercel's default function region, matching IPMA; `mad1` is not a supported Vercel function region. The Preview gateway origin is configured for the future staging service and Production uses its own future production origin.

Repository Actions variables hold these public identifiers. A project-specific automation bypass for protected-deployment smoke tests is stored as `VERCEL_AUTOMATION_BYPASS_SECRET` in GitHub. Account credentials are configured directly in GitHub: `TF_API_TOKEN` for the HCP state and `VERCEL_TOKEN` for the Vercel project. Do not commit or paste credentials. `staging` and `production` require the owner to review and approve the saved plan/build; administrator bypass is disabled.

For the first staging release, dispatch **Deploy Cloud Run** from main. Review the `cloud-run-plan` artifact and approve staging to create the two services. Dispatch **Deploy Vercel app** for staging, review the `vercel-app-build` artifact, and approve its staging job after the backend is available.
