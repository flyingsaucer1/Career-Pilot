# CareerPilot AI completion plan

Prepared: 9 September 2026
Updated: 24 September 2026

Frontend design update: the workspace uses a professional teal/slate palette, grouped desktop sidebar, compact header, responsive mobile drawer, and an overview driven by real resume/provider data. Light and dark themes were visually checked at desktop and mobile sizes; mobile navigation and Escape/focus return were verified. Shared cards/buttons carry the palette into existing feature screens. Help content and styled development-state panels replace bare placeholder routes.

Resume workflow update: clean optimizer drafts, individual apply/skip controls, manual editing with revision checks, authenticated PDF/DOCX downloads, and server-calculated before/after ATS comparisons are implemented. Each draft retains its exact target job description; edited drafts invalidate stale scores. Draft numbers are monotonic and are not reused after deletion. Resume deletion atomically removes its analyses, ATS reports, and drafts, while failed Cloudinary cleanup is recorded and retried. Isolated HTTP tests verify these behaviors and saved-content export round trips. Synthetic PDF and Word exports were rendered and visually checked page by page. Model output still requires human review.

Account workflow update: password recovery uses hashed, expiring, single-use tokens and a real reset page; local console delivery and hosted Resend delivery are supported. Access and refresh tokens carry a server-checked session version, so logout, password changes, resets, and deletion revoke older sessions. Profile, email, theme, password, and account deletion settings are implemented. Account deletion transactionally removes dependent database records and durably queues Cloudinary cleanup. The isolated HTTP test covers recovery email delivery, expiration, reuse rejection, simultaneous refreshes, expired sessions, ownership, and account deletion. Settings, theme persistence, forgot-password feedback, and reset-page layout were also checked in a browser against an isolated database.

Career workflow update: Job Tracker, stored-record analytics, and Interview Prep are implemented. Applications retain their exact job description and linked resume version, status history, notes, dates, and archive state. Interview sessions snapshot the selected resume/job context, generate validated mixed question sets, save typed answers and rubric feedback, and remain resumable if a source record is later removed. Provider-written example answers are replaced with a deterministic grounded template. The isolated HTTP suite covers ownership, report totals, date ranges, failed/slow interview generation, partial-session restoration, and dependent cleanup.

Release-security update: new uploads use authenticated Cloudinary delivery. Original-file downloads go through an owner-checked API endpoint, and resume API responses omit storage IDs and URLs. A live synthetic check confirmed unsigned access is denied, signed downloads preserve exact bytes, and legacy assets can be converted in place. Four existing assets were converted; a second Atlas dry run found zero legacy public resume or pending-deletion records, and Cloudinary confirmed all four assets as authenticated. CDN invalidation can take a few minutes, so cached public URLs may briefly persist. Browser, CI, and deployment checks remain.

This is an execution roadmap. Check a task off only after its behavior has been verified. The phase numbers below replace the older numbering in code comments for planning purposes.

## Target and current baseline

The first milestone is a reliable resume assistant: register, upload a resume, analyze it with Ollama, compare it with a job description, review edits, save an improved resume, export it, and compare scores. The complete product adds account management, job tracking, analytics, interview preparation, and a verified deployment.

Verified on 18–19 September:

