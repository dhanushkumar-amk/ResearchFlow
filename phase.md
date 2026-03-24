# Multi Agent Research Assistant

> **Goal:** Build a 5-agent AI research platform using LangGraph + LangChain + RAG + MCP — fully deployed, zero cost, resume-ready for product company placement.
>

---

# 🧠 What This Platform Does

A user types any research question. Five specialized AI agents work together — one breaks down the problem, one searches the web, one searches uploaded documents, one writes the final report, and one checks quality. The entire process streams live so the user watches each agent think in real time. The result is a structured, cited research report — not a hallucinated answer.

This is the difference between a basic chatbot and a real AI product. Companies like Perplexity, Consensus, and Elicit are billion-dollar businesses built on this exact concept.

---

# 🤖 The 5 Agents

## Agent 1 — Planner Agent

- **Job:** Receives raw user question → breaks into 3–5 sub-questions + 5–6 optimized search queries
- **Output:** Structured JSON with tasks, search_queries, question_type, estimated_complexity
- **Why it exists:** Raw questions are vague. Planner converts "Tell me about AI" into specific, searchable sub-questions
- **LLM:** Groq (Llama 3.3 70B)

## Agent 2 — Search Agent

- **Job:** Takes planner's queries → fetches real current information from the web
- **Output:** Titles, URLs, snippets, published dates from Tavily API
- **Why it exists:** LLMs have training cutoffs. Search agent gives access to current real-world info
- **Runs in parallel with:** RAG Agent
- **Tool:** Tavily API (free 1000 req/month)

## Agent 3 — RAG Agent

- **Job:** Searches through user-uploaded documents for relevant information
- **Output:** Top 5 most relevant passages ranked by semantic similarity
- **Why it exists:** Users want answers combining public web knowledge with their own private documents
- **How:** Converts query to embedding vector → searches Qdrant → returns closest chunks

## Agent 4 — Synthesizer Agent

- **Job:** Takes web results + RAG chunks → writes final structured research report
- **Output:** Markdown report with Summary, Key Findings, Detailed Analysis, Sources, Conclusion
- **Streams:** Token by token to frontend via SSE so user sees it being written live
- **LLM:** Groq (Llama 3.3 70B) with streaming enabled

## Agent 5 — Critic Agent

- **Job:** Reads synthesizer's report → evaluates quality
- **Output:** Score 1–10, issues list, suggestions, verdict (approve/revise)
- **The loop:** Score ≥ 7 → deliver to user. Score < 7 → feedback goes back to synthesizer. Max 2 retries.
- **Why it exists:** Catches incomplete or low-quality answers before the user sees them

---

# ⚙️ Tech Stack (Zero Cost)

