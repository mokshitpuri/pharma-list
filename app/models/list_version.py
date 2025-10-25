# app/models/list_version.py

from pydantic import BaseModel
from datetime import datetime

class ListVersion(BaseModel):
    id: str
    list_id: str
    version_number: int
    changes_summary: str
    rationale: str
    updated_by: str
    updated_at: datetime = datetime.utcnow()
