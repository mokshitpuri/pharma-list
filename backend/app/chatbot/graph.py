from langgraph.graph import StateGraph, END
from app.chatbot.state import ChatbotState
from app.chatbot.nodes import ChatbotNodes
from app.chatbot.tools import DatabaseTools
from langchain_openai import ChatOpenAI
from sqlalchemy.orm import Session

def create_chatbot_graph(db: Session):
    """Create the LangGraph workflow"""
    
    # Initialize tools and LLM
    db_tools = DatabaseTools(db)
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    nodes = ChatbotNodes(db_tools, llm)
    
    # Create the graph
    workflow = StateGraph(ChatbotState)
    
    # Add nodes
    workflow.add_node("classify_query", nodes.classify_query)
    workflow.add_node("fetch_versions", nodes.fetch_versions)
    workflow.add_node("analyze_changes", nodes.analyze_changes)
    workflow.add_node("generate_response", nodes.generate_response)
    
    # Define the flow
    workflow.set_entry_point("classify_query")
    
    # Conditional routing based on query type
    def route_query(state: ChatbotState) -> str:
        query_type = state.get("query_type", "current_state")
        
        if query_type == "version_comparison":
            return "fetch_versions"
        elif query_type == "history":
            return "fetch_versions"
        elif query_type == "current_state":
            return "fetch_versions"
        else:
            return "fetch_versions"
    
    workflow.add_conditional_edges(
        "classify_query",
        route_query,
        {
            "fetch_versions": "fetch_versions",
        }
    )
    
    workflow.add_edge("fetch_versions", "analyze_changes")
    workflow.add_edge("analyze_changes", "generate_response")
    workflow.add_edge("generate_response", END)
    
    return workflow.compile()