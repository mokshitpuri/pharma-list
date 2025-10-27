from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Dict, Any
import google.generativeai as genai

from supabase import create_client
import os
from dotenv import load_dotenv

# 🧩 Load environment variables
load_dotenv()

# --- INITIALIZATION ---
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Configure Gemini with API key (standard approach that works across all SDK versions)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- STATE ---
class RAGState(TypedDict):
    question: str
    query_embedding: List[float]
    retrieved_docs: List[Dict[str, Any]]
    context_text: str
    final_answer: str

# --- 1️⃣ EMBED QUERY ---
def embed_query(state: RAGState):
    """Generate embedding for the user's question using Gemini."""
    try:
        question_text = state["question"]
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=question_text,
            task_type="retrieval_query"
        )
        state["query_embedding"] = response['embedding']
    except Exception as e:
        print(f"❌ Error in embed_query: {e}")
        state["query_embedding"] = []
    return state

# --- 2️⃣ RETRIEVE FROM SUPABASE ---
def retrieve_docs(state: RAGState):
    """Retrieve similar documents using Supabase vector search."""
    try:
        query_vec = state["query_embedding"]
        if not query_vec:
            print("⚠️ No embeddings generated.")
            state["retrieved_docs"] = []
            return state

        # Convert to SQL-friendly array string
        query_vec_str = "[" + ",".join(map(str, query_vec)) + "]"

        # Call RPC function in Supabase
        result = supabase.rpc(
            "match_list_embeddings",
            {
                "query_embedding": query_vec_str,
                "match_threshold": 0.7,
                "match_count":20
                # Optional: filter by entity_type (e.g., "employee")
                # "filter_entity_type": "employee"
            },
        ).execute()

        state["retrieved_docs"] = result.data or []
    except Exception as e:
        print(f"❌ Error in retrieve_docs: {e}")
        state["retrieved_docs"] = []
    return state

# --- 3️⃣ COMPOSE CONTEXT ---
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

# --- 4️⃣ GENERATE ANSWER ---
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

# --- 5️⃣ BUILD GRAPH ---
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

# --- 6️⃣ MAIN CHAT LOOP ---
if __name__ == "__main__":
    graph = build_rag_graph()

    print("=" * 70)
    print("🤖 Supabase + Gemini RAG Assistant")
    print("=" * 70)
    print("Type a question to begin. Type 'exit' or 'quit' to stop.\n")

    while True:
        user_question = input("🧠 You: ").strip()
        if user_question.lower() in ["exit", "quit", "bye"]:
            print("\n👋 Goodbye!")
            break

        if not user_question:
            continue

        initial_state = {
            "question": user_question,
            "query_embedding": [],
            "retrieved_docs": [],
            "context_text": "",
            "final_answer": "",
        }

        print("\n🔍 Searching...\n")
        final_state = graph.invoke(initial_state)

        print(f"🤖 Assistant: {final_state.get('final_answer', 'No answer generated')}\n")