from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from notifications.schemas import NotificationResponse, SimulatedEmailResponse
from notifications.service import NotificationService
from login.router import get_current_user_payload

router = APIRouter(prefix="/api/notifications", tags=["Powiadomienia i Symulacja E-mail"])

@router.get("", response_model=List[NotificationResponse], summary="Lista powiadomień użytkownika lub administratora")
def get_notifications(
    role: str = Query("creator", description="Rola: admin, expert, creator, tester")
):
    """Zwraca powiadomienia w aplikacji (o nowych pomysłach, odpowiedziach, naborach i partnerstwach)."""
    return NotificationService.get_notifications_for_user(user_id=None, role=role)

@router.post("/{notification_id}/read", summary="Oznacz powiadomienie jako przeczytane")
def mark_notification_as_read(notification_id: str):
    success = NotificationService.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Nie znaleziono powiadomienia.")
    return {"status": "ok", "id": notification_id}

@router.post("/read-all", summary="Oznacz wszystkie powiadomienia jako przeczytane")
def mark_all_notifications_read():
    NotificationService.mark_all_as_read()
    return {"status": "ok"}

@router.get("/{notification_id}/email", response_model=SimulatedEmailResponse, summary="Szczegóły symulowanego e-maila (dla ewaluacji jury)")
def get_simulated_email_details(notification_id: str):
    """Pozwala jury podejrzeć dokładnie, jak wygląda wiadomość e-mail wysłana do administratora lub autora."""
    email_data = NotificationService.get_simulated_email(notification_id)
    if not email_data:
        raise HTTPException(status_code=404, detail="Nie znaleziono powiadomienia e-mail.")
    return email_data

