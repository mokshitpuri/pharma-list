# app/routes/list_request_routes.py

from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.list_request import ListRequestCreate, ListRequestResponse
from app.core.database import supabase

router = APIRouter()

@router.post("/", response_model=ListRequestResponse)
def create_list(request: ListRequestCreate):
    """
    Create a new list request.
    """
    try:
        result = supabase.table("list_requests").insert(request.dict()).execute()
        if result.data:
            data = result.data[0]
            return {
                "id": data["id"],
                "requester_name": data["requester_name"],
                "requester_role": data["requester_role"],
                "purpose": data["purpose"],
                "category": data["category"],
                "created_at": data["created_at"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create list")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[ListRequestResponse])
def get_all_lists():
    """
    Get all list requests.
    """
    try:
        result = supabase.table("list_requests").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{list_id}", response_model=ListRequestResponse)
def get_list_by_id(list_id: str):
    """
    Get a specific list request by ID.
    """
    try:
        result = supabase.table("list_requests").select("*").eq("id", list_id).execute()
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="List not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
