# ResearchFlow

A research workspace for web research, private document questions, and streamed reports. The interface uses a pale blue background, blue accents, serif report headings, and colorful pixel art. Account emails use the ResearchMind name.

![ResearchFlow observatory artwork](frontend/public/research-observatory-day.webp)

## Current features

- Email registration and verification, login, password reset, and profile management.
- LangGraph research workflow: planning, web search, library retrieval, report drafting, review, and persistence.
- Live report updates through server-sent events, research history, report sharing, and retry controls.
- Markdown reports with tables, citations, Mermaid diagrams, and PDF, Word, Markdown, and JSON export controls.
- A document library with uploads and questions grounded in retrieved document snippets.
- A shared email design for signup, resend, password reset, and password change, with embedded observatory artwork.
- Observatory and landing artwork used by the application and account emails.

Generated answers require review. Model access, service quotas, network connectivity, and uploaded content affect the results; startup alone does not verify every integration.

## Stack

| Area | Implementation |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Content | React Markdown, remark-gfm, Mermaid |
| Backend | Express 5, TypeScript, ts-node, nodemon |
| Orchestration | LangChain and LangGraph |
| Language model | Groq; current agents use `openai/gpt-oss-120b` |
| Embeddings | Google Gemini |
| Persistence | PostgreSQL / Neon |
| Retrieval | Qdrant, with local retrieval fallback paths |
| Cache | Upstash Redis, with local memory when unconfigured |
| Upload storage | AWS S3, with local disk when unconfigured |
| Email | Resend |

## Local setup

Use Node.js 20 or newer and npm. Configure PostgreSQL before registration or research.

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

If `.env` already exists, edit it instead of overwriting it. Supply your own credentials:

```dotenv
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://user:password@host/database?sslmode=verify-full
GROQ_API_KEY=your-groq-key
GOOGLE_API_KEY=your-google-key
TAVILY_API_KEY=your-tavily-key
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-key
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=no-reply@your-verified-domain.com
RESEND_FROM_NAME=ResearchMind
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

Optional search integrations also read `NEWS_API_KEY`, `PUBMED_EMAIL`, and `REDDIT_USER_AGENT`. Resend requires an authorized sender domain. Never commit `.env` or place backend credentials in frontend environment variables.

Initialize the schema and start development:

```powershell
npm run migrate
npm run dev
```

The API listens on port 3001 by default. While nodemon is running, enter `rs` to restart. After stopping it with Ctrl+C, use `npm run dev` again; `rs` is not a PowerShell command.

### Frontend

In a separate terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```powershell
npm run dev
```

Open http://localhost:3000. Register, use the latest email verification code, then start research or upload documents to the library.

## Research workflow

```mermaid
flowchart LR
    P["Plan"] --> W["Web search"]
    P --> R["Library retrieval"]
    W --> S["Draft report"]
    R --> S
    S --> C["Review"]
    C -->|Revise| S
    C -->|Approve or attempt limit| F["Save report"]
    classDef blue fill:#e0e7ff,stroke:#2449bf,color:#151f3b;
    classDef teal fill:#ccfbf1,stroke:#0f766e,color:#151f3b;
    classDef amber fill:#fef3c7,stroke:#b45309,color:#151f3b;
    class P,S blue;
    class W,R teal;
    class C,F amber;
```

The review loop allows up to two drafting attempts. Research requests have an eight-minute deadline. Existing saved reports can be reused through the report cache.

## Application artwork

Only essential application artwork is included in this repository:

- `frontend/public/research-observatory-day.webp`: shared observatory illustration.
- `frontend/public/landing/`: research, desk, library, and report illustrations.
- `backend/assets/research-observatory-day.webp`: embedded email artwork, included in the backend Docker image.

The extra twenty-image generated collection is excluded to keep repository uploads small. Original generated files remain outside the repository in the local image generation output folder.

## Recent fixes

- Startup success is logged on the actual server listening event; port conflicts have recovery instructions.
- PostgreSQL connections have an IPv4 DNS fallback when the local resolver fails.
- Migrations initialize the base schema before adding columns, including agent-log status.
- Authentication codes and pending registrations use PostgreSQL-backed temporary storage, surviving backend restarts. Codes last ten minutes; registration sessions last thirty minutes and refresh on resend.
- Groq agents use a model confirmed accessible during setup instead of unavailable Llama model IDs.
- Verification and security emails share the application theme and embedded artwork.
- Mermaid rendering repairs unquoted flowchart labels and supplies colors for unstyled flowcharts. Generation prompts allow layouts suited to the subject.
- Report tables scroll horizontally and avoid splitting short values into individual characters.
- Library answers support GitHub-flavored Markdown tables and clearer grouped answers.

## Commands

| Directory | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` | Start API with nodemon |
| backend | `npm run migrate` | Initialize and update database schema |
| backend | `npm run build` | Compile TypeScript |
| backend | `npm start` | Run compiled backend |
| frontend | `npm run dev` | Start Next.js development server |
| frontend | `npm run build` | Create production frontend build |
| frontend | `npm start` | Serve production frontend |
| frontend | `npm run lint` | Run ESLint |
| Either | `npx tsc --noEmit` | Check TypeScript in that directory |

There is no consolidated backend test suite configured in `npm test`; individual diagnostic scripts live under `backend/src/test`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Port 3001 already in use | Stop the existing project backend before starting another instance. |
| `ENOTFOUND` for Neon | Confirm the hostname in Neon Connect and local DNS/network access. |
| `relation users does not exist` | Run `npm run migrate` against the configured database. |
| Groq `model_not_found` | Check the account's available models and update the model configuration. |
| Registration session expired | Register again if the original session is missing; resend refreshes a valid pending session. |
| Email not delivered | Check the Resend key, verified sender domain, and backend email error output. |
| Qdrant compatibility warning | Check the cluster URL, credentials, network, and server availability. |
| Diagram source appears | Check generated Mermaid syntax; unfinished streamed diagrams may wait until complete. |

## Repository layout

```text
backend/
  assets/             Email artwork
  src/agents/         Planning, search, retrieval, drafting, review, chat
  src/db/             Schema, migrations, queries, cache and auth storage
  src/graph/          LangGraph workflow and state
  src/routes/         Express API routes
  src/utils/          Email templates, storage, and supporting utilities
frontend/
  app/                Application pages and global styles
  components/         Shared interface and report components
  public/landing/     Landing page illustrations
  lib/                API, authentication, and exports
 docs/                Supporting architecture documentation and screenshots
```

See [architecture notes](docs/architecture.md) for additional background; the source code is authoritative for current behavior.
