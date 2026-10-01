# CareerPilot AI

A career-workspace application for reviewing resumes, comparing them with job descriptions, editing improved drafts, and tracking applications. CareerPilot is under active development; its ATS scores and AI feedback are guidance, not hiring outcomes or guarantees.

## What works today

- Accounts with sign-up, sign-in, password recovery, profile settings, and account deletion.
- Private PDF/DOCX resume uploads, text extraction, resume analysis, and job-specific ATS comparisons.
- Resume optimization with suggestions users can apply or skip, editable saved versions, before/after score comparison, and PDF/DOCX export.
- Job application tracking with stages, notes, saved descriptions, linked resume versions, and analytics.
- Interview practice with generated questions and feedback on written answers.
- AI-provider selection among Groq, Gemini, and local Ollama, with availability-based fallback when configured.

The original uploaded file is kept separate from edited versions. Suggested wording should be checked for factual accuracy before sending a resume to an employer.

## Architecture

| Component | Stack | Purpose |
| --- | --- | --- |
| `client/` | React, TypeScript, Vite | Website and authenticated workspace |
| `server/` | Node.js, Express, TypeScript | API, authentication, scoring, exports, AI orchestration |
| MongoDB Atlas | MongoDB | Accounts, resumes, results, versions, applications, sessions |
| Cloudinary | Private file storage | Uploaded originals |
| `api/` and `vercel.json` | Vercel Function configuration | Same-origin hosted API and frontend |

## Run locally

Use Node.js 24 and npm. You need a MongoDB connection, Cloudinary credentials, and at least one configured AI provider. Never commit real `.env` files.

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm ci --prefix server
npm ci --prefix client
```

Fill in `server/.env` with `MONGODB_URI`, separate JWT secrets, Cloudinary settings, and either a hosted-provider API key or a locally installed Ollama model. Choose `AI_PROVIDER=groq`, `gemini`, `ollama`, or `fallback`. For local Ollama, start the Ollama service and pull the model named by `OLLAMA_MODEL`. `EMAIL_PROVIDER=console` prints password-reset links in the backend terminal for development only.

In two terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Open `http://localhost:5173`. The client expects the API at `http://localhost:5000/api` by default; adjust `client/.env` and restart Vite if the backend runs on another port. `npm run doctor` from `server/` checks the configured services without printing secrets.

## Checks

```powershell
npm test --prefix server
npm run test:integration --prefix server
npm run lint --prefix server
npm run build --prefix client
npm test --prefix client
npm run lint --prefix client
npm run test:deployment
```

Integration tests use an isolated temporary database and mocked AI/storage. The opt-in `npm run test:live` in `server/` calls configured real services, may consume provider quota, and should only be run with the documented synthetic fixture. Continuous integration is defined in `.github/workflows/checks.yml`.

## Deployment and privacy

The repository contains a same-origin Vercel configuration, but a successful local build is **not** a verified production deployment. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables, hosting limits, security checks, cron cleanup, backup/restore, and a full deployed smoke test. In particular:

- Vercel cannot reach Ollama running on a developer laptop; use a reviewed hosted AI provider for Vercel.
- AI requests can send resume and job-description content to the configured provider. Users must accept the AI-data notice before generation. The operator must review provider retention and privacy terms before enabling production.
- Production requires a real support address, verified email sender, strong secrets, an HTTPS site origin, and storage/database configuration. Do not put secrets in `VITE_*` variables.
- Vercel Hobby is for non-commercial use; the configured hourly cleanup cron also requires a plan that supports that frequency.
- Privacy, terms, and support pages require review by the actual operator. Paid subscriptions and checkout are not implemented.

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for phase status, verification evidence, and remaining release gates. Do not advertise the service as commercially launch-ready until those gates are completed.
