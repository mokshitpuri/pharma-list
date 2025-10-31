from typing import TypedDict, List, Optional, Dict, Any

class ChatbotState(TypedDict):
    """State that flows through the LangGraph"""
    
    # Input
    user_query: str
    domain: Optional[str]
    subdomain: Optional[str]
    
    # Query classification
    query_type: Optional[str]  # "version_comparison", "history", "attribution", "current_state"
    
    # Data fetched from DB
    versions: Optional[List[Dict[str, Any]]]
    entries: Optional[List[Dict[str, Any]]]
    work_logs: Optional[List[Dict[str, Any]]]
    
    # Analysis
    changes: Optional[Dict[str, Any]]
    insights: Optional[str]
    
    # Output
    response: str
    metadata: Optional[Dict[str, Any]]