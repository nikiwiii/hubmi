from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from login.router import get_current_user_payload, get_optional_user_payload
from ideas.schemas import (
    IdeaCreate,
    IdeaResponse,
    ReactionRequest,
    ReactionResponse,
    AssignExpertRequest,
    PartnershipRequest,
    FeedbackCreate,
    FeedbackResponse,
    CommentCreate,
    CommentResponse,
    TestingSummaryResponse,
    TesterApplicationCreate,
    TesterApplicationResponse,
    UpdateTesterApplicationRequest,
    UpdateIdeaStatusRequest
)
from ideas.service import IdeaService

router = APIRouter(prefix="/api/ideas", tags=["Ideas & Reactions"])

@router.get("/", response_model=List[IdeaResponse], summary="Pobierz listę wszystkich pomysłów")
def list_ideas(user_payload: Optional[dict] = Depends(get_optional_user_payload)):
    """
    Pobiera listę pomysłów wraz z licznikami reakcji (like, volunteer, dislike).
    Administrator widzi wszystkie pomysły (w tym pending).
    Użytkownicy widzą aktywne pomysły oraz własne zgłoszenia.
    """
    user_id = user_payload.get("sub") if user_payload else None
    is_admin = bool(user_payload and user_payload.get("role") in ("admin", "expert"))
    return IdeaService.list_ideas(current_user_id=user_id, is_admin=is_admin)

