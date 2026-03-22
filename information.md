# ResearchFlow — Multi-Agent Research Assistant

> An AI system where 5 specialized agents work together to answer research questions by searching the web + your documents, then writing a quality-checked report in real-time.

---

## 🧠 Core Concept

**Traditional chatbot:** You ask → LLM answers (often wrong or outdated)

**This system:** You ask → Planner breaks it down → Search agent gets real web info + RAG agent searches your docs → Synthesizer writes structured report → Critic checks quality → You get cited, reliable answer

**Why companies care:** This is how **Perplexity** (valued at $9B), **Consensus**, and **Elicit** work. You're building the same architecture.

---

## 🤖 The 5 Agents

### Agent 1: Planner
- **Job:** Takes your vague question → breaks into specific sub-questions
- **Example:** "Tell me about AI" → ["What is AI definition?", "What are current AI applications?", "What are AI limitations?"]
- **Why:** Computers need specific instructions, not vague ones

### Agent 2: Search Agent
- **Job:** Searches the web for current information using Tavily API
- **Why:** LLMs have knowledge cutoffs (trained on old data). This gets TODAY's info.
- **Output:** Real articles, URLs, dates

### Agent 3: RAG Agent
- **Job:** Searches documents YOU uploaded for relevant chunks
- **Why:** Combines public web knowledge with your private documents
- **How:** Converts text to math vectors → finds similar vectors = similar meaning

### Agent 4: Synthesizer
- **Job:** Reads everything from Search + RAG → writes final report with sources
- **Streams:** You watch it type word-by-word like ChatGPT
- **Output:** Structured markdown: Summary, Findings, Analysis, Sources, Conclusion

### Agent 5: Critic
- **Job:** Reads the report → gives score 1-10
- **If score < 7:** Sends feedback back to Synthesizer to rewrite
- **If score ≥ 7:** Delivers report to you
- **Why:** Quality control before you see the answer

---

## 🔄 The Flow

```
You type: "What are the benefits of TypeScript?"
         ↓
[Planner] → Breaks into 3 sub-questions + creates 5 search queries
         ↓
    [PARALLEL EXECUTION]
         ↙          ↘
[Search Agent]  [RAG Agent]
Tavily API      Your uploaded docs
         ↘          ↙
         [Synthesizer]
    Writes report streaming
         ↓
      [Critic]
    Scores quality
         ↓
   Score < 7? → Back to Synthesizer (max 2 retries)
   Score ≥ 7? → DONE! Report delivered
```

**Key insight:** Search and RAG run at the SAME TIME (parallel) = faster results.

---

## 🧩 Key Technologies

### LangGraph
- **What:** Framework for connecting AI agents
- **Why not plain code:** Supports cycles (Critic → Synthesizer loop) and parallel branches (Search + RAG simultaneously)
- **Think of it as:** A flowchart that executes itself

### RAG (Retrieval-Augmented Generation)
- **What:** Instead of LLM making up answers, it reads your documents first
- **3 steps:**
  1. Upload doc → split into chunks
  2. Convert chunks to embeddings (math vectors)
  3. When you ask question → find most similar chunks → LLM reads those → answers
- **Why not fine-tuning:** RAG updates instantly when docs change. Fine-tuning needs expensive GPU retraining.

### Vector Embeddings
- **What:** Converting text into arrays of numbers representing meaning
- **Example:**
  - "Machine learning" → [0.2, 0.8, 0.1, ...]
  - "Deep learning" → [0.3, 0.7, 0.2, ...] (similar numbers — similar meaning)
  - "Pizza recipe" → [0.9, 0.1, 0.3, ...] (very different numbers — different meaning)
- **Why:** Math can find similar meanings even when words are different

### MCP (Model Context Protocol)
- **What:** Standardized way for LLMs to call external tools (like search, database)
- **Why you built custom MCP server:** Instead of hardcoding Tavily/Qdrant in agents, you exposed them as tools ANY LLM can discover and use
- **Analogy:** Like USB — any device with USB port can use any USB accessory

### SSE (Server-Sent Events)
- **What:** Server pushes updates to browser without browser asking repeatedly
- **Why:** You see agents working live — each status update, each word of report
- **How:** HTTP connection stays open, server sends events as they happen
- **Different from WebSocket:** One-way only (server → browser). Simpler.

---

## 💾 Database Architecture

| Data | Where | Why |
|------|-------|-----|
| API keys | .env file (NEVER GitHub) | Security |
| Session info | PostgreSQL | Permanent, needs relations |
| Agent memory | Redis (Upstash) | Fast, temporary (TTL expires) |
| Document chunks | Qdrant | Vector search needs specialized DB |
| Final reports | PostgreSQL | Users revisit past research |
| Agent logs | PostgreSQL | Debugging, monitoring |

