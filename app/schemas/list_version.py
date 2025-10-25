# app/schemas/list_version.py

from pydantic import BaseModel
from datetime import datetime

class ListVersionCreate(BaseModel):
    list_id: str
    version_number: int
    changes_summary: str
    rationale: str
    updated_by: str

class ListVersionResponse(ListVersionCreate):
    id: str
    updated_at: datetime
