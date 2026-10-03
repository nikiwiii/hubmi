from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from login.router import get_current_user_payload, get_optional_user_payload
from ideas.schemas import IdeaCreate, IdeaResponse, ReactionRequest, ReactionResponse
from ideas.service import IdeaService

router = APIRouter(prefix="/api/ideas", tags=["Ideas & Reactions"])

@router.get("/", response_model=List[IdeaResponse], summary="Pobierz listę wszystkich pomysłów")
def list_ideas(user_payload: Optional[dict] = Depends(get_optional_user_payload)):
    """
    Pobiera listę pomysłów wraz z licznikami reakcji (like, volunteer, dislike).
    Jeśli użytkownik jest zalogowany, pole 'my_reactions' zawiera jego aktywne reakcje.
    """
    user_id = user_payload.get("sub") if user_payload else None
    return IdeaService.list_ideas(current_user_id=user_id)

@router.post("/", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED, summary="Dodaj nowy pomysł / post")
def create_idea(
    idea_data: IdeaCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Tworzy nowy pomysł w aplikacji. Wymaga zalogowanego użytkownika.
    """
    author_id = user_payload["sub"]
    author_name = user_payload.get("name", "Anonim")
    return IdeaService.create_idea(idea_data, author_id=author_id, author_name=author_name)

@router.delete("/{idea_id}", summary="Usuń pomysł (przez autora lub admina)")
def delete_idea(
    idea_id: str,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Usuwa post. Może to zrobić wyłącznie jego autor lub administrator.
    """
    user_id = user_payload["sub"]
    is_admin = user_payload.get("role") == "admin"
    IdeaService.delete_idea(idea_id=idea_id, user_id=user_id, is_admin=is_admin)
    return {"message": "Pomysł został pomyślnie usunięty.", "idea_id": idea_id}

@router.post("/{idea_id}/react", response_model=ReactionResponse, summary="Dodaj lub usuń reakcję (like, volunteer, dislike)")
def react_to_idea(
    idea_id: str,
    reaction_data: ReactionRequest,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Przełącza daną reakcję na poście ('like', 'volunteer', 'dislike').
    Jeśli użytkownik już kliknął tę reakcję, ponowne kliknięcie ją cofa (toggle).
    """
    user_id = user_payload["sub"]
    return IdeaService.toggle_reaction(
        idea_id=idea_id,
        user_id=user_id,
        reaction_type=reaction_data.reaction_type
    )

@router.post("/{idea_id}/like", response_model=ReactionResponse, summary="Dodaj/odznacz polubienie (like)")
def like_idea(
    idea_id: str,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Szybki endpoint do polubienia posta (like)."""
    return IdeaService.toggle_reaction(
        idea_id=idea_id,
        user_id=user_payload["sub"],
        reaction_type="like"
    )

@router.post("/{idea_id}/volunteer", response_model=ReactionResponse, summary="Zgłoś się jako wolontariusz (volunteer)")
def volunteer_for_idea(
    idea_id: str,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Szybki endpoint do zgłoszenia chęci pomocy (volunteer)."""
    return IdeaService.toggle_reaction(
        idea_id=idea_id,
        user_id=user_payload["sub"],
        reaction_type="volunteer"
    )

@router.post("/{idea_id}/dislike", response_model=ReactionResponse, summary="Dodaj/odznacz brak polubienia (dislike)")
def dislike_idea(
    idea_id: str,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Szybki endpoint do oddania głosu przeciwko (dislike)."""
    return IdeaService.toggle_reaction(
        idea_id=idea_id,
        user_id=user_payload["sub"],
        reaction_type="dislike"
    )
