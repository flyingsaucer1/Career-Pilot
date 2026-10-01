# CareerPilot: Vercel deployment and operations

This repository is prepared for a **same-origin Vercel deployment**: static React files plus the Express API function at `api/index.js`. Preparation is not evidence of a successful deployment. Do not invite paying customers until the checklist below is verified on the deployed project.

## Hosting requirements

- Use the repository root, not `client/`, as the Vercel project root. `vercel.json` sets locked installs, builds, API rewrites, SPA routing, bundled export fonts and response-security headers.
- Commercial use requires a Vercel plan that permits it. Vercel Hobby is restricted to personal/non-commercial use: https://vercel.com/docs/limits/fair-use-guidelines . Do not purchase a plan without the owner's approval.
- Enable Fluid Compute and confirm the selected plan supports the configured 240-second function duration and hourly cron. Requests are bounded to 180 seconds by default, including fallback/comparison calls; the function's duration must exceed that deadline with cleanup headroom.
- Vercel functions accept at most 4.5 MB request bodies. Production uploads are limited to **4 MB**, leaving multipart overhead. Local development remains 5 MB. Existing larger originals need a download path outside that response limit; do not delete them to work around it.
- Vercel cannot run the Ollama installation on this laptop. Clear `OLLAMA_MODEL` and use an approved hosted AI service. Database-backed leases, quotas and rate counters coordinate function replicas; process timers are not relied on for storage cleanup.

## Environment variables

Set these in Vercel's environment settings. Do not copy development `.env` files into the deployment, place secrets in `VITE_*` variables, or paste credentials into chat.

| Setting | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection for the intended production database, using a least-privilege database account |
| `CLIENT_URL` | Exact HTTPS origin, e.g. `https://your-project.vercel.app`, without a trailing slash |
| `VITE_API_URL` | `/api` (or leave unset); never localhost |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Two different cryptographically random secrets, at least 32 characters each |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Production private-file storage credentials |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Delivery credentials and verified sender |
| `SERVICE_OPERATOR`, `SUPPORT_EMAIL` | Real operator identity and public support contact |
| `TRUST_PROXY_HOPS` | The verified proxy topology; start with the documented Vercel configuration and confirm client-IP behaviour. Never use blanket `trust proxy=true` |
| `COOKIE_SAME_SITE` | `strict` for this same-origin deployment |
| `AI_PROVIDER` | `groq` or `fallback`, with approved hosted credentials |
| `GROQ_API_KEY`, `GROQ_MODEL` | Hosted credentials and a tested structured-output model |
| `GEMINI_API_KEY` | Optional; used in production only with `GEMINI_BILLING_VERIFIED=true` |
| `GEMINI_BILLING_VERIFIED` | Set `true` only after confirming an active billing account on the actual API project |
| `AI_DATA_POLICY_ACKNOWLEDGED` | Set `true` only after reviewing processor retention/data-use terms and approving their use for customer resumes |
| `CRON_SECRET` | Cryptographically random secret, at least 32 characters. Vercel sends it as a bearer token to the cleanup cron |
| `OLLAMA_MODEL` | Unset/empty on Vercel |

Optional controls: `AI_DAILY_LIMIT=30` (generation-request attempts, including failed/cached POST attempts), `AI_MAX_CONCURRENT=4`, `AI_OPERATION_TIMEOUT_MS=180000`, `GEMINI_TIMEOUT_MS=45000`, `GROQ_TIMEOUT_MS=45000`, `MAX_RESUMES_PER_USER=20`, `UPLOAD_REQUEST_LIMIT=10`, `PASSWORD_RESET_COOLDOWN_SECONDS=60`. These are pilot defaults, not promised service capacity or subscription entitlements.

The production validator fails closed on unsafe settings. A configured key is not proof that it works or is on a privacy-appropriate service tier. Unpaid Gemini is excluded from production fallback; explicit Gemini selection without verified billing is rejected.

## Deployment verification

1. Run `npm ci` in `server/` and `client/`. Run server unit/integration tests and client build/tests/lint. Run both production dependency audits. Run browser tests as documented in the README.
2. Establish version control and connect the repository to Vercel. Preview deployments must use an isolated database/storage environment and an exact preview origin, not customer production data.
3. Review `/privacy`, `/terms` and `/support` with the operator/legal adviser. Configure the actual backup-retention policy. These pages describe operations; they are not a legal-compliance certification.
4. Verify `/api/health` (liveness) and `/api/ready` (database connection readiness). Verify unauthenticated cron access returns 401, and a configured scheduled cleanup run succeeds.
5. From a second device: register, accept the data-use notice, sign in, refresh, reset a password through real email, upload PDF and DOCX, run analysis/ATS/optimization, save/edit/export PDF and Word, and restore saved work after refresh.
6. Check mobile widths, keyboard navigation, console/network errors, consent withdrawal, two-user isolation, expired sessions, rate limits and slow/outage responses.
7. Delete synthetic resumes/accounts while generation is running. Confirm no reports reappear and Cloudinary cleanup completes. Re-test after redeploying or restarting the service.
8. Enable production alerts for 5xx errors, readiness failures, function timeouts, AI quota failures, email failures, aged cleanup tasks and spending thresholds. Logs contain request IDs and error types, not document text or secrets. Use Vercel's observability tooling or the operator's chosen monitoring account; no external monitoring account has been provisioned here.

## Backups, restore and rollback

- The operator must choose and enable an Atlas backup option that meets the intended recovery-point/recovery-time targets. Free-tier availability is not a backup strategy. Keep an encrypted, access-controlled recovery plan for Cloudinary originals as well as MongoDB records.
- Never test a restore over the live database. Restore a backup into a new isolated database, disable email/AI and mock storage there, then reconcile users, resume/version counts, linked records and sample exports. Record the date, backup identifier and outcome. Production backup/restore has not been executed by this code change.
- Retention and deletion promises must cover backup copies. Choose and document the retention period before commercial release; do not invent one in the privacy notice.
- Roll back application code to a previously verified Vercel deployment, preserving the same production secrets and database. Review schema compatibility first; do not drop collections or roll customer data back without a separate recovery decision.
- Rotate every credential previously exposed in chat or logs. A code change cannot revoke provider keys or Atlas passwords for you.

## Commercial gate

Do not accept payment until pricing, billing provider, server-side entitlements, verified/idempotent payment webhooks, cancellation/refund rules and customer support are implemented and tested. No payment processor is connected by this change. Conduct a 3–5-person pilot and review a representative AI-quality set before making accuracy, ATS-improvement or employment claims.