**Key insight:** Use right database for right job.
- Postgres = relations
- Redis = speed
- Qdrant = similarity search

---

## 📊 Architecture Layers (Bottom to Top)

```
LAYER 5: Frontend (Next.js)
         ↓ HTTP/SSE
LAYER 4: Backend API (Express)
         ↓ Invokes
LAYER 3: LangGraph Orchestrator
         ↓ Calls
LAYER 2: 5 Agent Functions
         ↓ Use
LAYER 1: Tools/APIs (Groq, Gemini, Tavily, Qdrant, Redis, PostgreSQL)
```

Each layer only talks to adjacent layers — clean separation.

---

## ⚡ Why This is Impressive

### Performance
- **Sequential:** Planner (2s) → Search (3s) → RAG (3s) → Synthesizer (5s) = **13 seconds**
- **Parallel:** Planner (2s) → Search + RAG together (3s) → Synthesizer (5s) = **10 seconds**
- Users perceive **30% improvement** from this single architectural decision

### Production-Ready Features
- Error handling, rate limiting, logging, monitoring
- Critic loop prevents low-quality reports from reaching users
- MCP server is swappable — change Tavily to another search API without touching agents

---

## 🎯 Interview Talking Points

### "Why did you use LangGraph?"
> "LangGraph supports **cycles** and **parallel execution**. When my Critic agent needs to send feedback back to Synthesizer, that's a cycle — plain LangChain chains are strictly linear and can't do that. Also, I run Search and RAG simultaneously for speed — LangGraph's fan-out/fan-in pattern handles this natively."

### "Explain RAG in simple terms"
> "RAG means the LLM reads relevant documents before answering instead of guessing from training. I split documents into chunks, convert them to embeddings, store in Qdrant. When user asks a question, I find the 5 most similar chunks and give those to the LLM. This prevents hallucination and works with private documents the LLM never saw."

### "What is MCP and why does it matter?"
> "MCP is Model Context Protocol — a standard interface between LLMs and tools. I built a custom MCP server exposing my Tavily search and Qdrant retrieval as standardized tools. This means any MCP-compatible client — Claude, GPT, Gemini — can discover and use my tools without custom code. If I swap Tavily for another provider tomorrow, I only change the MCP server — agents don't need updates."

### "How does streaming work?"
> "I use Server-Sent Events — the backend holds the HTTP connection open and pushes updates. LangGraph emits events as each node completes. The Synthesizer uses LangChain's streaming callbacks to send each token as it's generated by Groq. Frontend parses SSE events and updates UI in real-time. Users see the report being written word-by-word."

### "Why not fine-tune the LLM instead of RAG?"
> "Fine-tuning requires expensive GPUs, takes hours, and becomes stale when new documents arrive. RAG updates instantly — upload doc, it's searchable in seconds. Also, fine-tuning can't handle private user documents the base model never saw. RAG works with any document at query time."

---

## 🚀 Scaling Answers (For Senior Interviews)

### "How would you scale this to 1000 concurrent users?"
> "Add a message queue like BullMQ. Research requests go into queue, worker processes pull jobs. Frontend polls `/api/research/:sessionId/status` instead of SSE. This decouples request handling from agent execution. I'd add horizontal scaling on Render with a load balancer."

### "How would you reduce hallucination further?"
> "Add citation verification — after Synthesizer writes report, use another agent to check each claim has a supporting source. If a claim has no source, flag or remove it. Also use `temperature=0` for factual agents (Planner, Critic) and `temperature=0.3` for Synthesizer."

### "What if Tavily API goes down?"
> "Implement fallback search — try DuckDuckGo API or SerpAPI. Add circuit breaker pattern — after 3 consecutive Tavily failures, automatically switch to fallback for 5 minutes. Log all fallback usage for monitoring."

---

## 📝 The One-Sentence Explanation

> "I built a 5-agent system using LangGraph orchestration where agents search the web and user documents in parallel, synthesize findings into a cited report with streaming output, then self-evaluate quality with a critic loop — combining RAG over Qdrant, custom MCP tool server, and real-time SSE to Next.js frontend."

**Use this in interviews when they ask "tell me about your project."**

---

## 🎓 What You Actually Learned

This is **AI Engineering**, not AI theory:
- How to orchestrate multiple LLMs to solve complex tasks
- How to prevent hallucination with retrieval
- How to handle real-world constraints (rate limits, timeouts, errors)
- How to make AI systems feel fast (streaming, parallel execution)
- How to build tools LLMs can actually use (MCP)

**This is what AI Engineers at Perplexity, Glean, and Harvey AI do daily.**
