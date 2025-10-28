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
    """Retrieve similar docs from Supabase using vector similarity."""
    try:
        query_vec = state["query_embedding"]
        if not query_vec:
            state["retrieved_docs"] = []
            return state

        # Convert embedding to string for RPC
        query_vec_str = "[" + ",".join([str(x) for x in query_vec]) + "]"
        supabase = get_supabase_client()
        result = supabase.rpc("match_list_embeddings", {"query_embedding": query_vec_str}).execute()

        state["retrieved_docs"] = result.data or []
    except Exception as e:
        print(f"❌ Error in retrieve_docs: {e}")
        state["retrieved_docs"] = []
    return state


def compose_context(state: RAGState):
    """Combine retrieved docs into a single context."""
    docs = [r.get("content", "") for r in state["retrieved_docs"]]
    # Clean up the raw database format from the context
    context = "\n\n".join(docs)
    # Remove excessive asterisks and clean up field markers
    context = context.replace("**", "")
    state["context_text"] = f"Relevant Data:\n{context}\n\nUser Question: {state['question']}"
    return state


def generate_answer(state: RAGState):
    """Generate a final answer using Gemini."""
    try:
        prompt = f"""
You are a professional pharmaceutical data assistant helping users understand their list data.

CRITICAL FORMATTING RULES:
1. NEVER include raw database syntax like "**field_name:**" in your response
2. Present information in clean, professional format using proper markdown
3. Use tables, bullet points, or numbered lists for clarity
4. Remove all asterisks (**) from field names - just show the actual values
5. Organize information logically with clear headers
6. If there are multiple entries, present them in a structured way (numbered list or table)
7. Keep language professional and concise

When presenting list entries:
- Use clear headers like "### Entry 1", "### Entry 2", etc.
- Show only relevant information (names, IDs, descriptions, dates)
- Format dates in readable format (e.g., "October 27, 2025")
- Group related information together

{state['context_text']}

Provide a clean, professional response that looks good in a chat interface. Use markdown formatting for better readability.
"""
        model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            generation_config={
                'temperature': 0.3,
                'top_p': 0.8,
                'top_k': 40,
            }
        )
        response = model.generate_content(prompt)
        state["final_answer"] = response.text
    except Exception as e:
        state["final_answer"] = "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question."
        print(f"❌ Error in generate_answer: {e}")
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
