from pydantic import BaseModel
from datetime import datetime

class WorkLog(BaseModel):
    id: str
    list_id: str
    user_name: str
    task_done: str
    timestamp: datetime = datetime.utcnow()