- Ollama is installed at `D:\Ollama\app`, with `qwen3.5:4b` downloaded into `D:\Ollama\models`. The signed installer is retained in `D:\Ollama\setup`.
- `server/.env` selects Ollama at `http://127.0.0.1:11434` with a 300-second timeout. The adapter uses an 8192-token context, batch size 128, JSON Schema output, and thinking disabled.
- The skill-label mismatch is corrected: known technology labels such as `AWS deployment` become `AWS`, while compound products and broader skills retain their names. `hybrid-v3` additionally extracts explicitly named technologies from the job description when the model omits them, and ignores model-only skills absent from that job. Prior cached scores regenerate on the next calculation. Three synthetic cases are not a broad quality benchmark.
- The previously problematic `related-language-names` case now passes live with local Ollama (4/4 expected skills) under `hybrid-v3`.
- Machine: NVIDIA RTX 4050 Laptop GPU with 6 GB VRAM and approximately 16 GB system RAM. Earlier model-loading attempts timed out; the reduced batch configuration produced successful responses. Broader latency and concurrency testing remains.
- Atlas authentication and database ping pass. The system DNS resolver refused SRV queries; Cloudflare resolved the same hostname. Optional `DNS_SERVERS=1.1.1.1` is configured only for this app's Node DNS resolver. Windows network settings are unchanged. The saved database password works.
- The real HTTP workflow passed on 19 September: synthetic account registration/login, PDF upload to Cloudinary, text extraction, metadata saved to Atlas, byte-identical PDF download, real Ollama resume analysis (23 seconds), and retrieval of the saved analysis. The exact synthetic account, asset, and related records were then removed; existing user data was untouched.
- Backend compilation, 38 unit tests, backend lint, and the expanded isolated API test pass. The HTTP test covers password recovery, session revocation/refresh concurrency, profile/preferences, account deletion, file validation, storage failure, upload rollback, ownership, ATS caching, draft saving, stale-save rejection, PDF/DOCX downloads with text round trips, application analytics, interview practice, and authentication rate limits. It uses a temporary test database and mocked AI/storage, not Atlas.
- The frontend build and four deterministic tests pass. The refresh single-flight test verifies simultaneous failed requests share one refresh operation. The large-bundle warning and two existing fast-refresh lint warnings remain.
- The backend started successfully against Atlas and the frontend development server started on port 5173 on 19 September.
- Job Tracker, Interview Prep, and Career Analytics are backed by persisted user-owned records. Settings and password recovery are real; Help covers uploads, scores, delays, exports, sessions, deletion, and common errors.
- Optimizer drafts start from clean original resume text, with advice retained separately. Users can apply or skip individual suggestions, edit, save, export, and compare original/draft ATS scores against the same job description.
- The application uses MongoDB and Cloudinary. Installing Ollama does not remove those dependencies.
- An optional Groq adapter for hosted `openai/gpt-oss-120b` uses strict JSON Schema output for analysis, ATS matching, and optimization. Its unit tests pass, but free-tier rate limits were reached during live use. Ollama `qwen3.5:4b` is the selected provider; Groq remains an optional hosted alternative.
- A head-to-head synthetic evaluation later completed all three ATS skill cases for both Groq GPT-OSS 120B and local Qwen 3.5 4B (13/13 each). Groq averaged about 4.7 seconds/case versus 33.5 seconds/case locally. On one synthetic rewrite, Groq took 4.4 seconds versus 23.1 seconds and produced a more faithful summary, but both models made at least one unsupported wording inference. Keep human review before export; this small test is not a general benchmark.
- Browser dashboard/session restoration was observed; the complete upload/analysis journey was tested over HTTP, not yet entirely through browser interactions. Export formats and text are verified over HTTP. Synthetic PDF and DOCX exports were rendered at full-page resolution and visually checked without clipping, overlap, or missing content. The complete browser journey remains a release check.
- New uploads reject empty, corrupt, unreadable/scanned, unsupported, and oversized files before storage. PDF parser resources are released on errors. Failed database saves attempt cleanup of the just-uploaded asset. The upload UI now consistently states 5 MB, provides keyboard file selection, and clears parent selection when Remove is clicked.
- AI prompt builders no longer silently truncate long documents: they return actionable 422 errors before inference. Limits are analysis resume 8000 characters and ATS/optimization resume/job 8000/5000. Inputs within those limits remain intact. Token-aware budgeting/chunking and broad quality checks remain future work.

### Current phase status

