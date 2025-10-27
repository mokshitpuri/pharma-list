
from fastapi import APIRouter
from .crud import routers as _routers
from .lists import router as lists_router

router = APIRouter()

# Include the custom lists router
router.include_router(lists_router)

# Include all CRUD routers
for r in _routers:
    router.include_router(r)
