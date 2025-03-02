import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db  # Import db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

    
@app.get("/")
async def root():
    return {"message": "Secure Cloud Access System API is running!"}


# ✅ Corrected Health Check Route
@app.get("/health")
async def health_check():
    try:
        if db.db is None:
            raise Exception("Database not initialized")
        await db.db.command("ping")  # Check MongoDB connection
        return {"status": "Connected to MongoDB"}
    except Exception as e:
        return {"status": "Not connected", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