| Phase | Status | Next completion gate |
| --- | --- | --- |
| 1 | Real API workflow verified; browser check partial | Complete the browser upload/analysis journey; establish version control |
| 2 | Skill-label normalization and named-JD-skill omission guard implemented | Expand human-reviewed evaluations and implement concurrency/token budgeting |
| 3 | Complete and deterministically tested | Perform a final authenticated browser walkthrough before release |
| 4 | Complete and deterministically tested | Recheck hosted email and Atlas-backed browser flow during release verification |
| 5 | Complete and deterministically tested | Final authenticated browser walkthrough during release verification |
| 6 | Complete and deterministically tested | Broaden human-reviewed question/feedback cases during release verification |
| 7 | In progress; private resume delivery implemented and legacy assets migrated | Browser tests, actual CI run, remaining security checks, and deployment |

## Sequence and effort

Estimates assume one developer with roughly six focused hours per development day, building on the existing code. They are planning ranges, not deadlines. Re-estimate after Phase 1 measures local inference and confirms infrastructure access.

| Phase | Deliverable | Estimated development days | Required before starting |
| --- | --- | --- | --- |
| 1 | Local application with working Ollama | 1–2 | Existing project and Ollama installation |
| 2 | Reliable AI analysis and scoring | 3–4 | Phase 1 |
| 3 | Editable, exportable optimized resumes | 4–6 | Phase 2 |
| 4 | Complete account and support flows | 3–4 | Phase 1; finish before release |
| 5 | Job Tracker and real analytics | 4–6 | Phase 3 |
| 6 | Interview preparation | 4–6 | Phase 2; link to Phase 5 jobs |
| 7 | Release verification and deployment | 4–6 | All features selected for release |

The complete baseline is approximately 23–34 development days. Allow about 20–30% contingency for model tuning, integration failures, and feedback: roughly 6–9 full-time working weeks. Part-time calendar time will be longer.

A first resume-focused release can use Phases 1–4 followed by Phase 7, deferring Phases 5–6 and removing their unfinished navigation from that release. Optional cover letters and skill-gap recommendations are scoped separately below.

## Phase 1 — Make the existing application run locally

Goal: establish a repeatable starting point with a real local AI response.

