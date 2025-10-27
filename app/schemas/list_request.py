from pydantic import BaseModel
from datetime import datetime

class ListRequestCreate(BaseModel):
    requester_name: str
    requester_role: str
    purpose: str
    category: str

class ListRequestResponse(ListRequestCreate):
    id: str
    created_at: datetime
