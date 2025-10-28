from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, START, END
import google.generativeai as genai
import os

from app.routes import router as api_router
from app.core.config import settings
from app.core.database import get_supabase_client

# ==============================
# 🔹 Configure Gemini API
# ==============================
genai.configure(api_key=settings.GEMINI_API_KEY)

# ==============================
# 🔹 Define Graph State for RAG
# ==============================
class RAGState(TypedDict):
    question: str
    query_embedding: List[float]
    retrieved_docs: List[Dict[str, Any]]
    context_text: str
    final_answer: str

# ==============================
# 🔹 RAG Pipeline Functions
# ==============================
def embed_query(state: RAGState):
    """Generate embedding using Gemini."""
    try:
        question_text = state["question"]
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=question_text,
            task_type="retrieval_query"
        )
        state["query_embedding"] = response["embedding"]
    except Exception as e:
        print(f"❌ Error in embed_query: {e}")
        state["query_embedding"] = []
    return state


def retrieve_docs(state: RAGState):
    """Retrieve similar documents using Supabase vector search."""
    try:
        query_vec = state["query_embedding"]
        if not query_vec:
            print("⚠ No embeddings generated.")
            state["retrieved_docs"] = []
            return state

        # --- Call the Supabase RPC ---
        supabase = get_supabase_client()
        result = supabase.rpc(
            "match_list_embeddings",
            {
                "query_embedding": query_vec,   # list of floats
                "filter_domain": None,          # optional filters
                "filter_subdomain": None,
                "match_threshold": 0.3,         # lower threshold for testing
                "match_count": 10
            }
        ).execute()

        # --- Handle RPC response ---
        if hasattr(result, "error") and result.error:
            print("❌ Supabase RPC Error:", result.error)
            state["retrieved_docs"] = []
        elif result.data:
            state["retrieved_docs"] = result.data
        else:
            print("⚠ No matches found (empty data).")
            state["retrieved_docs"] = []

    except Exception as e:
        print(f"❌ Error in retrieve_docs: {e}")
        state["retrieved_docs"] = []
    return state


def compose_context(state: RAGState):
    """Combine retrieved documents into a readable context."""
    try:
        if not state["retrieved_docs"]:
            state["context_text"] = f"No context found for: {state['question']}"
            return state

        docs = [
            f"[{r.get('entity_type', 'Unknown').capitalize()} #{r.get('entity_id', '')}]\n{r.get('content', '')}"
            for r in state["retrieved_docs"]
        ]
        context = "\n\n".join(docs)
        state["context_text"] = f"Context:\n{context}\n\nQuestion: {state['question']}"
    except Exception as e:
        print(f"❌ Error in compose_context: {e}")
        state["context_text"] = state["question"]
    return state


def generate_answer(state: RAGState):
    """Generate final answer using Gemini based on retrieved context."""
    try:
        context_text = state["context_text"]
        prompt = f"""You are a helpful assistant that answers questions based only on the provided context.

{context_text}

Answer clearly and concisely using only this context."""

        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        state["final_answer"] = response.text
    except Exception as e:
        print(f"❌ Error in generate_answer: {e}")
        state["final_answer"] = "Error generating answer."
    return state


# ==============================
# 🔹 Build the LangGraph RAG Workflow
# ==============================
def build_rag_graph():
    builder = StateGraph(RAGState)
    builder.add_node("embed_query", embed_query)
    builder.add_node("retrieve_docs", retrieve_docs)
    builder.add_node("compose_context", compose_context)
    builder.add_node("generate_answer", generate_answer)

    builder.add_edge(START, "embed_query")
    builder.add_edge("embed_query", "retrieve_docs")
    builder.add_edge("retrieve_docs", "compose_context")
    builder.add_edge("compose_context", "generate_answer")
    builder.add_edge("generate_answer", END)
    return builder.compile()

graph = build_rag_graph()

# ==============================
# 🔹 FastAPI Application Setup
# ==============================
app = FastAPI(title="Supabase FastAPI + Pydantic API + RAG Bot")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# 🔹 Request & Response Models
# ==============================
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str

# ==============================
# 🔹 API Endpoints
# ==============================
@app.get("/")
def home():
    return {"message": "✅ FastAPI + Supabase + Gemini Bot running"}

@app.post("/api/query", response_model=QueryResponse)
def ask_bot(request: QueryRequest):
    """RAG-powered chatbot endpoint for the assistant."""
    try:
        initial_state = {
            "question": request.question,
            "query_embedding": [],
            "retrieved_docs": [],
            "context_text": "",
            "final_answer": ""
        }

        final_state = graph.invoke(initial_state)
        return {"answer": final_state["final_answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include existing CRUD API routes
app.include_router(api_router, prefix="/api")

