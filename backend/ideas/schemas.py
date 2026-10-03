from pydantic import BaseModel, Field
from typing import Optional, List, Literal

ReactionType = Literal["like", "volunteer", "dislike"]

class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Tytuł pomysłu / posta")
    description: str = Field(..., min_length=5, description="Opis szczegółowy pomysłu")
    category: Optional[str] = Field("general", description="Kategoria, np. Ekologia, Edukacja, IT")
    looking_for_partner: Optional[bool] = Field(False, description="Czy pomysł szuka partnera (NGO, samorząd, firma)")
    partner_types: Optional[List[str]] = Field(default=[], description="Poszukiwane typy partnerów, np. NGO, Samorząd, Biznes")
    assigned_expert_id: Optional[str] = None
    assigned_expert_name: Optional[str] = None
    assigned_expert_specialization: Optional[str] = None

class IdeaResponse(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = "general"
    user_id: str
    author_name: str
    image_url: Optional[str] = None
    created_at: str
    likes_count: int = 0
    volunteers_count: int = 0
    dislikes_count: int = 0
    my_reactions: List[str] = []
    looking_for_partner: bool = False
    partner_types: List[str] = []
    assigned_expert_id: Optional[str] = None
    assigned_expert_name: Optional[str] = None
    assigned_expert_specialization: Optional[str] = None

class ReactionRequest(BaseModel):
    reaction_type: ReactionType

class ReactionResponse(BaseModel):
    idea_id: str
    reaction_type: ReactionType
    active: bool
    likes_count: int
    volunteers_count: int
    dislikes_count: int

class AssignExpertRequest(BaseModel):
    expert_id: str
    expert_name: str
    expert_specialization: Optional[str] = None

class PartnershipRequest(BaseModel):
    partner_name: str = Field(..., min_length=2)
    partner_type: str = Field("NGO", description="NGO, Samorząd, Firma, Inne")
    contact_email: str = Field(..., min_length=5)
    message: str = Field(..., min_length=5)

