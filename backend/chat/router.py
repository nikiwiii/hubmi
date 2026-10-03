from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from login.router import get_current_user_payload
from chat.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    PollMessagesResponse,
    ConversationStatusUpdate
)
from chat.service import ChatService

router = APIRouter(prefix="/api/chat", tags=["Expert Chat & Communication (ROPS Kraków)"])

@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Otwórz czat z ekspertem ROPS Kraków (Przycisk: 'Napisz do eksperta')"
)
def start_conversation(
    data: ConversationCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Otwiera nową sesję dialogu między użytkownikiem a ekspertami ROPS Kraków.
    Może być powiązana z konkretnym postem/pomysłem (przycisk 'Napisz do eksperta')
    lub stanowić ogólne zapytanie o mentoring / dofinansowanie.
    """
    user_id = user_payload["sub"]
    user_name = user_payload.get("name", "Użytkownik")
    user_email = user_payload.get("email")
    return ChatService.start_conversation(
        user_id=user_id,
        user_name=user_name,
        user_email=user_email,
        data=data
    )

@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    summary="Lista konwersacji (Dla admina: panel wszystkich zgłoszeń; dla usera: jego czaty)"
)
def list_conversations(
    status_filter: Optional[str] = Query(None, alias="status", description="Filtruj po statusie: open, in_progress, closed"),
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Zwraca listę wątków czatu:
    - Dla administratora/eksperta: wszystkie wątki od mieszkańców do obsługi na dashboardzie.
    - Dla użytkownika: wyłącznie jego aktywne wątki.
    """
    user_id = user_payload["sub"]
    is_admin = user_payload.get("role") in ("admin", "expert")
    return ChatService.list_conversations(
        current_user_id=user_id,
        is_admin=is_admin,
        status=status_filter
    )

@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Pobierz szczegóły wybranej konwersacji"
)
def get_conversation_details(
    conversation_id: str,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Pobiera metadane wybranej rozmowy (status, przypisany ekspert, nieprzeczytane wiadomości)."""
    user_id = user_payload["sub"]
    is_admin = user_payload.get("role") in ("admin", "expert")
    return ChatService.get_conversation(
        conv_id=conversation_id,
        current_user_id=user_id,
        is_admin=is_admin
    )

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Wyślij wiadomość do czatu (użytkownik lub ekspert)"
)
def send_message(
    conversation_id: str,
    data: MessageCreate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Wysyła nową wiadomość w ramach danej rozmowy.
    Jeśli odpisuje administrator, automatycznie przypisuje go jako opiekuna wątku.
    """
    user_id = user_payload["sub"]
    user_name = user_payload.get("name", "Uczestnik")
    role = user_payload.get("role", "user")
    return ChatService.send_message(
        conv_id=conversation_id,
        sender_id=user_id,
        sender_name=user_name,
        sender_role=role,
        content=data.content
    )

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=PollMessagesResponse,
    summary="POLLING co 3 sekundy: Pobierz wiadomości z wątku"
)
def poll_messages(
    conversation_id: str,
    since: Optional[str] = Query(None, description="Pobierz tylko wiadomości nowsze niż dany timestamp ISO"),
    after_id: Optional[str] = Query(None, description="Pobierz tylko wiadomości po wskazanym ID wiadomości"),
    user_payload: dict = Depends(get_current_user_payload)
):
    """
    Główny endpoint dla mechanizmu POLLING co 3 sekundy:
    - Frontend odpytuje ten endpoint co 3 sekundy przekazując opcjonalnie `since` lub `after_id`.
    - Zwraca listę nowych wiadomości oraz aktualny czas serwera (`last_polled_at`).
    - Automatycznie zeruje licznik nieprzeczytanych wiadomości dla czytelnika.
    """
    user_id = user_payload["sub"]
    role = user_payload.get("role", "user")
    return ChatService.poll_messages(
        conv_id=conversation_id,
        reader_id=user_id,
        reader_role=role,
        since=since,
        after_id=after_id
    )

@router.patch(
    "/conversations/{conversation_id}/status",
    response_model=ConversationResponse,
    summary="Zmień status wątku (np. zamknij lub wznów)"
)
def update_conversation_status(
    conversation_id: str,
    data: ConversationStatusUpdate,
    user_payload: dict = Depends(get_current_user_payload)
):
    """Pozwala zaktualizować status rozmowy ('open', 'in_progress', 'closed')."""
    user_id = user_payload["sub"]
    is_admin = user_payload.get("role") in ("admin", "expert")
    return ChatService.update_status(
        conv_id=conversation_id,
        new_status=data.status,
        current_user_id=user_id,
        is_admin=is_admin
    )
