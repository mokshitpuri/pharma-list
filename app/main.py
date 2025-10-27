# app/main.py

from fastapi import FastAPI
from app.routes import (
    list_request_routes,
    version_routes,
    worklog_routes,
    query_routes
)

app = FastAPI(
    title="Pharma List Tracker API",
    description="Backend for capturing and tracking pharmaceutical list lifecycles",
    version="1.0.0"
)

# Include routes
app.include_router(list_request_routes.router, prefix="/lists", tags=["List Requests"])
app.include_router(version_routes.router, prefix="/versions", tags=["List Versions"])
app.include_router(worklog_routes.router, prefix="/worklogs", tags=["Work Logs"])
app.include_router(query_routes.router, prefix="/query", tags=["Conversational Access"])

@app.get("/")
def root():
    return {"message": "Welcome to Pharma List Tracker API"}
