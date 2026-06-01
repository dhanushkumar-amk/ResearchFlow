import os
import asyncio
import logging
from bson import ObjectId
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnableLambda
from langchain_classic.retrievers import EnsembleRetriever
from langchain_core.retrievers import BaseRetriever

from app.core.config import settings
from app.core.database import get_database
from app.rag.retriever import get_vector_store, get_user_bm25_retriever
from app.rag.reranker import get_rerank_compressor
from app.rag.context import format_chunks_with_lost_in_the_middle
from app.rag.memory import get_session_history_and_summary

logger = logging.getLogger("researchmind")

# Fallback models definitions
# Keep Groq primary, then use verified OpenRouter free-tier models.
# Models returning 404 have been removed (nvidia/nemotron, openrouter/free, etc.)
FALLBACK_MODELS = [
    "groq/llama-3.3-70b-versatile",
    "gemini/gemini-2.5-flash",
    "gemini/gemini-1.5-flash",
    "openrouter/openrouter/free",
]

def create_chat_model(
    model_name: str,
    temperature: float = 0.1,
    max_tokens: int = 1000,
    request_timeout: float = 15.0,
    max_retries: int = 0
):
    if model_name.startswith("groq/"):
        from langchain_groq import ChatGroq
        model = model_name[5:]
        return ChatGroq(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=request_timeout,
            max_retries=max_retries,
            api_key=settings.groq_api_key
        )
    elif model_name.startswith("gemini/"):
        from langchain_openai import ChatOpenAI
        model = model_name[7:]
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=request_timeout,
            max_retries=max_retries,
            openai_api_key=api_key,
            openai_api_base="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    elif model_name.startswith("openrouter/"):
        from langchain_openai import ChatOpenAI
        model = model_name[11:]
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=request_timeout,
            max_retries=max_retries,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base="https://openrouter.ai/api/v1"
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=request_timeout,
            max_retries=max_retries,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base="https://openrouter.ai/api/v1"
        )


# Lazy proxy class for LLMs
class LazyProxy:
    def __init__(self, factory):
        object.__setattr__(self, "_factory", factory)
        object.__setattr__(self, "_wrapped", None)

    def _get_wrapped(self):
        wrapped = object.__getattribute__(self, "_wrapped")
        if wrapped is None:
            factory = object.__getattribute__(self, "_factory")
            wrapped = factory()
            object.__setattr__(self, "_wrapped", wrapped)
        return wrapped

    def __getattribute__(self, name):
        if name in ("_factory", "_wrapped", "_get_wrapped", "__or__", "__ror__", "__aiter__", "__anext__"):
            return object.__getattribute__(self, name)
        return getattr(self._get_wrapped(), name)

    def __setattr__(self, name, value):
        setattr(self._get_wrapped(), name, value)

    def __call__(self, *args, **kwargs):
        return self._get_wrapped()(*args, **kwargs)

    def __iter__(self):
        return iter(self._get_wrapped())

    def __next__(self):
        return next(self._get_wrapped())

    def __repr__(self):
        return repr(self._get_wrapped())

    def __str__(self):
        return str(self._get_wrapped())

    def __or__(self, other):
        return self._get_wrapped().__or__(other)

    def __ror__(self, other):
        return self._get_wrapped().__ror__(other)

    def __aiter__(self):
        return self._get_wrapped().__aiter__()

    def __anext__(self):
        return self._get_wrapped().__anext__()


def _make_primary_llm():
    return create_chat_model(
        model_name=FALLBACK_MODELS[0],
        temperature=0.1,
        max_tokens=1000,
        request_timeout=15.0,
        max_retries=0
    )

def _make_resilient_llm():
    primary = _make_primary_llm()
    fallbacks = [
        create_chat_model(
            model_name=model_name,
            temperature=0.1,
            max_tokens=1000,
            request_timeout=15.0,
            max_retries=0
        )
        for model_name in FALLBACK_MODELS[1:]
    ]
    return primary.with_fallbacks(fallbacks=fallbacks)

primary_llm = LazyProxy(_make_primary_llm)
resilient_llm = LazyProxy(_make_resilient_llm)

class PrecomputedRetriever(BaseRetriever):
    docs: list[Document]
    
    def _get_relevant_documents(self, query: str) -> list[Document]:
        return self.docs

def merge_hybrid_results(vector_docs: list[Document], bm25_docs: list[Document], limit: int = 20) -> list[Document]:
    """
    Combine Vector Search and BM25 results using LangChain's EnsembleRetriever.
    Applies weights from active RAG configuration dynamically.
    Returns the top unique merged results.
    """
    vector_weight = 0.7
    bm25_weight = 0.3
    k_limit = limit

    r1 = PrecomputedRetriever(docs=vector_docs)
    r2 = PrecomputedRetriever(docs=bm25_docs)
    
    ensemble = EnsembleRetriever(
        retrievers=[r1, r2],
        weights=[vector_weight, bm25_weight]
    )
    
    fused_docs = ensemble.invoke("dummy query")
    return fused_docs[:k_limit]

