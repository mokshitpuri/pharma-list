from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Query(BaseModel):
    question: str

@router.post("/")
def query_list(query: Query):
    # Placeholder: integrate LangChain or RAG here
    return {"answer": f"Mock answer for: {query.question}"}
