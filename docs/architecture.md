# 🏗️ ResearchFlow Architecture & System Diagrams

This document outlines the detailed interaction sequences, query routing mechanisms, ingestion pipelines, and authentication flows that power the **ResearchFlow** engine.

---

## 🔄 1. Detailed Interaction Flow (Sequence Diagram)

This sequence diagram illustrates the lifecycle of a research query, from the user's initial POST request, through the LangGraph agent orchestration, parallel worker swarms, streaming synthesis, and the iterative Critic validation loop.

```mermaid
sequenceDiagram
    actor User
    participant API as Express API
    participant Graph as LangGraph
    participant Planner as Agent 1: Planner
    participant Search as Agent 2: Search
    participant RAG as Agent 3: RAG
    participant Synth as Agent 4: Synthesizer
    participant Critic as Agent 5: Critic
    participant DB as PostgreSQL
    participant Redis as Redis Cache
    participant Qdrant as Qdrant Vector DB

    User->>API: POST /api/research { query }
    API->>DB: Check 24h cache (getCachedReport)
    DB-->>API: Cache miss
    API->>DB: createSession()
    API-->>User: { sessionId } (immediate)
    API->>Graph: invoke({ sessionId, query })

    Graph->>Planner: plannerNode(state)
    Planner->>Redis: (optional) save_memory
    Planner-->>Graph: { researchPlan }
    Graph-->>User: SSE: plan event

    par Parallel execution
        Graph->>Search: researcherNode(state)
        Search->>Search: classifyQuery()
        Search->>Search: arxivSearch + pubmedSearch + githubSearch + newsSearch
        Search-->>Graph: { searchResults }
    and
        Graph->>RAG: ragNode(state)
        RAG->>Qdrant: document_search via MCP
        Qdrant-->>RAG: relevant chunks
        RAG-->>Graph: { ragResults }
    end

    Graph->>Synth: synthesizerNode(state)
    Synth-->>User: SSE: streaming report chunks
    Synth-->>Graph: { report }

    Graph->>Critic: criticNode(state)
    Critic->>Critic: evaluate completeness, clarity, accuracy, safety
    Critic-->>Graph: { score, verdict }

    alt verdict = revise AND retryCount < 2
        Graph->>Synth: re-synthesize (revision loop)
    else verdict = approve
        Graph->>DB: saveReport(content, score)
        Graph->>DB: updateSessionStatus(complete)
        Graph-->>User: SSE: complete event
    end

    User->>API: POST /:sessionId/chat { query }
    API->>DB: getSessionReport()
    API-->>User: streaming chat response
```

---

## 🤖 2. Agent Pipeline

Below is the execution flow of the LangGraph state machine orchestrating the specialized research agents:

<div align="center">
  <img src="img/agent%20pipeline.png" alt="Agent Pipeline" width="90%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" />
</div>

---

## 🧭 3. Query Routing

The routing classifier determines which external web search tools, academic databases, and social forums are activated based on semantic keywords in the query:

<div align="center">
  <img src="img/query%20routing.png" alt="Query Routing" width="90%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" />
</div>

---

## 📥 4. Document Ingestion Pipeline

How uploaded documents (PDFs, URLs, YouTube videos) are parsed, chunked, embedded, and indexed into Postgres metadata and Qdrant Vector DB collections:

<div align="center">
  <img src="img/Document%20Ingestion%20Pipeline.png" alt="Document Ingestion Pipeline" width="90%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" />
</div>

---

## 🔐 5. Authentication Flow

The secure user session lifecycle managed via JWT, Node-Postgres database records, and Redis OTP verification:

<div align="center">
  <img src="img/Auth%20Flow.png" alt="Authentication Flow" width="90%" style="border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" />
</div>