| Layer | Technology | Why |
| --- | --- | --- |
| Agent Framework | LangGraph | Supports cycles, parallel branches, shared state |
| Agent Tools | LangChain | Prompt templates, output parsers, document loaders |
| LLM | Groq API (free) | Llama 3.3 70B — 14,400 req/day free |
| Embeddings | Google Gemini API (free) | text-embedding-004, 768 dimensions, 1500 req/day |
| Web Search | Tavily API (free) | 1,000 req/month, purpose-built for AI agents |
| Vector DB | Qdrant Cloud (free) | 1GB free forever, semantic search |
| Memory | Upstash Redis (free) | 10,000 commands/day, already in your stack |
| Database | PostgreSQL (Neon) | Sessions, reports, documents, agent_logs |
| Backend | Node.js + Express + TypeScript | Your existing resume stack |
| Frontend | Next.js + TailwindCSS | Your existing resume stack |
| MCP Server | @modelcontextprotocol/sdk | Custom tool server — biggest resume differentiator |
| Deploy (Frontend) | Vercel free tier | Auto-deploy from GitHub |
| Deploy (Backend) | [Render.com](http://Render.com) free tier | 512MB RAM free |

---

# 🔑 API Keys to Get (15 Minutes, ₹0)

- [ ]  **Groq** → [console.groq.com](http://console.groq.com) → free account → API key
- [ ]  **Google AI Studio** → [aistudio.google.com](http://aistudio.google.com) → Get API key
- [ ]  **Tavily** → [tavily.com](http://tavily.com) → free account → API key
- [ ]  **Qdrant Cloud** → [cloud.qdrant.io](http://cloud.qdrant.io) → free cluster → URL + API key
- [ ]  **Upstash** → [upstash.com](http://upstash.com) → create Redis DB → URL + token

---

# 🏗️ Architecture Flow

```
User Question
     ↓
[Next.js Frontend]
     ↓ POST /api/research/start
[Express Backend]
     ↓
[LangGraph StateGraph]
     ↓
[Agent 1: Planner] → creates research plan
     ↓ (splits into 2 parallel tracks)
[Agent 2: Search] ←→ [Agent 3: RAG]
     ↓ (both merge here)
[Agent 4: Synthesizer] → streams report via SSE
     ↓
[Agent 5: Critic] → score check
     ↓ if score < 7 → back to Synthesizer (max 2 retries)
     ↓ if score ≥ 7
[Final Report → User + PostgreSQL]
```

---

# 💾 What Gets Stored

**Sessions table** — session_id, user_id, query, status, created_at, completed_at

**Reports table** — report_id, session_id, content (markdown), quality_score, retry_count, sources (JSON), created_at

**Documents table** — document_id, user_id, filename, file_type, chunk_count, qdrant_collection_name, uploaded_at

**Agent_logs table** — log_id, session_id, agent_name, input_summary, output_summary, duration_ms, token_count, created_at

---

# 📁 Folder Structure

```
multi-agent-research/
├── backend/
│   └── src/
│       ├── agents/          ← planner, search, rag, synthesizer, critic
│       ├── graph/           ← LangGraph StateGraph orchestration
│       ├── mcp/             ← Custom MCP server
│       ├── rag/             ← loader, splitter, embedder, vectorStore
│       ├── routes/          ← Express API routes
│       └── db/              ← postgres, redis, qdrant clients
├── frontend/
│   └── app/
│       ├── page.tsx              ← homepage search
│       ├── research/[id]/page.tsx ← live research + SSE
│       ├── documents/page.tsx    ← upload management
│       └── history/page.tsx      ← past research
└── README.md
```

---

# 🎤 Interview Talking Points

**"Walk me through your multi-agent architecture"**

I built a 5-agent pipeline using LangGraph where a Planner agent breaks down the user's question, a Search agent and RAG agent run in parallel to gather information, a Synthesizer agent writes the report with streaming output, and a Critic agent evaluates quality. If the score is below 7, it loops back to the Synthesizer. I used LangGraph specifically because it supports cycles and parallel branches, which plain LangChain chains cannot do.

**"What is RAG and why not fine-tune?"**

RAG retrieves relevant context from a knowledge base at query time and injects it into the LLM prompt. I chose RAG over fine-tuning because RAG updates instantly when documents change, costs nothing to update, and works for private documents the LLM was never trained on. Fine-tuning requires expensive GPU compute and becomes stale when new information arrives.

**"What is MCP and why did you build a custom server?"**

MCP — Model Context Protocol — is a standard for how LLMs communicate with external tools. Instead of hardcoding Tavily and Qdrant calls inside my agents, I built an MCP server that exposes them as standardized tools. Any MCP-compatible LLM client can discover and use my tools without custom integration code.

**"How does your streaming work?"**

I use Server-Sent Events — the Express backend holds the HTTP connection open and pushes events as LangGraph executes each node. The Synthesizer streams tokens through LangChain's streaming callbacks, forwarded directly to the SSE connection. The frontend parses each event and updates the UI in real time.

---

# 📝 Resume Bullet

> *Built a 5-agent AI research platform using LangGraph orchestration (Planner → Search + RAG in parallel → Synthesizer → Critic loop), custom MCP server exposing search and retrieval tools, RAG pipeline over Qdrant vector DB with Gemini embeddings, real-time SSE streaming to Next.js frontend, PostgreSQL session storage, and Redis memory — fully deployed on Vercel + Render.*
>

---

# 🆕 Skills This Adds to Resume

LangChain · LangGraph · RAG · Qdrant · Vector Embeddings · MCP (Model Context Protocol) · AI Agent Orchestration · Prompt Engineering · SSE Streaming · Google Gemini API · Groq API · Tavily API

---

# 📋 50 Phases — Zero to Deployed

---

## 🗂️ PHASE GROUP 1 — Foundation (Phases 1–10)

- Phase 1 — Project Planning & Scope

    **What you do:**

    - [ ]  Write one paragraph describing exactly what the platform does
    - [ ]  Define who the users are (students, researchers, professionals)
    - [ ]  List every feature the platform will have at launch
    - [ ]  List features OUT of scope (no auth at first, no payments, no mobile)
    - [ ]  Draw rough box diagram on paper — 5 agents and how they connect
    - [ ]  Decide your project name

    **What you learn:**

    - How to scope a project so you don't build forever
    - The difference between MVP and nice-to-have features
    - Why defining "done" before you start saves weeks
- Phase 2 — Architecture Design

    **What you do:**

    - [ ]  Draw full system architecture on paper (frontend → backend → LangGraph → agents → APIs → databases)
    - [ ]  Label every component: Next.js, Express, LangGraph, Groq, Gemini, Tavily, Qdrant, Redis, PostgreSQL
    - [ ]  Draw the data flow: what goes in, what comes out, what gets stored where
    - [ ]  Decide which services run locally vs cloud
    - [ ]  Write down port numbers for every local service (Next.js: 3000, Express: 3001, PG: 5432, Redis: 6379, Qdrant: 6333)
    - [ ]  Identify every API call the system makes

    **What you learn:**

    - System architecture thinking
    - How to read and draw architecture diagrams
    - The difference between frontend, backend, infrastructure, and external services
- Phase 3 — Tech Stack Finalization

    **What you do:**

    - [ ]  Confirm every tool with reasons: Groq (free LLM), Gemini (free embeddings), Tavily (free search), Qdrant Cloud (free vector DB), Upstash Redis (free)
    - [ ]  Sign up for all 5 API keys: Groq, Google AI Studio, Tavily, Qdrant Cloud, Upstash
    - [ ]  Store all keys in notepad temporarily (move to .env in Phase 7)
    - [ ]  Verify each key works by reading the quickstart page for each service
    - [ ]  Confirm Node.js v20 LTS, npm version, Git version on your machine

    **What you learn:**

    - How to evaluate and choose tools for a project
    - What a free tier is and its limits
    - How API keys work and why they must never go to GitHub
- Phase 4 — Development Environment Setup

    **What you do:**

    - [ ]  Install VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Thunder Client, GitLens, Docker
    - [ ]  Configure VS Code settings.json: TypeScript memory limit 2048MB (protects your 8GB RAM)
    - [ ]  Install Docker Desktop — your only heavy local tool
    - [ ]  Verify Docker: run `docker run hello-world` in terminal
    - [ ]  Install Node.js v20 LTS from [nodejs.org](http://nodejs.org)
    - [ ]  Install Git, configure with your GitHub email and name
    - [ ]  Create GitHub account, configure SSH key

    **What you learn:**

    - How to set up a professional dev environment
    - What Docker is and why developers use it
    - How SSH keys work for GitHub authentication
- Phase 5 — Repository & Folder Structure

    **What you do:**

    - [ ]  Create GitHub repo `multi-agent-research` — public
    - [ ]  Clone it to your machine
    - [ ]  Create full folder structure: /backend, /frontend, /docs, /scripts
    - [ ]  Inside backend create: /src/agents, /src/graph, /src/mcp, /src/rag, /src/routes, /src/db
    - [ ]  Create root [README.md](http://README.md) with project title and one-line description
    - [ ]  Create .gitignore: node_modules, .env, dist
    - [ ]  First commit: "Initial project structure"

    **What you learn:**

    - How to structure a full-stack TypeScript project professionally
    - Git workflow: add, commit, push
    - Why .gitignore matters (never push API keys or node_modules)
- Phase 6 — Backend Project Initialization

    **What you do:**

    - [ ]  cd backend → npm init -y
    - [ ]  Install: express, cors, dotenv, typescript, ts-node, nodemon
    - [ ]  Install types: @types/node, @types/express, @types/cors
    - [ ]  Create tsconfig.json (target ES2020, module CommonJS, strict true)
    - [ ]  Create nodemon.json for auto-restart
    - [ ]  Add npm scripts: dev (nodemon), build (tsc), start (node dist)
    - [ ]  Create src/index.ts — basic Express server responding "Server running" on port 3001
    - [ ]  Test: npm run dev → [localhost:3001](http://localhost:3001) → see "Server running"

    **What you learn:**

    - How to initialize a Node.js TypeScript project from scratch
    - What tsconfig.json does and why strict mode matters
    - How nodemon works for hot reload
    - The Express request-response cycle
- Phase 7 — Environment Variables & Configuration

    **What you do:**

    - [ ]  Create .env in /backend with all API keys
    - [ ]  Create .env.example with same keys but empty values (goes to GitHub)
    - [ ]  Install dotenv, load at top of index.ts
    - [ ]  Create src/config.ts exporting all env variables as typed constants
    - [ ]  Add validation: if any required key missing, throw error on startup with specific message
    - [ ]  Test: remove one key → confirm specific error. Restore → confirm normal start

    **What you learn:**

    - 12-factor app principle for configuration management
    - Why validate env variables at startup not runtime
    - How TypeScript typed config objects work
- Phase 8 — PostgreSQL Database Setup (Neon)

    **What you do:**

    - [x]  Create a free project on [Neon.tech](https://neon.tech)
    - [x]  Copy the Connection String (DATABASE_URL) to your `.env`
    - [x]  Install pg and @types/pg
    - [x]  Create src/db/postgres.ts with connection pool using DATABASE_URL
    - [x]  Write test query: create table, insert row, read it, delete table
    - [x]  Confirm connection works, remove test table

    **What you learn:**

    - Difference between local DB vs managed serverless Postgres
    - What a connection pool is and why it's better than single connections
    - Cloud database security (SSL/TLS connections)
- Phase 9 — Database Schema Creation

    **What you do:**

    - [x]  Design 4 tables on paper: sessions, reports, documents, agent_logs
    - [x]  Write schema.sql with CREATE TABLE + indexes for all 4 tables
    - [x]  Create src/db/migrate.ts that reads schema.sql and runs it
    - [x]  Add migrate npm script
    - [x]  Run migration: npm run migrate
    - [x]  Verify all 4 tables in TablePlus or pgAdmin (both free)
    - [x]  Create src/db/queries.ts: createSession, updateSession, saveReport, saveDocument, logAgentActivity

    **What you learn:**

    - Database schema design: primary keys, foreign keys, indexes
    - What a database migration is
    - How to write typed database query functions in TypeScript
- Phase 10 — Redis Setup (Upstash)

    **What you do:**

    - [x]  Go to [upstash.com](http://upstash.com) → create free Redis DB → copy REST URL and token
    - [x]  Add UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to .env
    - [x]  Install @upstash/redis
    - [x]  Create src/db/redis.ts with configured Redis client
    - [x]  Write 4 helper functions: setMemory, getMemory, deleteMemory, setRateLimit
    - [x]  Test: setMemory with test value → getMemory to read back → confirm
    - [x]  Understand TTL: set key with 5s TTL → wait 6s → read → should return null

    **What you learn:**

    - What Redis is: in-memory key-value store
    - What TTL (Time to Live) means
    - Why agents need memory across steps
    - Difference between Redis (speed) and PostgreSQL (durability)

---

## 🗂️ PHASE GROUP 2 — AI Core (Phases 11–20)

- Phase 11 — Qdrant Cloud Setup

    **What you do:**

    - [x]  Go to [cloud.qdrant.io](http://cloud.qdrant.io) → create free cluster → copy URL and API key
    - [x]  Add QDRANT_URL and QDRANT_API_KEY to .env
    - [x]  Install @qdrant/js-client-rest
    - [x]  Create src/db/qdrant.ts with configured Qdrant client
    - [x]  Create test collection test_vectors with vector size 768
    - [x]  Insert 3 fake vectors, run search query, confirm results
    - [x]  Delete test collection

    **What you learn:**

    - What a vector database is vs relational database
    - What a "collection" is in Qdrant (like a table but for vectors)
    - What vector dimensions mean (768 numbers = one text chunk's meaning)
- Phase 12 — LangChain Installation & First Chain

    **What you do:**

    - [x]  Install: @langchain/core, @langchain/groq, @langchain/google-genai
    - [x]  Create src/test/langchain-test.ts
    - [x]  Build first chain: PromptTemplate → Groq LLM → StringOutputParser
    - [x]  Prompt: "What is {topic}? Answer in one sentence."
    - [x]  Call with topic = "machine learning", print result
    - [x]  Run: ts-node src/test/langchain-test.ts
    - [x]  Confirm response from Groq's Llama 3.3 70B
    - [x]  Understand pipe operator: prompt.pipe(llm).pipe(outputParser) — this is LCEL

    **What you learn:**

    - What LangChain is: framework for building LLM applications
    - What LCEL is: LangChain Expression Language — modern way to chain components
    - What a PromptTemplate is: reusable prompt with variables
    - What an output parser does: converts LLM response to usable format
- Phase 13 — Structured Output with JSON Parser

    **What you do:**

    - [x]  Create src/test/structured-output-test.ts
    - [x]  Build chain returning structured JSON: { tasks: string[], search_queries: string[], question_type: "factual" | "analytical" | "opinion" }
    - [x]  Use JsonOutputParser from LangChain
    - [x]  Instruct LLM to return ONLY valid JSON — nothing else
    - [x]  Test with 3 different questions, print typed results
    - [x]  Handle invalid JSON case with try-catch

    **What you learn:**

    - How to force LLMs to return JSON
    - What JsonOutputParser does
    - Why structured output is the foundation of multi-agent systems
    - How to handle LLM output errors gracefully
- Phase 14 — Gemini Embeddings Integration

    **What you do:**

    - [x]  Create src/test/embeddings-test.ts
    - [x]  Use GoogleGenerativeAIEmbeddings with model gemini-embedding-001 (Note: text-embedding-004 is deprecated)
    - [x]  Embed 3 sentences: "Machine learning is a type of AI", "Deep learning uses neural networks", "Pizza is a popular food"
    - [x]  Print first 5 numbers of each embedding vector
    - [x]  Compare ML and deep learning vectors — should be mathematically closer than ML and pizza
    - [x]  Calculate cosine similarity manually between two vectors

    **What you learn:**

    - What embeddings are: numerical representations of text meaning
    - Why similar texts have similar vectors
    - What cosine similarity is: measures angle between vectors (1.0 = identical, 0 = unrelated)
    - Why embeddings are core to RAG, semantic search, recommendation systems
- Phase 15 — Planner Agent (Agent 1)

    **What you do:**

    - [x]  Create src/agents/planner.ts
    - [x]  Input: user's raw question (string)
    - [x]  Write system prompt: act as research planning expert
    - [x]  Output JSON: { tasks (3-5 sub-questions), search_queries (5-6 queries), question_type, estimated_complexity }
    - [x]  Export async function runPlannerAgent(query: string)
    - [x]  Test with 5 different questions across different domains
    - [x]  Log duration ([Date.now](http://Date.now)() before/after) → add to agent_logs table

    **What you learn:**

    - How to write effective system prompts for specific tasks
    - Role prompting: telling LLM it is an expert
    - How to type LangChain chain input/output with TypeScript interfaces
    - Why breaking a question into sub-tasks produces better research results
- Phase 16 — Tavily Search Integration (Agent 2 Tool)

    **What you do:**

    - [ ]  Install @langchain/community (includes TavilySearchResults)
    - [ ]  Create src/tools/tavilySearch.ts
    - [ ]  Configure: maxResults 5, includeAnswer true, includeRawContent false
    - [ ]  Write searchWeb(queries: string[]) — runs all queries in parallel with Promise.all
    - [ ]  Each result: title, url, snippet, published_date
    - [ ]  Test with search_queries from Planner agent test
    - [ ]  Handle rate limits: if 429 error, wait 1s and retry once

    **What you learn:**

    - What Tavily is and why it's better than raw web scraping for LLMs
    - How Promise.all enables parallel API calls
    - What rate limiting is and how to handle it with retry logic
- Phase 17 — Document Loading & Text Splitting (RAG Step 1–2)

    **What you do:**

    - [ ]  Create src/rag/loader.ts — loadDocument(filePath, fileType: "pdf" | "txt")
    - [ ]  Use PDFLoader for PDFs, TextLoader for txt files
    - [ ]  Create src/rag/splitter.ts — splitDocuments(docs)
    - [ ]  Use RecursiveCharacterTextSplitter: chunkSize 500, chunkOverlap 50
    - [ ]  Test with a sample PDF (any free Wikipedia article PDF)
    - [ ]  Print first 3 chunks — verify ~500 characters each
    - [ ]  Verify consecutive chunks share last 50 characters (the overlap)
    - [ ]  Count total chunks from a 10-page PDF

    **What you learn:**

    - What a document loader does: reads files and extracts plain text
    - What text splitting is: why you can't send whole documents to LLMs (context window limits)
    - What chunk overlap is: ensures boundary information isn't lost
    - Why RecursiveCharacterTextSplitter respects sentence boundaries
- Phase 18 — Embedding & Vector Storage (RAG Step 3–4)

    **What you do:**

    - [ ]  Create src/rag/embedder.ts — embedChunks(chunks) → returns embedding vectors via Gemini
    - [ ]  Create src/rag/vectorStore.ts with two functions:
        - storeChunks(collectionName, chunks) — embed all chunks, create Qdrant collection, upload vectors with text payload
        - searchChunks(collectionName, query, topK) — embed query, search Qdrant, return original text
    - [ ]  Test full pipeline: load PDF → split → embed → store → search with question → see relevant chunks
    - [ ]  This is your complete RAG pipeline working end to end for the first time

    **What you learn:**

    - How the full document ingestion pipeline works: file → text → chunks → vectors → Qdrant
    - What "upsert" means in vector databases
    - What topK means: return K most similar results
    - Why vector search finds relevant chunks even when query uses different words than document
- Phase 19 — RAG Agent (Agent 3)

    **What you do:**

    - [ ]  Create src/agents/rag.ts
    - [ ]  Export runRagAgent(query: string, collectionName: string)
    - [ ]  Embed query → search Qdrant top 5 → format into readable context string with source metadata
    - [ ]  If no collection exists: return empty string with flag (no documents uploaded yet)
    - [ ]  If Qdrant fails: catch error, return empty string — don't crash pipeline
    - [ ]  Test: first without documents (graceful empty), then upload PDF, test again (relevant chunks)
    - [ ]  Log agent duration and chunk count to agent_logs

    **What you learn:**

    - How to make a function fail gracefully instead of crashing
    - Why defensive coding is critical in agent pipelines
    - How to format retrieved chunks for LLM consumption
    - The concept of fallback behavior
- Phase 20 — Synthesizer Agent (Agent 4)

    **What you do:**

    - [ ]  Create src/agents/synthesizer.ts
    - [ ]  Input: original query + research plan + web search results + RAG chunks
    - [ ]  Write detailed system prompt: structured markdown report with sections — Summary, Key Findings, Detailed Analysis, Sources, Conclusion
    - [ ]  Prompt must instruct: cite sources by URL, use only provided information, flag contradictions
    - [ ]  Use Groq streaming — response streams token by token
    - [ ]  Export runSynthesizerAgent(inputs) returning async generator (stream of text chunks)
    - [ ]  Test: call with fake results, print each token as it arrives
    - [ ]  Time full response: first token to last token

    **What you learn:**

    - What LLM streaming is: receiving response word by word
    - What an async generator is in JavaScript (async function* with yield)
    - How to write complex multi-section prompts for structured output
    - Why "use only provided information" prevents hallucination in RAG systems

---

## 🗂️ PHASE GROUP 3 — Orchestration & MCP (Phases 21–30)

- Phase 21 — Critic Agent (Agent 5)

    **What you do:**

    - [ ]  Create src/agents/critic.ts
    - [ ]  Input: synthesized report + original question + research plan
    - [ ]  System prompt: "You are a rigorous quality reviewer. Evaluate this research report strictly."
    - [ ]  Output JSON: { score (1-10), issues: string[], suggestions: string[], verdict: "approve" | "revise" }
    - [ ]  Score rubric in prompt: 9-10 = comprehensive, 7-8 = good minor gaps, 5-6 = significant gaps, <5 = fundamentally incomplete
    - [ ]  Verdict: "approve" if score ≥ 7, "revise" if below 7
    - [ ]  Add max retry check: if 3rd revision attempt, always return "approve" (prevents infinite loops)
    - [ ]  Test on great report vs deliberately bad report — verify scores differ significantly

    **What you learn:**

    - How to design quality evaluation prompts for LLM self-assessment
    - What a guard condition is: max retry prevents infinite loops
    - Why agent feedback loops need careful exit conditions
    - The concept of LLM-as-judge
- Phase 22 — LangGraph State Definition

    **What you do:**

    - [ ]  Install @langchain/langgraph
    - [ ]  Create src/graph/state.ts
    - [ ]  Define ResearchState TypeScript interface: query, plan, searchResults, ragResults, report, critique, retryCount, status, sessionId, error
    - [ ]  Understand state channels: each field has a reducer function defining how updates merge
    - [ ]  Define StateGraph channels: most fields use last-write-wins, retryCount increments by adding
    - [ ]  This state is what every agent reads from and writes to — shared memory of entire workflow

    **What you learn:**

    - What shared state is in a multi-agent system
    - What a state reducer is: rule for how state updates are applied
    - Why LangGraph uses channels instead of simple variables
- Phase 23 — LangGraph Graph Construction

    **What you do:**

    - [ ]  Create src/graph/researchGraph.ts
    - [ ]  Import StateGraph from LangGraph + all 5 agent functions
    - [ ]  Create StateGraph with ResearchState channels
    - [ ]  Add all 5 nodes: graph.addNode("planner", plannerNode) etc.
    - [ ]  Set entry point: graph.setEntryPoint("planner")
    - [ ]  Add edges for linear parts: planner → synthesizer, synthesizer → critic
    - [ ]  Add conditional edge from critic: if "approve" → END, if "revise" → back to synthesizer
    - [ ]  Compile: const researchGraph = graph.compile()
    - [ ]  Export compiled graph

    **What you learn:**

    - What a StateGraph is: directed graph where nodes are functions and edges are transitions
    - What setEntryPoint does
    - What conditional edges are: routing based on state values
    - What graph.compile() does: validates graph and returns executable object
- Phase 24 — Parallel Execution (Search + RAG Simultaneously)

    **What you do:**

    - [ ]  Update graph: add both "searcher" and "rag" as edges from "planner"
    - [ ]  Add both "searcher" and "rag" as edges into "synthesizer"
    - [ ]  LangGraph automatically runs parallel branches and waits for both before synthesizer
    - [ ]  Test timing: sequential vs parallel — parallel should be ~40-60% faster
    - [ ]  Add status updates to shared state for each parallel branch
    - [ ]  Verify logs: "searcher started" and "rag started" appear at same timestamp

    **What you learn:**

    - How LangGraph handles parallel node execution
    - What "fan-out, fan-in" means: one node splits into parallel nodes then merges
    - Why parallel execution matters for user experience
    - The concept of synchronization: synthesizer waits for BOTH branches
- Phase 25 — First End-to-End Terminal Test

    **What you do:**

    - [ ]  Create src/test/full-pipeline-test.ts
    - [ ]  Run complete researchGraph with real question: "What are the benefits of TypeScript over JavaScript?"
    - [ ]  Print state updates as each node completes
    - [ ]  Observe full flow: Planner → Search + RAG → Synthesizer → Critic
    - [ ]  If critic approves: print "APPROVED" and full report
    - [ ]  If critic requests revision: watch retry loop in action
    - [ ]  Time entire pipeline start to finish
    - [ ]  Fix all errors — this is your first real integration test
    - [ ]  Take screenshot of terminal output — milestone moment!

    **What you learn:**

    - How to run and debug a multi-step async pipeline
    - What integration testing is vs unit testing
    - How to read LangGraph execution logs
    - Debugging: reading stack traces, tracing data through agent handoffs
- Phase 26 — MCP Server Foundation

    **What you do:**

    - [ ]  Install @modelcontextprotocol/sdk
    - [ ]  Create src/mcp/mcpServer.ts
    - [ ]  Initialize MCP Server: name "research-tools-server", version "1.0.0"
    - [ ]  Register tools/list handler: returns empty tools array for now
    - [ ]  Register tools/call handler: returns "tool not found" for any call
    - [ ]  Connect using StdioServerTransport
    - [ ]  Test using MCP Inspector (free at [modelcontextprotocol.io/inspector](http://modelcontextprotocol.io/inspector))
    - [ ]  Verify server starts and responds to tools/list request

    **What you learn:**

    - What MCP is: Model Context Protocol — standard interface between LLMs and tools
    - What a server transport is: how MCP client communicates with server
    - What tools/list does: allows LLM clients to discover available tools
    - Why standardized protocols matter: any MCP client can use your server
- Phase 27 — MCP Tool 1: Web Search

    **What you do:**

    - [ ]  Add web_search tool to tools/list with full JSON schema definition
    - [ ]  Implement tools/call handler for web_search → calls Tavily → returns structured results
    - [ ]  Schema: name, description, inputSchema (query: string, required)
    - [ ]  Response format follows MCP spec: { content: [{ type: "text", text: "results..." }] }
    - [ ]  Test using MCP Inspector: call web_search with a query → verify real Tavily results
    - [ ]  Add error handling: Tavily failure → return MCP error response (not JS thrown error)
    - [ ]  Test error: temporarily break Tavily key

    **What you learn:**

    - How to define JSON Schema for MCP tool input parameters
    - The MCP tool response format
    - Difference between JS error (throws exception) and MCP error (returns error in response)
- Phase 28 — MCP Tool 2: Document Search

    **What you do:**

    - [ ]  Add document_search tool to MCP server
    - [ ]  Input schema: { query: string, collection_name: string (optional, defaults to "default") }
    - [ ]  Implementation: call searchChunks function from Phase 18
    - [ ]  Return top 5 chunks with source metadata (document name, chunk position)
    - [ ]  If collection doesn't exist: return "No documents uploaded yet. Please upload documents first."
    - [ ]  If no relevant results: return "No relevant information found in uploaded documents."
    - [ ]  Test both cases using MCP Inspector

    **What you learn:**

    - How to handle optional parameters in MCP tool schemas
    - How to write user-friendly error messages (the LLM reads these too)
    - How to make RAG pipeline accessible as a standardized tool
    - The concept of graceful degradation
- Phase 29 — MCP Tools 3 & 4: Memory Tools

    **What you do:**

    - [ ]  Add save_memory tool: inputs — session_id, key, value, ttl_seconds (optional, default 3600)
    - [ ]  Add get_memory tool: inputs — session_id, key
    - [ ]  Both use Upstash Redis functions from Phase 10
    - [ ]  save_memory stores research:{session_id}:{key} = value with TTL
    - [ ]  get_memory retrieves same key — if not found: "Memory not found for this key"
    - [ ]  Test lifecycle: save → get (success) → wait for TTL → get (not found)

    **What you learn:**

    - What agent memory is: ability to store and retrieve information across steps
    - What TTL-based memory means: temporary storage that auto-expires
    - Difference between short-term memory (Redis/TTL) and long-term memory (PostgreSQL permanent)
- Phase 30 — Update Agents to Use MCP Tools

    **What you do:**

    - [ ]  Update Search Agent: call MCP server's web_search tool instead of Tavily directly
    - [ ]  Update RAG Agent: call MCP server's document_search tool instead of Qdrant directly
    - [ ]  Update Planner + Synthesizer: use save_memory and get_memory for intermediate facts
    - [ ]  Run full pipeline again — results should be identical but routing through MCP server
    - [ ]  Check MCP Inspector logs to confirm tool calls are being made

    **What you learn:**

    - The concept of indirection: agents calling tools through a protocol
    - Why this matters: swap out Tavily for another provider by only changing MCP server
    - How tool calling works in LangChain agents
    - Single responsibility principle: agents focus on reasoning, MCP server handles tool execution

---

## 🗂️ PHASE GROUP 4 — Backend API & Streaming (Phases 31–36)

- Phase 31 — SSE (Server-Sent Events) Foundation

    **What you do:**

    - [ ]  Create src/routes/research.ts
    - [ ]  Create POST /api/research/start endpoint accepting { query, sessionId }
    - [ ]  Create GET /api/research/:sessionId/stream endpoint with SSE headers
    - [ ]  Set required headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
    - [ ]  Write helper sendEvent(res, eventType, data) formatting SSE events
    - [ ]  Test: stream endpoint sends test event every 2 seconds — open in browser, watch events arrive

    **What you learn:**

    - What Server-Sent Events (SSE) is: standard for pushing events from server to browser over HTTP
    - How SSE differs from WebSockets (unidirectional vs bidirectional)
    - The SSE event format: event: typendata: {json}nn
    - Why keeping HTTP connection open works for streaming
- Phase 32 — Connecting LangGraph to SSE Stream

    **What you do:**

    - [ ]  Update research route to run researchGraph when request comes in
    - [ ]  Use LangGraph's .stream() method instead of .invoke()
    - [ ]  For each LangGraph event: call sendEvent() to push to SSE stream
    - [ ]  Map node names to user-friendly messages: "planner" → "🧠 Planning your research...", "searcher" → "🔍 Searching the web...", "rag" → "📄 Searching documents...", "synthesizer" → "✍️ Writing report...", "critic" → "⭐ Reviewing quality..."
    - [ ]  For synthesizer: stream individual tokens via LangChain streaming callback
    - [ ]  Test: start research request, open SSE stream in browser, watch events flow live

    **What you learn:**

    - How LangGraph's .stream() method works vs .invoke()
    - What streaming callbacks are in LangChain: functions called per token
    - How to forward async generator output to HTTP response stream
    - Why real-time feedback dramatically improves UX
- Phase 33 — Document Upload API

    **What you do:**

    - [ ]  Install multer for file uploads
    - [ ]  Create src/routes/documents.ts
    - [ ]  POST /api/documents/upload: accepts PDF and TXT, max 10MB
    - [ ]  On upload: save to /tmp → run full RAG pipeline → save metadata to PostgreSQL → delete temp file
    - [ ]  GET /api/documents: returns all uploaded documents for a session
    - [ ]  DELETE /api/documents/:id: deletes from both Qdrant and PostgreSQL
    - [ ]  Test: upload PDF → verify chunks appear in Qdrant Cloud dashboard

    **What you learn:**

    - How file upload middleware works (multer handles multipart/form-data)
    - Why process files asynchronously: don't block the request
    - How to clean up temporary files after processing
- Phase 34 — Session Management & Research History

    **What you do:**

    - [ ]  When research starts: create session record in PostgreSQL
    - [ ]  Update session status as pipeline progresses: "planning" → "searching" → "synthesizing" → "reviewing" → "complete" or "failed"
    - [ ]  When report complete: save full report to reports table with quality score
    - [ ]  Create GET /api/research/history endpoint returning past sessions
    - [ ]  Create GET /api/research/:sessionId endpoint returning specific past report
    - [ ]  Test: run 3 different questions → call history → confirm all 3 appear with reports

    **What you learn:**

    - What session management is in web applications
    - How to track state of a long-running background process
    - The importance of saving results so users can revisit them
- Phase 35 — Error Handling & Resilience

    **What you do:**

    - [ ]  Add global error handler to Express for unhandled errors
    - [ ]  Add try-catch around every agent call in LangGraph nodes
    - [ ]  If agent fails: update session status to "failed", send error event via SSE, close stream
    - [ ]  Add timeout: if any agent takes >30 seconds, cancel and mark as failed
    - [ ]  Add Groq rate limit handler: 429 error → wait 5s → retry once automatically
    - [ ]  Test all error cases: break Groq key, break Tavily key, bad query — verify clean error messages

    **What you learn:**

    - What resilience means: ability to recover from failures gracefully
    - How Express global error handling works
    - What HTTP 429 means and how to handle it
    - Difference between expected error (rate limit) and unexpected error (code bug)
- Phase 36 — Rate Limiting & Security

    **What you do:**

    - [ ]  Install express-rate-limit
    - [ ]  Research endpoint: max 10 requests/minute per IP
    - [ ]  Document upload: max 5 uploads/hour per IP
    - [ ]  CORS: only allow requests from your Next.js frontend URL
    - [ ]  Request validation: empty query → 400, query >1000 chars → 400 "Query too long"
    - [ ]  Input sanitization: trim whitespace, remove HTML tags from query
    - [ ]  Test: make 11 requests quickly → confirm 11th gets 429

    **What you learn:**

    - What rate limiting is and why every public API needs it
    - What CORS is: controls which domains can call your API
    - Input validation: never trust data from the client

---

## 🗂️ PHASE GROUP 5 — Frontend (Phases 37–44)

- Phase 37 — Next.js Project Setup

    **What you do:**

    - [ ]  cd frontend → npx create-next-app@latest . --typescript --tailwind --app
    - [ ]  Install: recharts, lucide-react, react-markdown
    - [ ]  Create folders: app/, components/, hooks/, lib/, types/
    - [ ]  Create lib/api.ts with typed functions: startResearch, getResearchStream, uploadDocument, getHistory
    - [ ]  Create types/research.ts with TypeScript interfaces matching backend response shapes
    - [ ]  Configure next.config.js with backend URL as env variable
    - [ ]  Create .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
    - [ ]  Verify: npm run dev → [localhost:3000](http://localhost:3000)

    **What you learn:**

    - How Next.js App Router differs from Pages Router
    - What NEXT_PUBLIC_ prefix means: env variables accessible in browser
    - Why centralise API calls in lib/api.ts instead of calling fetch everywhere
- Phase 38 — Homepage UI

    **What you do:**

    - [ ]  Create app/page.tsx
    - [ ]  Centered layout: platform name heading, large search input, Research button
    - [ ]  Placeholder text: "Ask anything... e.g., What are the latest trends in AI agents?"
    - [ ]  "Recent Research" section: last 5 sessions from history API
    - [ ]  Each history item: query text, date, quality score badge (green 8+, yellow 6-7, red <6)
    - [ ]  "Upload Documents" button linking to documents page
    - [ ]  Responsive with TailwindCSS — desktop and mobile

    **What you learn:**

    - How Next.js App Router page components work
    - What useEffect is: runs code after component renders (for fetching history)
    - How to fetch data from backend API in Next.js
    - Basic TailwindCSS layout: flexbox, grid, spacing, responsive breakpoints
- Phase 39 — Agent Timeline Component

    **What you do:**

    - [ ]  Create components/AgentTimeline.tsx
    - [ ]  5 agent cards in vertical list: Planner, Search, RAG, Synthesizer, Critic
    - [ ]  Three states per card: Waiting (gray), Running (blue + spinning animation), Complete (green + checkmark + duration ms)
    - [ ]  Component receives current status event from SSE → updates correct agent card
    - [ ]  Smooth CSS transitions between states (0.3s ease)
    - [ ]  Test: manually pass different status strings → verify correct card updates

    **What you learn:**

    - How to build stateful UI components in React using useState
    - CSS transitions and animations with TailwindCSS
    - The concept of lifting state up
    - How to map backend event data to UI state changes
- Phase 40 — Streaming Report Component

    **What you do:**

    - [ ]  Create components/StreamingReport.tsx
    - [ ]  Renders report as tokens arrive from SSE — each token appends to reportText state
    - [ ]  Render reportText using react-markdown (converts markdown to formatted HTML)
    - [ ]  Add blinking cursor at end while streaming (CSS animation)
    - [ ]  When streaming completes: remove cursor, show quality score
    - [ ]  Add "Copy Report" button using Clipboard API: navigator.clipboard.writeText()
    - [ ]  Report sections render with proper formatting: headers, bullet points, bold, links

    **What you learn:**

    - How to build a real-time text streaming UI in React
    - What react-markdown does: converts markdown syntax to HTML
    - How CSS keyframe animations work (blinking cursor)
    - The Clipboard API
- Phase 41 — Research Page with SSE Connection

    **What you do:**

    - [ ]  Create app/research/[sessionId]/page.tsx
    - [ ]  On page load: connect to SSE stream using EventSource API
    - [ ]  Route events: status → AgentTimeline, token → StreamingReport, plan → show plan, critique → quality score
    - [ ]  Handle SSE connection errors: show reconnect button
    - [ ]  Handle SSE complete event: close connection, show "Research Complete" banner
    - [ ]  On page unmount (useEffect cleanup): close SSE connection to free server resources

    **What you learn:**

    - What the browser's EventSource API is: built-in SSE client
    - How useEffect cleanup functions work: code running when component unmounts
    - Event-driven UI updates: different events update different UI parts
    - Memory leak prevention: always close connections on unmount
- Phase 42 — Document Management Page

    **What you do:**

    - [ ]  Create app/documents/page.tsx
    - [ ]  Build drag-and-drop file upload area using React's onDrop and onDragOver
    - [ ]  Show upload progress as percentage bar
    - [ ]  Display uploaded documents list: filename, upload date, chunk count, delete button
    - [ ]  Optimistic UI: remove document from UI immediately on delete, confirm with API
    - [ ]  Frontend validation: only allow .pdf and .txt, show error for other types
    - [ ]  Size validation: reject files >10MB with clear error message

    **What you learn:**

    - How HTML5 drag-and-drop API works in React
    - What optimistic UI updates means: updating UI before server confirms
    - Frontend validation vs backend validation — you need both
- Phase 43 — Research History Page

    **What you do:**

    - [ ]  Create app/history/page.tsx
    - [ ]  Card grid of all past research sessions
    - [ ]  Each card: research question (100 char truncated), date, quality score badge, "View Report" link
    - [ ]  Search/filter: text input filtering cards by question text (client-side, no new API call)
    - [ ]  Sorting: dropdown — newest first or highest quality score first
    - [ ]  "View Report" → loads saved report from PostgreSQL (not re-running agents)
    - [ ]  "Delete" button on each card

    **What you learn:**

    - How client-side filtering and sorting works in React
    - How to use Next.js router.push() for programmatic navigation
    - Difference between loading a saved result vs re-running computation
    - How to display relative timestamps: "2 hours ago", "yesterday"
- Phase 44 — Navigation & Layout

    **What you do:**

    - [ ]  Create components/Navbar.tsx with links: Home, History, Documents
    - [ ]  Create app/layout.tsx wrapping every page with Navbar
    - [ ]  Add loading state: thin progress bar on navigation (like YouTube's red bar)
    - [ ]  Add dark mode toggle — store in localStorage
    - [ ]  Responsive Navbar: hamburger menu on mobile
    - [ ]  Active link highlighting: current page link visually distinct
    - [ ]  Breadcrumb on Research page: "Home > Research > [query truncated]"

    **What you learn:**

    - How Next.js layouts work: components wrapping multiple pages
    - What localStorage is: browser storage persisting between sessions
    - How dark mode works with TailwindCSS dark: variant

---

## 🗂️ PHASE GROUP 6 — Polish, Deploy & Portfolio (Phases 45–50)

- Phase 45 — Frontend-Backend Integration Testing

    **What you do:**

    - [ ]  Run both frontend and backend simultaneously
    - [ ]  Test complete user journey:
        - [ ]  Open [localhost:3000](http://localhost:3000)
        - [ ]  Upload a PDF document
        - [ ]  Type research question related to the document
        - [ ]  Watch agent timeline update live
        - [ ]  Watch report stream word by word
        - [ ]  See quality score when critic finishes
        - [ ]  Check history page — research appears
        - [ ]  Click history item — saved report loads without re-running agents
    - [ ]  Document every bug, fix one by one
    - [ ]  Test different question types: factual, analytical, opinion

    **What you learn:**

    - How integration testing works: testing entire system together
    - How to debug issues only appearing when frontend and backend communicate
    - What CORS errors look like and how to fix them
- Phase 46 — Performance Optimization

    **What you do:**

    - [ ]  Add response caching: same query within 24 hours → return cached report from PostgreSQL
    - [ ]  Add embedding caching: already-embedded chunks stored in Redis (hash of text as key)
    - [ ]  Measure and log token usage for every Groq API call → add to agent_logs
    - [ ]  Measure and display total research time on completed research page
    - [ ]  Identify slowest agent from agent_logs and investigate why
    - [ ]  Verify PostgreSQL connection pool size is appropriate

    **What you learn:**

    - What caching is and why it reduces API costs and response times
    - What cache invalidation means: when does cache become stale?
    - How to measure performance: logging timestamps before/after
    - What token usage means in LLM APIs and why it matters for cost
- Phase 47 — Logging & Monitoring Setup

    **What you do:**

    - [ ]  Add structured logging using winston (free library)
    - [ ]  Configure two log levels: info (normal ops) and error (failures)
    - [ ]  Every API request logs: method, path, status code, response time, session ID
    - [ ]  Every agent execution logs: agent name, duration, token count, success/failure
    - [ ]  Create GET /api/admin/logs endpoint returning recent 100 logs from agent_logs
    - [ ]  Create simple admin page at /admin displaying logs in table
    - [ ]  Add health check: GET /api/health → { status: "ok", uptime: seconds, version: "1.0.0" }

    **What you learn:**

    - What structured logging is: logs as JSON objects instead of plain text
    - What log levels are: debug, info, warn, error — and when to use each
    - What a health check endpoint is: used by monitoring tools
- Phase 48 — Deployment Preparation

    **What you do:**

    - [ ]  Create production Dockerfile for backend: multi-stage (build TypeScript → run compiled JS)
    - [ ]  Create .dockerignore: exclude node_modules, .env, src
    - [ ]  Update all hardcoded [localhost](http://localhost) URLs to use environment variables
    - [ ]  Create production .env.example with all variables documented
    - [ ]  Test Docker build locally: docker build -t research-backend . → docker run -p 3001:3001
    - [ ]  Create vercel.json for frontend
    - [ ]  Run npm run build in both frontend and backend — fix all TypeScript errors
    - [ ]  Audit .gitignore — confirm .env files excluded

    **What you learn:**

    - What a Dockerfile is: instructions for building a Docker image
    - What multi-stage Docker builds are: smaller production images
    - Why production builds are stricter than development builds
- Phase 49 — Deploy to Production

    **What you do:**

    - [ ]  Deploy frontend to Vercel:
        - [ ]  Push to GitHub
        - [ ]  Connect Vercel to GitHub repo
        - [ ]  Add all environment variables in Vercel dashboard
        - [ ]  Deploy and test on live Vercel URL
    - [ ]  Deploy backend to [Render.com](http://Render.com):
        - [ ]  Create Web Service on Render
        - [ ]  Connect GitHub repo, root dir /backend
        - [ ]  Add all environment variables
        - [ ]  Build command: npm run build | Start: node dist/index.js
        - [ ]  Deploy and test live backend URL
    - [ ]  Update NEXT_PUBLIC_API_URL in Vercel to point to Render URL
    - [ ]  Test full deployed application end to end

    **What you learn:**

    - How CI/CD works: push to GitHub → auto-deploy
    - What environment variables in deployment platforms mean
    - How to debug production deployment issues
    - What a cold start is on free hosting tiers
- Phase 50 — Documentation, README & Portfolio Polish

    **What you do:**

    - [ ]  Write comprehensive [README.md](http://README.md):
        - [ ]  Project title and one-line description
        - [ ]  Architecture diagram (draw in Excalidraw free, export PNG, embed)
        - [ ]  Tech stack table with every tool and why you chose it
        - [ ]  Features list with screenshots
        - [ ]  Setup instructions (someone else can clone and run)
        - [ ]  Environment variables documentation
        - [ ]  API endpoints documentation
        - [ ]  Known limitations section
    - [ ]  Record 3-minute demo video: screen record + narrate what each agent is doing
    - [ ]  Upload demo to YouTube (unlisted) + add link to README
    - [ ]  Add live Vercel URL to README
    - [ ]  Pin project to GitHub pinned repositories
    - [ ]  Write LinkedIn post about what you built — explain architecture simply
    - [ ]  Update resume with final project bullet point

    **What you learn:**

    - How to write professional technical documentation
    - What architecture diagrams communicate
    - How to present a technical project to non-technical people
    - The importance of a live demo URL — interviewers click it during interviews

---

# ✅ Progress Tracker

| Phase Group | Phases | Status |
| --- | --- | --- |
| 🏗️ Foundation | 1–10 | Not Started |
| 🤖 AI Core | 11–20 | Not Started |
| 🔗 Orchestration & MCP | 21–30 | Not Started |
| 🌐 Backend API | 31–36 | Not Started |
| 🎨 Frontend | 37–44 | Not Started |
| 🚀 Deploy & Polish | 45–50 | Not Started |

---

# ⏱️ Time Estimate

| Phases | Days (4–5 hrs/day) |
| --- | --- |
| Phases 1–10 | Days 1–5 |
| Phases 11–20 | Days 6–12 |
| Phases 21–30 | Days 13–18 |
| Phases 31–36 | Days 19–22 |
| Phases 37–44 | Days 23–27 |
| Phases 45–50 | Days 28–30 |
| **Total** | **~30 days to live deployed product** |

---

# 🎯 What You Have After Phase 50

- ✅ Live URL on Vercel + Render
- ✅ GitHub repo with clean commit history
- ✅ Architecture diagram in README
- ✅ 3-minute demo video on YouTube
- ✅ Resume bullet point ready
- ✅ LinkedIn post published
- ✅ Strongest AI project among any fresher applying to Indian product companies
