from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from models.schemas import EventPayload
from services.ai_scoring import AIScoringService
from services.doc_generation import DocumentGenerationService
import logging

router = APIRouter()
logger = logging.getLogger("NexaHR.API")

# ---------------------------------------------------------
# ARCHITECTURE NOTE : EVENT-DRIVEN & BACKGROUND TASKS
# Nous acceptons le Webhook rapidement (Status 202 Accepted) 
# et nous déléguons la charge lourde (PDF/IA) aux BackgroundTasks.
# Dans une infra massive, BackgroundTasks serait remplacé par 
# `celery.send_task(...)` ou un publish Kafka/RabbitMQ.
# ---------------------------------------------------------

@router.post("/events", status_code=202)
async def handle_webhook_event(payload: EventPayload, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Received Event: {payload.event_type} (ID: {payload.event_id})")
        
        if payload.event_type == "evaluation_submitted":
            # Extraire les données
            candidate_data = payload.data.get("candidate", {})
            evaluation_data = payload.data.get("evaluation", {})
            
            # Délégation asynchrone pour l'IA
            background_tasks.add_task(process_ai_workflow, candidate_data, evaluation_data)
            return {"status": "accepted", "message": "AI scoring queued"}

        elif payload.event_type == "approval_requested":
            # Extraire les données
            candidate_data = payload.data.get("candidate", {})
            
            # Délégation asynchrone pour le PDF
            background_tasks.add_task(process_document_workflow, candidate_data)
            return {"status": "accepted", "message": "Document generation queued"}
            
    except Exception as e:
        logger.error(f"Erreur de traitement sur l'event {payload.event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne de traitement de l'événement")

# --- Background Handlers (Subscribers) ---

async def process_ai_workflow(candidate_data: dict, evaluation_data: dict):
    """
    Orchestre le workflow IA une fois l'évaluation reçue.
    """
    try:
        result = await AIScoringService.evaluate_candidate_async(candidate_data, evaluation_data)
        # Ici on pusherait l'event 'ai_scoring_completed' vers un Event Bus (ex: Supabase / webhooks sortants)
        logger.info(f"[Workflow Complet] AI Score calculé : {result['ai_score']}")
    except Exception as e:
        logger.error(f"Échec de la tâche IA: {str(e)}")

async def process_document_workflow(candidate_data: dict):
    """
    Orchestre la génération PDF après une demande d'approbation.
    """
    try:
        s3_url = await DocumentGenerationService.generate_hr_approval_pdf(candidate_data)
        # Publier le résultat : 'document_generated' pour trigger le frontend via WebSocket
        logger.info(f"[Workflow Complet] PDF disponible sur {s3_url}")
    except Exception as e:
        logger.error(f"Échec de la génération document: {str(e)}")
