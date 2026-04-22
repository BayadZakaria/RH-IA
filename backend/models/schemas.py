from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Dict, Any, Literal
from datetime import datetime
import uuid

# ---------------------------------------------------------
# ARCHITECTURE NOTE :
# L'utilisation de Pydantic v2 permet une validation stricte (Rust-based)
# garantissant que les payloads (souvent bruités via Webhooks Supabase)
# sont purs avant de toucher notre logique métier.
# ---------------------------------------------------------

class Compensation(BaseModel):
    """
    Détails du package salarial, requis pour le PDF d'approbation.
    """
    base_salary: float = Field(..., description="Salaire de base en MAD")
    housing_allowance: float = Field(0.0, description="Prime de logement")
    transport_allowance: float = Field(0.0, description="Indemnité de transport")
    gross_salary: float = Field(..., description="Salaire brut total calculé")
    net_salary: float = Field(..., description="Salaire net approximatif")

class Candidate(BaseModel):
    """
    Modèle métier d'un candidat.
    """
    model_config = ConfigDict(populate_by_name=True, strict=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    email: EmailStr
    role_applied: str = Field(..., description="Intitulé du poste (ex: E12.10 - Responsable Support)")
    compensation: Compensation

class Evaluation(BaseModel):
    """
    Score brut et retour de l'évaluateur RH ou Technique.
    """
    evaluator_id: str
    candidate_id: str
    technical_score: float = Field(..., ge=0, le=100)
    culture_fit_score: float = Field(..., ge=0, le=100)
    comments: str = Field(..., max_length=2000)

class EventPayload(BaseModel):
    """
    Modèle du Webhook / Event Bus.
    Agit comme contrat de données strict pour l'API Gateway.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: Literal["evaluation_submitted", "approval_requested"] = Field(
        ..., description="Routing key de l'événement"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(..., description="Payload dynamique (Candidat, Eval, etc., en dict)")
