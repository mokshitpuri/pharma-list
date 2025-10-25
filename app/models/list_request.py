# app/models/list_request.py

from pydantic import BaseModel
from datetime import datetime

class ListRequest(BaseModel):
    id: str
    requester_name: str
    requester_role: str
    purpose: str
    category: str
    created_at: datetime = datetime.utcnow()
