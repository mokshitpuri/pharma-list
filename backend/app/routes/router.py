
from fastapi import APIRouter
from .crud import routers as _routers
from .lists import router as lists_router
from app.routes import chatbot

router = APIRouter()

# Include the custom lists router
router.include_router(lists_router)

# Include all CRUD routers
for r in _routers:
    router.include_router(r)



# Include the chatbot router
app.include_router(chatbot.router)