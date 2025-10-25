from fastapi import APIRouter, HTTPException
from app.schemas.work_log import WorkLogCreate
from app.core.database import supabase

router = APIRouter()

@router.post("/")
def add_work_log(worklog: WorkLogCreate):
    try:
        result = supabase.table("work_logs").insert({
            "list_id": worklog.list_id,
            "user_name": worklog.user_name,
            "task_done": worklog.task_done
        }).execute()

        if result.data:
            return {"message": "Work log added successfully", "data": result.data}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert work log")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{list_id}")
def get_work_logs(list_id: str):
    try:
        result = supabase.table("work_logs").select("*").eq("list_id", list_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
