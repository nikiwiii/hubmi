from pydantic import BaseModel, Field
from typing import Optional, Literal

NotificationType = Literal["new_idea", "chat_message", "grant_call", "partnership", "expert_assigned"]

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: NotificationType
    read: bool = False
    created_at: str
    link: Optional[str] = None
    email_sent: bool = True
    email_recipient: Optional[str] = None
    email_subject: Optional[str] = None
    email_preview_html: Optional[str] = None

class SimulatedEmailResponse(BaseModel):
    notification_id: str
    sender: str
    recipient: str
    subject: str
    sent_at: str
    body_text: str
    body_html: str

