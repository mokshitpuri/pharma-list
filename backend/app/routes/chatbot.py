from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.chatbot.graph import create_chatbot_graph

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    query: str
    domain: str = None
    subdomain: str = None
    request_id: int = None

class ChatResponse(BaseModel):
    response: str
    metadata: dict = None

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Process a chat query through the LangGraph workflow"""
    
    try:
        # Create the graph
        graph = create_chatbot_graph(db)
        
        # Run the workflow
        result = graph.invoke({
            "user_query": request.query,
            "domain": request.domain,
            "subdomain": request.subdomain,
            "request_id": request.request_id,
            "response": "",
        })
        
        return ChatResponse(
            response=result["response"],
            metadata=result.get("insights")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))