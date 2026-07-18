from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your AI engine routers
from Routers import analytics, claim, delivery

app = FastAPI(
    title="FlowZint AI Customer Care Engine",
    description="Unified backend orchestration for spatial analytics, autonomous claim triage, and logistics verification.",
    version="1.0.0"
)

# Configure CORS middleware so the Vite frontend can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    # Added 5174 to account for the Vite port in your screenshot
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the routers to the main application
app.include_router(analytics.router)
app.include_router(claim.router)
app.include_router(delivery.router)

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "system": "FlowZint AI Core Engine",
        "active_modules": ["Analytics", "Claims & Triage", "Delivery Logistics"]
    }