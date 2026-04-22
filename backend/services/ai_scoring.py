import os
import json
import logging
import asyncio
from typing import Dict, Any, Literal

import google.generativeai as genai
from pydantic import BaseModel, Field

logger = logging.getLogger("NexaHR.AIService")

# ---------------------------------------------------------
# CONFIGURATION GEMINI API
# ---------------------------------------------------------
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    logger.warning("⚠️ GEMINI_API_KEY introuvable dans l'environnement ! L'IA ne pourra pas s'exécuter.")

# ---------------------------------------------------------
# SCHÉMAS DE SORTIE STRUCTURÉE (STRUCTURED OUTPUTS)
# Pydantic est supporté nativement par le SDK Gemini pour
# forcer le LLM à répondre exclusivement avec ce format JSON.
# ---------------------------------------------------------
class AIResponseSchema(BaseModel):
    global_score: float = Field(
        description="Score global pondéré sur 100 basé sur les compétences techniques et le fit culturel."
    )
    justification: str = Field(
        description="Justification détaillée et implacable de la recommandation, rédigée par le DRH."
    )
    recommendation: Literal['Approved', 'Rejected', 'Review'] = Field(
        description="Décision finale stricte et binaire (ou mise en attente)."
    )

# ---------------------------------------------------------
# SERVICE IA 
# ---------------------------------------------------------
class AIScoringService:
    """
    Intégration robuste de Google Gemini-2.5-Flash via le SDK google-generativeai.
    """

    @staticmethod
    async def evaluate_candidate_async(candidate_data: Dict[str, Any], evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        if not API_KEY:
            logger.error("Tentative d'utilisation de Gemini sans API_KEY.")
            return {"error": "API Key manquante", "recommendation": "Review"}

        try:
            # Paramétrage du modèle avec System Instruction (Rôle du DRH)
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=(
                    "Tu es le Directeur des Ressources Humaines (DRH) tech de NexaHR. "
                    "Ta mission est d'évaluer de manière très stricte les candidats. "
                    "Analyse les notes techniques, le fit culturel et les commentaires des interviewers. "
                    "Tu dois rendre une décision finale objective, non biaisée, et justifiée. "
                    "Ne retourne QUE les clés JSON demandées par le schéma."
                )
            )

            # Construction du Prompt avec les données du webhook
            candidate_name = f"{candidate_data.get('first_name', '')} {candidate_data.get('last_name', '')}"
            prompt_content = f"""
            Veuillez analyser le profil du candidat :
            - Nom : {candidate_name}
            - Poste postulé : {candidate_data.get('role_applied', 'Non défini')}
            
            Retours d'évaluations :
            - Score Technique /100 : {evaluation_data.get('technical_score', 0)}
            - Score Culture Fit /100 : {evaluation_data.get('culture_fit_score', 0)}
            - Commentaires de l'équipe : "{evaluation_data.get('comments', 'Aucun commentaire fourni.')}"
            """

            logger.info(f"Envoi du candidat {candidate_name} au modèle Gemini pour scoring (Structured Output)...")

            # Appel Asynchrone natif au SDK (Ne bloque pas l'Event Loop FastAPI)
            response = await model.generate_content_async(
                contents=prompt_content,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=AIResponseSchema, # Forçage de la structure de la réponse !
                    temperature=0.2 # Température basse pour une analyse rationnelle et déterministe
                )
            )

            # Le SDK Gemini nous garantit que le texte retourné respecte le modèle Pydantic
            ai_result_json = json.loads(response.text)
            
            logger.info(
                f"[AI Scoring Terminé] "
                f"Candidat: {candidate_name} | "
                f"Décision: {ai_result_json.get('recommendation')} | "
                f"Score: {ai_result_json.get('global_score')}/100"
            )
            
            return ai_result_json

        # Gestion granulaire des exceptions liées à l'IA ou au réseau
        except Exception as e:
            logger.error(f"[AI Integration Error] L'appel à Gemini a échoué: {str(e)}")
            
            # Mécanisme de Fallback sécurisé pour l'application SaaS (ne crashe pas le workflow)
            return {
                "global_score": 0.0,
                "justification": f"Échec de l'analyse automatisée: {str(e)}. Analyse humaine (manuel) requise.",
                "recommendation": "Review"
            }