async def search_vector_async(inputs: dict) -> list[Document]:
    query = inputs["query"]
    user_id = inputs["user_id"]
    source_ids = inputs.get("source_ids")
    
    k_val = 20
    
    pre_filter = {"user_id": user_id}
    if source_ids:
        pre_filter["source_id"] = {"$in": [ObjectId(sid) for sid in source_ids]}
        
    vstore = get_vector_store()
    try:
        try:
            results_with_score = await vstore.asimilarity_search_with_score(
                query,
                k=k_val,
                pre_filter=pre_filter
            )
        except (AttributeError, NotImplementedError):
            # Fallback to run synchronous search in threadpool
            results_with_score = await asyncio.to_thread(
                vstore.similarity_search_with_score,
                query,
                k=k_val,
                pre_filter=pre_filter
            )
        
        docs = []
        for doc, score in results_with_score:
            doc.metadata["relevance_score"] = float(score)
            docs.append(doc)
        return docs
    except Exception as e:
        logger.warning(f"[RAG Vector Search] Vector search failed: {e}. Gracefully returning empty list for vector docs.", exc_info=True)
        return []

async def search_bm25_async(inputs: dict) -> list[Document]:
    query = inputs["query"]
    user_id = inputs["user_id"]
    source_ids = inputs.get("source_ids")
    
    k_val = 20
    
    retriever = get_user_bm25_retriever(user_id, source_ids)
    retriever.k = k_val
    docs = await asyncio.to_thread(retriever.invoke, query)
    return docs

# LCEL steps definition
retrieval_step = RunnableParallel({
    "vector_docs": RunnableLambda(search_vector_async),
    "bm25_docs": RunnableLambda(search_bm25_async),
    "query": RunnableLambda(lambda x: x["query"]),
    "user_id": RunnableLambda(lambda x: x["user_id"]),
    "session_id": RunnableLambda(lambda x: x.get("session_id", "default")),
    "queue": RunnableLambda(lambda x: x.get("queue"))
})

hybrid_step = RunnableLambda(lambda x: {
    "fused_docs": merge_hybrid_results(x["vector_docs"], x["bm25_docs"], limit=20),
    "query": x["query"],
    "user_id": x["user_id"],
    "session_id": x["session_id"],
    "queue": x["queue"]
})

async def rerank_step_runnable(x: dict) -> dict:
    fused_docs = x["fused_docs"]
    query = x["query"]
    compressor = get_rerank_compressor()
    
    top_n = 5
    
    if compressor and fused_docs:
        # Dynamic top_n update
        compressor.top_n = top_n
        reranked_docs = await asyncio.to_thread(compressor.compress_documents, fused_docs, query)
    else:
        reranked_docs = fused_docs[:top_n]
        
    for doc in reranked_docs:
        if hasattr(doc, "state") and "relevance_score" in doc.state:
            doc.metadata["relevance_score"] = float(doc.state["relevance_score"])
        elif hasattr(doc, "relevance_score"):
            doc.metadata["relevance_score"] = float(doc.relevance_score)
        elif "relevance_score" not in doc.metadata:
            doc.metadata["relevance_score"] = 0.0
            
    return {
        "reranked_docs": reranked_docs,
        "query": query,
        "user_id": x["user_id"],
        "session_id": x["session_id"],
        "queue": x["queue"]
    }

rerank_step = RunnableLambda(rerank_step_runnable)

async def build_context_runnable(x: dict) -> dict:
    docs = x["reranked_docs"]
    query = x["query"]
    user_id = x["user_id"]
    session_id = x["session_id"]
    
    context_str, included_sources = format_chunks_with_lost_in_the_middle(docs, max_tokens=3200)
    db = get_database()
    history_str = await get_session_history_and_summary(user_id, session_id, db)
    
    return {
        "context": context_str,
        "history": history_str,
        "query": query
    }

context_step = RunnableLambda(build_context_runnable)

# Chat Prompt Template
prompt_template = ChatPromptTemplate.from_template(
    "You are ResearchMind — an intelligent research assistant.\n"
    "Answer ONLY based on the provided context.\n"
    "If answer not in context say exactly:\n"
    "\"I could not find this in the provided documents.\"\n"
    "Always cite source name for every fact you state.\n"
    "Be concise, accurate and factual.\n\n"
    "Context:\n{context}\n\n"
    "Conversation History:\n{history}\n\n"
    "Question: {query}"
)

# Combined LCEL Chain
lcel_chain = (
    retrieval_step
    | hybrid_step
    | rerank_step
    | context_step
    | prompt_template
    | resilient_llm
)