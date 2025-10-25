# app/schemas/work_log.py

from pydantic import BaseModel
from datetime import datetime

class WorkLogCreate(BaseModel):
    list_id: str
    user_name: str
    task_done: str
    timestamp: datetime = datetime.utcnow()
