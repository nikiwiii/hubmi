from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from supabase_client import DatabaseRepository
from chat.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    PollMessagesResponse,
    ConversationStatusUpdate
)

class ChatService:
    @staticmethod
    def _to_conversation_response(conv: Dict[str, Any]) -> ConversationResponse:
        return ConversationResponse(
            id=str(conv["id"]),
            user_id=str(conv["user_id"]),
            user_name=conv.get("user_name", "Użytkownik"),
            user_email=conv.get("user_email"),
            idea_id=str(conv["idea_id"]) if conv.get("idea_id") else None,
            idea_title=conv.get("idea_title"),
            topic=conv.get("topic", "Zapytanie do eksperta ROPS Kraków"),
            status=conv.get("status", "open"),
            assigned_admin_id=str(conv["assigned_admin_id"]) if conv.get("assigned_admin_id") else None,
            assigned_admin_name=conv.get("assigned_admin_name"),
            unread_by_admin=conv.get("unread_by_admin", 0),
            unread_by_user=conv.get("unread_by_user", 0),
            last_message=conv.get("last_message"),
            last_message_at=str(conv.get("last_message_at", conv.get("created_at"))),
            created_at=str(conv.get("created_at"))
        )

    @staticmethod
    def _to_message_response(msg: Dict[str, Any]) -> MessageResponse:
        return MessageResponse(
            id=str(msg["id"]),
            conversation_id=str(msg["conversation_id"]),
            sender_id=str(msg["sender_id"]),
            sender_name=msg.get("sender_name", "Uczestnik"),
            sender_role=msg.get("sender_role", "user"),
            content=msg["content"],
            created_at=str(msg["created_at"])
        )

    @classmethod
    def start_conversation(
        cls,
        user_id: str,
        user_name: str,
        user_email: Optional[str],
        data: ConversationCreate
    ) -> ConversationResponse:
        """
        Otwiera czat z ekspertem ROPS Kraków (np. po kliknięciu 'Napisz do eksperta' pod postem).
        Jeśli istnieje już aktywna rozmowa dla tego użytkownika i danego pomysłu, zwraca istniejącą.
        """
        # Sprawdź czy dla tego pomysłu już jest aktywna rozmowa tego usera
        if data.idea_id:
            existing = [
                c for c in DatabaseRepository.get_conversations(user_id=user_id)
                if str(c.get("idea_id")) == str(data.idea_id) and c.get("status") != "closed"
            ]
            if existing:
                conv = existing[0]
                if data.initial_message:
                    cls.send_message(
                        conv_id=str(conv["id"]),
                        sender_id=user_id,
                        sender_name=user_name,
                        sender_role="user",
                        content=data.initial_message
                    )
                return cls._to_conversation_response(DatabaseRepository.get_conversation_by_id(str(conv["id"])))

        topic = data.topic or (f"Konsultacja posta: {data.idea_title}" if data.idea_title else "Zapytanie do eksperta ROPS Kraków")

        new_conv = {
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_email,
            "idea_id": data.idea_id,
            "idea_title": data.idea_title,
            "topic": topic,
            "status": "open",
            "unread_by_admin": 1 if data.initial_message else 0,
            "unread_by_user": 0,
            "last_message": data.initial_message[:120] if data.initial_message else None
        }
        created = DatabaseRepository.create_conversation(new_conv)
        conv_id = str(created["id"])

        if data.initial_message:
            DatabaseRepository.create_message({
                "conversation_id": conv_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "sender_role": "user",
                "content": data.initial_message
            })

        return cls._to_conversation_response(created)

    @classmethod
    def list_conversations(
        cls,
        current_user_id: str,
        is_admin: bool,
        status: Optional[str] = None
    ) -> List[ConversationResponse]:
        """
        Dla administratora/eksperta zwraca wszystkie konwersacje (panel admina).
        Dla zwykłego użytkownika zwraca wyłącznie jego własne czaty.
        """
        user_filter = None if is_admin else current_user_id
        conversations = DatabaseRepository.get_conversations(user_id=user_filter, status=status)
        return [cls._to_conversation_response(c) for c in conversations]

    @classmethod
    def get_conversation(
        cls,
        conv_id: str,
        current_user_id: str,
        is_admin: bool
    ) -> ConversationResponse:
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono konwersacji.")
        if not is_admin and str(conv["user_id"]) != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do tego czatu.")
        return cls._to_conversation_response(conv)

    @classmethod
    def send_message(
        cls,
        conv_id: str,
        sender_id: str,
        sender_name: str,
        sender_role: str,
        content: str
    ) -> MessageResponse:
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono konwersacji.")

        # Zwykły użytkownik może pisać tylko w swoich czatach
        is_admin = sender_role in ("admin", "expert")
        if not is_admin and str(conv["user_id"]) != sender_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do wysyłania wiadomości w tym czacie.")

        msg_data = {
            "conversation_id": conv_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "sender_role": "admin" if is_admin else "user",
            "content": content
        }
        created = DatabaseRepository.create_message(msg_data)
        return cls._to_message_response(created)

    @classmethod
    def poll_messages(
        cls,
        conv_id: str,
        reader_id: str,
        reader_role: str,
        since: Optional[str] = None,
        after_id: Optional[str] = None
    ) -> PollMessagesResponse:
        """
        Mechanizm Pollingu (wywoływany przez frontend np. co 3 sekundy).
        Pobiera nowe wiadomości (od `since` lub `after_id`) oraz zeruje nieprzeczytane wiadomości.
        """
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono konwersacji.")

        is_admin = reader_role in ("admin", "expert")
        if not is_admin and str(conv["user_id"]) != reader_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do tego czatu.")

        # Pobierz wiadomości
        messages = DatabaseRepository.get_messages_for_conversation(conv_id=conv_id, since=since, after_id=after_id)
        
        # Oznacz jako przeczytane dla tego uczestnika
        DatabaseRepository.mark_conversation_read(conv_id=conv_id, reader_role=reader_role)

        now_iso = datetime.now(timezone.utc).isoformat()
        return PollMessagesResponse(
            conversation_id=conv_id,
            messages=[cls._to_message_response(m) for m in messages],
            last_polled_at=now_iso,
            new_messages_count=len(messages),
            conversation_status=conv.get("status", "open"),
            assigned_admin_name=conv.get("assigned_admin_name")
        )

    @classmethod
    def update_status(
        cls,
        conv_id: str,
        new_status: str,
        current_user_id: str,
        is_admin: bool
    ) -> ConversationResponse:
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono konwersacji.")
        if not is_admin and str(conv["user_id"]) != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień.")

        updated = DatabaseRepository.update_conversation(conv_id, {"status": new_status})
        return cls._to_conversation_response(updated)

    @classmethod
    def delete_conversation(
        cls,
        conv_id: str,
        current_user_id: str,
        is_admin: bool
    ) -> bool:
        conv = DatabaseRepository.get_conversation_by_id(conv_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono konwersacji.")
        if not is_admin and str(conv["user_id"]) != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tej rozmowy.")

        return DatabaseRepository.delete_conversation(conv_id)
