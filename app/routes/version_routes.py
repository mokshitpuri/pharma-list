# app/routes/version_routes.py

from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.list_version import ListVersionCreate, ListVersionResponse
from app.core.database import supabase

router = APIRouter()

@router.post("/", response_model=ListVersionResponse)
def add_list_version(version: ListVersionCreate):
    """
    Add a new version for a list.
    """
    try:
        result = supabase.table("list_versions").insert(version.dict()).execute()
        if result.data:
            data = result.data[0]
            return {
                "id": data["id"],
                "list_id": data["list_id"],
                "version_number": data["version_number"],
                "changes_summary": data["changes_summary"],
                "rationale": data["rationale"],
                "updated_by": data["updated_by"],
                "updated_at": data["updated_at"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to add version")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{list_id}", response_model=List[ListVersionResponse])
def get_versions_by_list(list_id: str):
    """
    Get all versions for a specific list.
    """
    try:
        result = supabase.table("list_versions").select("*").eq("list_id", list_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
