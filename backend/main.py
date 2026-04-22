from fastapi import FastAPI
from routers import events
import logging

# Configuration basique du logger d'entreprise
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="NexaHR Event Management System",
    description="Backend Python hautes performances pour SaaS RH (Event-Driven)",
    version="1.0.0"
)

# Enregistrement des micro-routeurs (Modularité)
app.include_router(events.router, prefix="/api/v1", tags=["Webhooks"])

@app.get("/health", tags=["System"])
def health_check():
    """Endpoint de monitoring DevOps."""
    return {"status": "ok", "service": "NexHR-Python-Engine"}