@router.post("/", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED, summary="Dodaj nowy pomysł / post")
def create_idea(
    idea_data: IdeaCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Tworzy nowy pomysł w aplikacji. Wymaga zalogowanego użytkownika.
    """
    user_id = user_payload["sub"]
    author_name = user_payload.get("name", "Anonim")
    return IdeaService.create_idea(idea_data, user_id=user_id, author_name=author_name)

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

@router.post("/{idea_id}/assign-expert", response_model=IdeaResponse, summary="Przypisz eksperta/mentora ROPS do pomysłu")
def assign_expert_to_idea(
    idea_id: str,
    data: AssignExpertRequest,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Pozwala administratorowi lub autorowi przypisać dedykowanego mentora ROPS Kraków do pomysłu."""
    user_id = user_payload["sub"]
    is_admin = user_payload.get("role") in ("admin", "expert")
    return IdeaService.assign_expert(idea_id=idea_id, data=data, user_id=user_id, is_admin=is_admin)

@router.post("/{idea_id}/partnership-request", summary="Zgłoś chęć partnerstwa (NGO, samorząd, firma)")
def submit_partnership_request(
    idea_id: str,
    data: PartnershipRequest,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Pozwala organizacji pozarządowej, firmie lub samorządowi zgłosić chęć partnerstwa przy realizacji pomysłu."""
    sender_name = user_payload.get("name", "Zainteresowany Partner")
    return IdeaService.request_partnership(idea_id=idea_id, data=data, sender_name=sender_name)

# ==========================================
# TESTER INNOWACJI: Endpointy walidacji, ocen i dyskusji
# ==========================================

@router.get("/{idea_id}/testing", response_model=TestingSummaryResponse, summary="Pobierz podsumowanie testów, oceny użyteczności i feedback")
def get_idea_testing_summary(idea_id: str):
    """
    Zwraca kompletne statystyki testów innowacji społecznej:
    - Liczba testerów i recenzji
    - Średnia ocena ogólna, ocena użyteczności, ocena dostępności (WCAG/seniorzy) i wpływu
    - Lista ustrukturyzowanych recenzji z mocnymi stronami, barierami i proponowanymi usprawnieniami
    - Lista komentarzy w wątku dyskusyjnym
    """
    return IdeaService.get_testing_summary(idea_id=idea_id)

@router.post("/{idea_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Dodaj ocenę użyteczności i informację zwrotną (Feedback)")
def submit_idea_feedback(
    idea_id: str,
    feedback_data: FeedbackCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Pozwala zaakceptowanemu testerowi wystawić ocenę użyteczności (1-5 gwiazdek), wskazać mocne strony,
    bariery oraz zgłosić konkretne propozycje usprawnień dla twórców innowacji.
    Wymaga uprzedniej akceptacji zgłoszenia testera przez administratora.
    """
    user_id = user_payload.get("sub")
    author_name = user_payload.get("name") or user_payload.get("email", "Tester społeczny")
    user_email = user_payload.get("email")
    user_role = user_payload.get("role", "user")
    return IdeaService.add_feedback(
        idea_id=idea_id,
        data=feedback_data,
        user_id=user_id,
        author_name=author_name,
        user_email=user_email,
        user_role=user_role
    )

@router.post("/{idea_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED, summary="Dodaj komentarz w wątku dyskusji o testach innowacji")
def submit_idea_comment(
    idea_id: str,
    comment_data: CommentCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Dodaje komentarz w otwartej dyskusji nad pomysłem / prototypem.
    Wymaga uprzedniej akceptacji zgłoszenia testera przez administratora lub bycia autorem pomysłu.
    """
    user_id = user_payload.get("sub")
    author_name = user_payload.get("name") or user_payload.get("email", "Użytkownik")
    user_email = user_payload.get("email")
    user_role = user_payload.get("role", "user")
    return IdeaService.add_comment(
        idea_id=idea_id,
        data=comment_data,
        user_id=user_id,
        author_name=author_name,
        user_email=user_email,
        user_role=user_role
    )

# ==========================================
# MODERACJA POMYSŁÓW PRZEZ ADMINISTRATORA
# ==========================================

@router.patch("/{idea_id}/status", response_model=IdeaResponse, summary="Zmień status pomysłu (akceptacja / odrzucenie przez admina)")
def update_idea_status(
    idea_id: str,
    status_data: UpdateIdeaStatusRequest,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Pozwala administratorowi zaakceptować pomysł (status 'active') lub odrzucić go.
    Tylko zaakceptowane pomysły są widoczne na publicznym feedzie dla innych mieszkańców.
    Po akceptacji autor pomysłu otrzymuje powiadomienie.
    """
    if user_payload.get("role") not in ("admin", "expert"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień. Tylko administrator lub ekspert może moderować pomysły."
        )

    admin_name = user_payload.get("name", "Administrator")
    return IdeaService.update_idea_status(idea_id=idea_id, new_status=status_data.status, admin_name=admin_name)

# ==========================================
# ZGŁASZANIE SIĘ I WERYFIKACJA TESTERÓW
# ==========================================

@router.post("/{idea_id}/apply-tester", response_model=TesterApplicationResponse, status_code=status.HTTP_201_CREATED, summary="Zgłoś chęć zostania testerem innowacji")
def apply_to_become_tester(
    idea_id: str,
    app_data: TesterApplicationCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Użytkownik wysyła zapytanie o zostanie testerem prototypu.
    Zgłoszenie ma status 'pending' i wymaga zatwierdzenia przez administratora.
    """
    user_id = user_payload["sub"]
    user_name = user_payload.get("name", "Mieszkaniec")
    user_email = user_payload.get("email")
    return IdeaService.apply_as_tester(
        idea_id=idea_id,
        user_id=user_id,
        user_name=user_name,
        user_email=user_email,
        motivation=app_data.motivation
    )

@router.get("/tester-applications", response_model=List[TesterApplicationResponse], summary="Pobierz zgłoszenia testerów (dla admina lub zalogowanego użytkownika)")
def list_tester_applications(
    idea_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Pobiera listę zgłoszeń testerów.
    Administrator/ekspert widzi wszystkie zgłoszenia (może filtrować po pomyle i statusie).
    Zwykły użytkownik widzi wyłącznie swoje własne zgłoszenia.
    """
    is_admin = user_payload.get("role") in ("admin", "expert")
    user_id = None if is_admin else user_payload["sub"]
    user_email = None if is_admin else user_payload.get("email")
    return IdeaService.list_tester_applications(
        idea_id=idea_id,
        user_id=user_id,
        user_email=user_email,
        status=status_filter
    )

@router.patch("/tester-applications/{app_id}/status", response_model=TesterApplicationResponse, summary="Zaakceptuj lub odrzuć zgłoszenie testera (Admin)")
def update_tester_application_status(
    app_id: str,
    status_data: UpdateTesterApplicationRequest,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Pozwala administratorowi zaakceptować ('approved') lub odrzucić ('rejected') zgłoszenie testera.
    Gdy zgłoszenie zostanie zaakceptowane:
    - Użytkownik staje się aktywnym testerem projektu
    - Licznik testerów innowacji wzrasta
    - Zgłaszający otrzymuje powiadomienie (w systemie i e-mail) o akceptacji
    """
    if user_payload.get("role") not in ("admin", "expert"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień. Tylko administrator lub ekspert może zarządzać wnioskami testerów."
        )

    admin_name = user_payload.get("name", "Administrator")
    return IdeaService.update_tester_application_status(
        app_id=app_id,
        new_status=status_data.status,
        admin_name=admin_name
    )


@router.get("/{idea_id}", response_model=IdeaResponse, summary="Pobierz pojedynczy pomysł po ID")
def get_idea(
    idea_id: str,
    user_payload: Optional[dict] = Depends(get_optional_user_payload)
):
    """Pobiera pojedynczy pomysł wraz ze statystykami i reakcjami użytkownika."""
    user_id = user_payload.get("sub") if user_payload else None
    return IdeaService.get_idea(idea_id=idea_id, current_user_id=user_id)

