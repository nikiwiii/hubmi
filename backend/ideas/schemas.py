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
    status: Optional[str] = Field("pending", description="Status pomysłu: pending, active, testing, rejected")

class IdeaResponse(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = "general"
    user_id: str
    author_name: str
    image_url: Optional[str] = None
    created_at: str
    status: str = "pending"
    likes_count: int = 0
    volunteers_count: int = 0
    dislikes_count: int = 0
    my_reactions: List[str] = []
    looking_for_partner: bool = False
    partner_types: List[str] = []
    assigned_expert_id: Optional[str] = None
    assigned_expert_name: Optional[str] = None
    assigned_expert_specialization: Optional[str] = None

class UpdateIdeaStatusRequest(BaseModel):
    status: Literal["active", "testing", "pending", "rejected", "archived"]

class TesterApplicationCreate(BaseModel):
    motivation: Optional[str] = Field(None, description="Opcjonalne uzasadnienie / dlaczego chcę testować")

class TesterApplicationResponse(BaseModel):
    id: str
    idea_id: str
    idea_title: str
    user_id: Optional[str] = None
    user_name: str
    user_email: Optional[str] = None
    status: Literal["pending", "approved", "rejected"]
    motivation: Optional[str] = None
    created_at: str

class UpdateTesterApplicationRequest(BaseModel):
    status: Literal["approved", "rejected", "pending"]

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

# ==========================================
# TESTER INNOWACJI: Oceny użyteczności, feedback i komentarze
# ==========================================

class FeedbackCreate(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5, description="Ogólna ocena od 1 do 5")
    usability_rating: int = Field(..., ge=1, le=5, description="Ocena użyteczności / łatwości obsługi od 1 do 5")
    accessibility_rating: int = Field(..., ge=1, le=5, description="Dostępność dla seniorów i WCAG od 1 do 5")
    impact_rating: int = Field(..., ge=1, le=5, description="Potencjał wpływu społecznego od 1 do 5")
    author_role: Optional[str] = Field("Tester społeczny", description="Rola testera, np. Senior, Opiekun, Ekspert, Mieszkaniec")
    strengths: Optional[str] = Field(None, description="Mocne strony / co działa dobrze")
    weaknesses: Optional[str] = Field(None, description="Bariery / co sprawia trudność w testach")
    suggested_improvements: Optional[str] = Field(None, description="Proponowane usprawnienia / modyfikacje")
    comment: Optional[str] = Field(None, description="Komentarz ogólny / podsumowanie")

class FeedbackResponse(BaseModel):
    id: str
    idea_id: str
    user_id: Optional[str] = None
    author_name: str
    author_role: str
    overall_rating: int
    usability_rating: int
    accessibility_rating: int
    impact_rating: int
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggested_improvements: Optional[str] = None
    comment: Optional[str] = None
    created_at: str

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=1000, description="Treść komentarza")

class CommentResponse(BaseModel):
    id: str
    idea_id: str
    user_id: Optional[str] = None
    author_name: str
    content: str
    created_at: str

class TestingSummaryResponse(BaseModel):
    idea_id: str
    testers_count: int
    reviews_count: int
    avg_overall_rating: float
    avg_usability_rating: float
    avg_accessibility_rating: float
    avg_impact_rating: float
    feedback_list: List[FeedbackResponse]
    comments_list: List[CommentResponse]

