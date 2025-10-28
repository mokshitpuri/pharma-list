from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
import google.generativeai as genai
import os
from openai import OpenAI

from app.routes import router as api_router
from app.core.config import settings
from app.core.database import get_supabase_client

# ==============================
# 🔹 Configure APIs
# ==============================
genai.configure(api_key=settings.GEMINI_API_KEY)

# Configure ChatAI/OpenAI client
client = OpenAI(api_key=settings.CHATAI_API_KEY)

# ==============================
# 🔹 Define Graph State for RAG
# ==============================
class RAGState(TypedDict):
    question: str
    chat_history: List[Dict[str, str]]
    query_embedding: List[float]
    retrieved_docs: List[Dict[str, Any]]
    context_text: str
    final_answer: str
    last_retrieved_content: str  # Store last retrieved docs for follow-ups

# ==============================
# 🔹 RAG Pipeline Functions
# ==============================
def embed_query(state: RAGState):
    """Generate embedding considering conversation context."""
    try:
        question_text = state["question"]
        
        # If it's a follow-up question, combine with last question for better context
        if state.get("chat_history") and len(state["chat_history"]) > 0:
            last_exchange = state["chat_history"][-1]
            # Check if current question is short (likely a follow-up)
            if len(question_text.split()) < 5:
                combined_query = f"{last_exchange['user']} {question_text}"
                question_text = combined_query
        
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=question_text,
            task_type="retrieval_query"
        )
        state["query_embedding"] = response["embedding"]
    except Exception as e:
        print(f"❌ Error: {e}")
        state["query_embedding"] = []
    return state


def retrieve_docs(state: RAGState):
    """Retrieve documents with smart filtering."""
    try:
        query_vec = state["query_embedding"]
        if not query_vec:
            state["retrieved_docs"] = []
            return state

        supabase = get_supabase_client()
        result = supabase.rpc(
            "match_list_embeddings_simple",
            {
                "query_embedding": query_vec,
                "match_threshold": 0.35,
                "match_count": 8
            },
        ).execute()

        all_docs = result.data or []
        
        # Filter for relevance
        relevant_docs = [d for d in all_docs if d.get('similarity', 0) > 0.4]
        state["retrieved_docs"] = relevant_docs

    except Exception as e:
        print(f"❌ Error: {e}")
        state["retrieved_docs"] = []
    return state


def compose_context(state: RAGState):
    """Smart context composition with memory."""
    try:
        context_parts = []
        
        # Add recent conversation history (last 2 exchanges)
        if state.get("chat_history") and len(state["chat_history"]) > 0:
            recent_history = state["chat_history"][-2:]
            history_text = "\n".join([
                f"Previous Q: {msg['user']}\nPrevious A: {msg['assistant']}"
                for msg in recent_history
            ])
            context_parts.append(f"=== CONVERSATION HISTORY ===\n{history_text}\n")
        
        # Add newly retrieved documents OR use cached content for follow-ups
        if state["retrieved_docs"]:
            docs_text = "\n\n---\n\n".join([
                f"[Document {i+1} - Similarity: {r.get('similarity', 0):.2f}]\n{r.get('content', '')}"
                for i, r in enumerate(state["retrieved_docs"][:3])
            ])
            context_parts.append(f"=== RELEVANT INFORMATION ===\n{docs_text}\n")
            # Cache this for follow-ups
            state["last_retrieved_content"] = docs_text
        elif state.get("last_retrieved_content"):
            # Use cached content for follow-up questions
            context_parts.append(f"=== RELEVANT INFORMATION (from previous query) ===\n{state['last_retrieved_content']}\n")
        
        if context_parts:
            state["context_text"] = "\n".join(context_parts) + f"\n=== CURRENT QUESTION ===\n{state['question']}"
        else:
            state["context_text"] = f"No relevant information available.\n\nQuestion: {state['question']}"
            
    except Exception as e:
        print(f"❌ Error: {e}")
        state["context_text"] = state["question"]
    return state


def generate_answer(state: RAGState):
    """Generate intelligent, context-aware answers."""
    try:
        system_prompt = """You are a helpful pharmaceutical data assistant with excellent memory.

CRITICAL RULES:
1. ALWAYS use conversation history to understand pronouns and references:
   - "he/she/they" → refer to people mentioned before
   - "that/it/this" → refer to things just discussed
   - "why/reason" → explain the last topic discussed
   - "when/where" → provide details about last mentioned item

2. When asked about specific people (e.g., "Dr. Rohan", "Rahul"):
   - Search the documents for that exact name
   - If found, provide ALL available details (email, phone, specialty, etc.)
   - If not found, clearly say "I don't have information about [name] in the current data"

3. Answer style:
   - Be conversational and natural
   - Don't repeat information already shared unless asked
   - If the question is a follow-up, directly answer without restating previous info
   - Keep answers concise (2-4 sentences)

4. If no relevant info exists, say: "I don't have that information in the current context."
"""

        user_prompt = f"""{state['context_text']}

Answer the current question naturally, using conversation history to understand context."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=250
        )
        
        state["final_answer"] = response.choices[0].message.content
        
    except Exception as e:
        print(f"❌ Error: {e}")
        state["final_answer"] = "I encountered an error. Please try again."
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
class ChatMessage(BaseModel):
    user: str
    assistant: str

class QueryRequest(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = []

class QueryResponse(BaseModel):
    answer: str
    retrieved_count: Optional[int] = 0

# ==============================
# 🔹 API Endpoints
# ==============================
@app.get("/")
def home():
    return {"message": "✅ FastAPI + Supabase + Gemini Bot running"}

@app.post("/api/query", response_model=QueryResponse)
def ask_bot(request: QueryRequest):
    """RAG-powered chatbot endpoint with conversation memory."""
    try:
        # Convert Pydantic models to dicts for chat_history
        chat_history = [msg.dict() for msg in request.chat_history] if request.chat_history else []
        
        initial_state = {
            "question": request.question,
            "chat_history": chat_history,
            "query_embedding": [],
            "retrieved_docs": [],
            "context_text": "",
            "final_answer": "",
            "last_retrieved_content": ""
        }

        final_state = graph.invoke(initial_state)
        
        return {
            "answer": final_state["final_answer"],
            "retrieved_count": len(final_state.get("retrieved_docs", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include existing CRUD API routes
app.include_router(api_router, prefix="/api")

