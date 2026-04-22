import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger("NexaHR.DocGenerator")

class DocumentGenerationService:
    """
    Service responsable de la création du document "Demande d'Approbation RH".
    (Job Module Simulé)
    """

    @staticmethod
    async def generate_hr_approval_pdf(candidate_data: Dict[str, Any]) -> str:
        """
        Simule la génération PDF lourde. Dans un vrai contexte, ceci tournerait 
        sur un Celery Worker séparé car le CPU bound ferait ralentir FastAPI.
        """
        last_name = candidate_data.get("last_name", "UNKNOWN")
        first_name = candidate_data.get("first_name", "")
        role = candidate_data.get("role_applied", "")
        
        logger.info(f"[JOB STARTED] Génération PDF pour {first_name} {last_name} ({role})...")
        
        # Extraction de la data (Simulant le filling d'un template jinja2 -> pdfkit)
        comp = candidate_data.get("compensation", {})
        net_salary = comp.get("net_salary", 0)
        
        # Simule l'effort CPU / conversion wkhtmltopdf
        await asyncio.sleep(3)
        
        # Stockage Cloud simulé
        file_name = f"approbation_{last_name.lower()}_{candidate_data.get('id')[:6]}.pdf"
        s3_url = f"s3://nexahr-assets-prod/approvals/{file_name}"
        
        logger.info(f"[JOB SUCCESS] Document injecté avec data (Salaire Net: {net_salary}). Uploadé -> {s3_url}")
        
        return s3_url