- [ ] Establish Git version control if still absent, preserve existing files, and confirm environment secrets stay ignored. Record the supported Node/npm versions.
- [x] Use the verified Ollama executable on D: and inspect available RAM/GPU.
- [x] Download `qwen3.5:4b`, confirm it appears in the model list, and run a synthetic prompt. Its listed download is about 3.4 GB; runtime memory requirements are additional. Broader suitability testing remains in Phase 2. [Ollama model page](https://ollama.com/library/qwen3.5:4b)
- [x] Configure `AI_PROVIDER=ollama`, the local base URL, and the installed model name in `server/.env`; restart the backend.
- [x] Diagnose MongoDB connectivity and verify authenticated Atlas ping. Use the user's chosen Atlas database; do not switch the application to a local database.
- [x] Verify Cloudinary with a synthetic resume upload/download; downloaded bytes match and the test asset was removed afterward.
- [x] Repair backend lint tooling, apply the authentication rate limiter to failed login/registration requests, and remove redundant schema index declarations.
- [x] Run the frontend build, backend type-check, lint checks, and existing tests. Start both applications and verify `/api/health` and database readiness separately. Existing frontend bundle/fast-refresh warnings remain tracked for release.
- [ ] Create a test account, upload a text-based PDF or DOCX, and complete one real Ollama analysis through the UI.

Completion check: after restarting the processes, login, upload, analysis, and retrieving the saved result all work from the browser. Record the model/version, machine hardware, and first versus subsequent response times.

### First execution commands

Ollama installation, model download, and local configuration are already done on this machine. These commands verify or reproduce the setup.

In a fresh PowerShell terminal:

```powershell
& 'D:\Ollama\app\ollama.exe' --version
& 'D:\Ollama\app\ollama.exe' list
```

Ollama is responding, so start or restart its application only if the API is unavailable. These settings are saved in `server/.env`, preserving the other configuration:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3.5:4b
OLLAMA_TIMEOUT_MS=300000
DNS_SERVERS=1.1.1.1
```

Then, from the project root, run in separate terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

From `server`, run `npm run doctor` for read-only setup checks, `npm test` for unit tests, `npm run test:integration` for the isolated API test, and `npm run eval:ai -- --provider ollama` for the live synthetic ATS evaluation. Unit and integration tests mock model responses; they do not prove real model quality. Incorrect skill assertions now fail the live evaluation command.

## Phase 2 — Make AI output dependable

Goal: accurate, validated output and predictable behavior when local inference is slow or unavailable.

- [x] Move shared output schemas into a neutral contract; supply JSON Schema to Ollama and retain server validation using compatible Zod imports. [Structured outputs documentation](https://docs.ollama.com/capabilities/structured-outputs)
- [x] Distinguish unavailable service, missing model, timeout, malformed response, and failed validation. Bound retries and make the timeout configurable. Operational failure tests pass; a 300-second limit is selected locally, not a response-time guarantee.
- [x] Reject documents exceeding each prompt's supported character limit with a clear error before inference, rather than silently generating a partial review. Unit tests cover limit boundaries and no model call on rejection. Chunking/token-aware processing is not implemented.
- [ ] Add busy/progress and retry states; prevent duplicate submissions. If measured requests exceed practical HTTP timeouts, implement persisted jobs with status polling and bounded inference concurrency before release.
  - Analysis-page effect dependencies/reset order were corrected to prevent repeated automatic requests; broader concurrency/progress work remains.
- [ ] Preserve deterministic ATS matching/counts. Bind cached results to the correct user, resume content/version, job description, and scoring/provider version.
  - Different job descriptions no longer reuse the previous cached score; integration coverage added. Resume-version/provider-version cache invalidation still needs completion.
- [ ] Create a human-reviewed evaluation set of at least 20 synthetic or appropriately anonymized resume/job pairs, spanning seniority, related skill names, missing qualifications, and long documents.
- [ ] Extend evaluations beyond ATS to analysis and optimization. Make assertion failures fail the evaluation command, and record schema validity, correctness, latency, and retry frequency separately.
- [ ] Check that rewritten content preserves candidate facts and treats embedded document instructions as document content. Label ATS scores as this application's estimate of fit, not a guaranteed employer outcome.

Completion check: all curated required skill assertions pass; at least 95% of test cases produce valid output within the documented retry budget; reviewed rewrites introduce no unsupported qualifications. Record median and 95th-percentile latency and choose the response-time budget from Phase 1 hardware measurements. These are targets to verify, not achieved results or guarantees about unseen resumes.

## Phase 3 — Finish the resume improvement workflow

Goal: deliver a useful resume file and a trustworthy before/after comparison.

- [x] Preserve the uploaded resume as the immutable original and keep clean, heading-aware draft content separate from AI comments and recommendations.
- [x] Let users apply/skip suggestions and edit the resulting draft. Save a complete clean resume version containing retained and accepted content. Decisions are reflected in saved text rather than stored as a separate audit log.
- [x] Tie each version to the exact job description used. The uploaded resume remains the original, draft numbers are monotonic, and revision checks protect concurrent saves.
- [x] Recalculate ATS scores on the clean saved version using the same job description and scoring method as the baseline. Scores are calculated by the server rather than assigned by the client.
- [x] Provide an ATS-friendly preview and PDF/DOCX export. Parsed-content tests and synthetic page-by-page visual checks verify readable text, section order, and document layout.
- [x] Add clear feedback for corrupt, empty, scanned/image-only, unsupported, and oversized uploads. Invalid files never reach storage in integration tests; PDF extraction and blank-page detection have unit coverage. OCR remains a later extension.
- [x] Make resume deletion atomically remove dependent analyses, ATS results, and versions. Failed stored-file deletion is persisted and retried so partial storage failures do not leave untracked cleanup work.

Completion check: a user uploads a resume, analyzes it, compares it with a job, accepts edits, saves a version, downloads PDF/DOCX, and recalculates that version's score. Refreshing the page restores the saved work. Exported resume content contains no change commentary or duplicated original text.

## Phase 4 — Finish accounts, settings, and help

Goal: all basic account actions have real outcomes.

- [x] Implement password-reset requests, hashed expiring single-use tokens, console/test and Resend email delivery, and the reset-password page.
- [x] Verify registration, login, logout, token refresh, expired sessions, and simultaneous requests during refresh.
- [x] Implement profile updates, password changes, account-synced theme preferences, and account deletion with transactional dependent-data cleanup and durable stored-file retries.
- [x] Replace hard-coded AI readiness with authenticated provider availability checks. Model presence is not presented as proof of successful generation.
- [x] Add help content for uploads, scores, model delays, exports, sessions, deletion, and common errors. Update the README to accurately describe local AI, cloud storage, email setup, accounts, and supported features.
- [x] Verify each user can access only their own resumes, results, versions, and settings through the UI design and direct isolated API requests.

Completion check: a test user resets a password through a delivered test email, signs in with it, updates their profile, resumes an expired session correctly, and deletes their account. No simulated success messages remain in these flows.

## Phase 5 — Build Job Tracker and analytics

Goal: connect saved resume work to a manageable application history.

- [x] Add a job/application model with company, role, URL, description, status, dates, notes, and linked resume version.
- [x] Build create/edit/archive/delete actions, search, filters, and list or board views. Support saved, applied, interview, offer, and rejected states.
- [x] Reuse saved job descriptions in ATS checks and optimization. Preserve the version associated with each application.
- [x] Add user-owned events/history for applications and score changes. Build dashboard analytics from stored records: applications by stage, interviews, and score history.
- [x] Test ownership, empty states, date ranges, status transitions, and report totals.

Completion check: several sample applications survive refresh and status changes; charts reconcile exactly with their records; each application links to the intended job description and resume version. This phase covers manual tracking, not job scraping or automated applications.

## Phase 6 — Build interview preparation

Goal: provide useful practice tailored to a role, resume, and saved job.

- [x] Replace placeholder interview types with validated request/response schemas and implement the provider method, API, storage, and UI.
- [x] Generate technical, behavioral, and resume-specific questions with difficulty and follow-up prompts.
- [x] Support typed practice answers and structured feedback against a stated rubric, with example improvements grounded in the user's actual experience.
- [x] Save sessions and show prior answers and feedback. Validate against reviewed examples using the Phase 2 evaluation approach.
- [x] Test failed/slow generation, interrupted sessions, history restoration, and cross-user isolation.

Completion check: a user opens a saved job, starts practice, answers questions, receives relevant feedback, and resumes the saved session later. Voice/audio interviews are deferred.

The provider also contains future placeholders for cover letters and skill-gap analysis. Treat these as optional extensions, approximately 3–5 additional development days combined after Phase 6: define schemas, implement generation and persistence, add UI/export where needed, and evaluate relevance and factual grounding. Exclude them from baseline completion unless explicitly selected for the release.

## Phase 7 — Verify and release

Goal: make the chosen feature set reproducible and usable outside the development session.

- [ ] Add API integration tests using an isolated test database and browser tests for account, resume, and selected career-tool journeys. Exercise failure paths and user isolation alongside successful workflows.
  - Account/ownership/cache/auth-limit and upload failure/rollback API tests pass. An opt-in `npm run test:live` verifies the real PDF upload/download/analysis workflow and removes only its synthetic data. Full browser journeys and valid DOCX live testing remain.
- [ ] Add CI that installs locked dependencies, checks types/lint, runs deterministic tests, and builds both applications. Keep live-model evaluations as a separately configured job with documented hardware/model requirements.
  - `.github/workflows/checks.yml` is implemented; no GitHub run has been verified and this directory is not yet a Git repository.
- [ ] Fix measured frontend loading problems, including route/chart splitting; verify keyboard use and mobile layouts. Resolve the existing bundle and lint warnings where relevant.
- [ ] Verify private resume access, secret configuration, authentication limits, production cookies/CORS, and cleanup behavior in the deployed environment.
  - New uploads use authenticated Cloudinary delivery; the owner-checked API download omits storage URLs. The isolated API test covers cross-user denial and exact bytes. A live synthetic storage check passed. Four legacy assets were converted; Atlas found zero legacy records and Cloudinary verified all four as authenticated. Deployment-specific checks remain.
- [ ] Select and document the release topology. For a local demonstration, package a repeatable local startup. For a public service, provision a backend and inference host that can run the chosen Ollama model, or explicitly choose a hosted AI provider.
- [ ] Keep Ollama behind the backend on a private interface/network, with bounded concurrency and health checks. A deployed backend's `127.0.0.1` refers to that host, so it will not reach Ollama on this laptop. Ollama binds to localhost by default. [Ollama networking FAQ](https://docs.ollama.com/faq)
- [ ] Configure database/file backups, error reporting without raw resume content, health/readiness endpoints, deployment secrets, and a rollback procedure. Test restoring sample data.
- [ ] Run a small pilot with 3–5 testers, triage issues by severity, fix launch blockers, and rerun the affected journeys.

Completion check: a fresh setup follows the documented instructions successfully; CI passes; real Ollama evaluations meet the agreed Phase 2 targets; every released route works; the chosen deployment completes the full user journey. For a public release, verify access from a second device and a server restart without relying on this development session.

## How to execute and track the plan

1. Work in the listed order by default. Use the phase completion checks as gates; do not count a page or endpoint alone as a completed feature.
2. For each task: implement a small slice, run checks appropriate to its behavior, exercise it in the UI/API, record evidence, and commit the completed slice.
3. Keep fast deterministic checks in the normal development loop. Run real-model checks when prompts, providers, model settings, or AI-dependent behavior change.
4. At each phase boundary, update this file with completed items, verification results, unresolved blockers, and revised effort estimates.
5. Keep billing, subscriptions, automated job applications, scraping, OCR, voice interviews, multiple export themes, and model fine-tuning outside this baseline. Add them only as separately scoped work.

### Commercial-readiness hardening — September 27, 2026

- Implemented production configuration guards, origin/cookie protection, shared database-backed limits, bounded AI admission/deadlines, request identifiers, health/readiness endpoints, and authenticated storage-cleanup cron.
- Fixed deletion/generation races with transactional owned-write fencing, unsupported parallel account-deletion transaction operations, durable upload rollback, reset-email abuse, bcrypt password truncation, and DOCX expansion limits. Updated vulnerable dependencies.
- Added explicit AI consent and withdrawal, public privacy/terms/support pages, and Vercel same-origin deployment configuration. These pages require the operator's review and real contact details; they are not a legal compliance certification.
- Verified 45 server unit tests, 2 isolated API suites, 4 client tests, and 2 deployment tests; both builds and lint passed. Production dependency audits report zero findings. Isolated tests use mocked AI/storage, not paid services or customer data.
- Split frontend bundles below the previous large-chunk threshold, added login label associations, and removed the external font request for compatibility with the self-only security policy. Full mobile/keyboard and browser journey testing remains outstanding.
- Vercel production rejects laptop-local Ollama. Use an approved hosted provider. Gemini requires verified active billing and processor-policy review before handling personal resumes. See `DEPLOYMENT.md` for limits and configuration.

Next actionable tasks: establish Git version control and run CI on a remote branch; configure a suitable Vercel commercial plan, real support contact/operator, verified email sender and production secrets; review processor privacy and the policy pages; add full browser journey coverage; verify deployed cookies/CORS, backups/restore, cleanup, and full upload-to-export workflows. Complete the larger Phase 2 human-reviewed model evaluation before claiming output quality. No paid subscriptions or checkout have been implemented. The landing page does not display unverified sample metrics or testimonials.
