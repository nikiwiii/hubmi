from pydantic import BaseModel, Field
from typing import Optional, List, Literal

ReactionType = Literal["like", "volunteer", "dislike"]

class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Tytuł pomysłu / posta")
    description: str = Field(..., min_length=5, description="Opis szczegółowy pomysłu")
    category: Optional[str] = Field("general", description="Kategoria, np. Ekologia, Edukacja, IT")

class IdeaResponse(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = "general"
    user_id: str
    author_name: str
    created_at: str
    likes_count: int = 0
    volunteers_count: int = 0
    dislikes_count: int = 0
    my_reactions: List[str] = []

class ReactionRequest(BaseModel):
    reaction_type: ReactionType

class ReactionResponse(BaseModel):
    idea_id: str
    reaction_type: ReactionType
    active: bool
    likes_count: int
    volunteers_count: int
    dislikes_count: int
