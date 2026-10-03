from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class ConversationCreate(BaseModel):
    idea_id: Optional[str] = Field(None, description="ID pomysłu/posta, z którego kliknięto 'Napisz do eksperta'")
    idea_title: Optional[str] = Field(None, description="Tytuł pomysłu/posta dla kontekstu")
    topic: Optional[str] = Field("Zapytanie do eksperta ROPS Kraków", description="Temat rozmowy lub zapytania")
    initial_message: Optional[str] = Field(None, min_length=1, description="Opcjonalna pierwsza wiadomość otwierająca czat")

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    idea_id: Optional[str] = None
    idea_title: Optional[str] = None
    topic: str
    status: Literal["open", "in_progress", "closed"] = "open"
    assigned_admin_id: Optional[str] = None
    assigned_admin_name: Optional[str] = None
    unread_by_admin: int = 0
    unread_by_user: int = 0
    last_message: Optional[str] = None
    last_message_at: str
    created_at: str

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Treść wiadomości wysyłanej do czatu")

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_role: Literal["user", "admin", "expert"]
    content: str
    created_at: str

class PollMessagesResponse(BaseModel):
    conversation_id: str
    messages: List[MessageResponse]
    last_polled_at: str
    new_messages_count: int
    conversation_status: str
    assigned_admin_name: Optional[str] = None

class ConversationStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "closed"] = Field(..., description="Nowy status rozmowy")
