import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from notifications.schemas import NotificationResponse, SimulatedEmailResponse

class NotificationService:
    # Baza powiadomień w pamięci podręcznej (z domyślnymi wpisami demonstrującymi dla jury)
    _notifications: List[Dict[str, Any]] = [
        {
            "id": "notif-grant-1",
            "title": "Nowy nabór grantowy ROPS Kraków!",
            "message": "Rozpoczął się nabór w projekcie 'Małopolski Inkubator Innowacji Społecznych'. Granty do 50 000 zł na rozwiązania dla seniorów.",
            "type": "grant_call",
            "read": False,
            "created_at": "2026-10-03T18:00:00Z",
            "link": "/knowledge",
            "email_sent": True,
            "email_recipient": "mieszkaniec@malopolska.pl",
            "email_subject": "[ROPS Kraków] Nowy nabór wniosków na innowacje społeczne (granty do 50 000 zł)",
            "role_target": "all"
        },
        {
            "id": "notif-idea-admin-1",
            "title": "Nowy pomysł zgłoszony przez mieszkańca",
            "message": "Użytkownik dodał pomysł: 'Mobilny punkt wsparcia seniora w sołectwie'. Sprawdź zgłoszenie i przypisz mentora.",
            "type": "new_idea",
            "read": False,
            "created_at": "2026-10-03T18:45:00Z",
            "link": "/admin",
            "email_sent": True,
            "email_recipient": "admin@rops.krakow.pl",
            "email_subject": "[MiNNO / Hubmi] Zgłoszono nowy pomysł mieszkańca w powiecie tarnowskim",
            "role_target": "admin"
        },
        {
            "id": "notif-chat-1",
            "title": "Odpowiedź od eksperta ROPS Kraków",
            "message": "mgr Anna Kowalska odpisała na Twoje zapytanie dotyczące dofinansowania teleopieki w gminie.",
            "type": "chat_message",
            "read": False,
            "created_at": "2026-10-03T19:15:00Z",
            "link": "/chat",
            "email_sent": True,
            "email_recipient": "tworca@hubmi.org",
            "email_subject": "[MiNNO / ROPS] mgr Anna Kowalska odpowiedziała na Twoją wiadomość na czacie",
            "role_target": "user"
        },
        {
            "id": "notif-partner-1",
            "title": "Zapytanie o partnerstwo NGO",
            "message": "Stowarzyszenie 'Pomocna Dłoń' wyraziło chęć partnerstwa przy realizacji projektu opieki sąsiedzkiej.",
            "type": "partnership",
            "read": False,
            "created_at": "2026-10-03T19:30:00Z",
            "link": "/discover",
            "email_sent": True,
            "email_recipient": "tworca@hubmi.org",
            "email_subject": "[MiNNO / Partnerstwa] Nowe zgłoszenie chęci partnerstwa od NGO",
            "role_target": "user"
        },
        {
            "id": "notif-expert-assigned-1",
            "title": "Przypisano mentora ROPS do pomysłu",
            "message": "dr inż. Michał Stankiewicz został przypisany jako Twój mentor ds. dostępności architektonicznej.",
            "type": "expert_assigned",
            "read": False,
            "created_at": "2026-10-03T20:00:00Z",
            "link": "/chat",
            "email_sent": True,
            "email_recipient": "tworca@hubmi.org",
            "email_subject": "[MiNNO / ROPS] Twój pomysł otrzymał mentora merytorycznego",
            "role_target": "user"
        }
    ]

    @classmethod
    def get_notifications_for_user(cls, user_id: Optional[str], role: str = "creator") -> List[NotificationResponse]:
        is_admin_or_expert = role in ("admin", "expert")
        filtered = []
        for n in cls._notifications:
            target = n.get("role_target", "all")
            if target == "all":
                filtered.append(n)
            elif is_admin_or_expert and target in ("admin", "expert"):
                filtered.append(n)
            elif not is_admin_or_expert and target in ("user", "creator"):
                filtered.append(n)

        # Generuj pełną odpowiedź ze sformatowanym podglądem e-maila
        res = []
        for item in filtered:
            email_html = cls._generate_email_html(item)
            res.append(NotificationResponse(
                id=item["id"],
                title=item["title"],
                message=item["message"],
                type=item["type"],
                read=item.get("read", False),
                created_at=item["created_at"],
                link=item.get("link"),
                email_sent=item.get("email_sent", True),
                email_recipient=item.get("email_recipient", "uzytkownik@malopolska.pl"),
                email_subject=item.get("email_subject", item["title"]),
                email_preview_html=email_html
            ))
        return res

    @classmethod
    def mark_as_read(cls, notif_id: str) -> bool:
        for n in cls._notifications:
            if n["id"] == notif_id:
                n["read"] = True
                return True
        return False

    @classmethod
    def mark_all_as_read(cls) -> bool:
        for n in cls._notifications:
            n["read"] = True
        return True

    @classmethod
    def create_notification(
        cls,
        title: str,
        message: str,
        notif_type: str,
        role_target: str = "all",
        link: Optional[str] = None,
        recipient_email: str = "uzytkownik@malopolska.pl",
        subject: Optional[str] = None
    ) -> NotificationResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        notif_id = f"notif-{uuid.uuid4().hex[:8]}"
        item = {
            "id": notif_id,
            "title": title,
            "message": message,
            "type": notif_type,
            "read": False,
            "created_at": now_iso,
            "link": link,
            "email_sent": True,
            "email_recipient": recipient_email,
            "email_subject": subject or f"[ROPS Kraków / MiNNO] {title}",
            "role_target": role_target
        }
        cls._notifications.insert(0, item)
        email_html = cls._generate_email_html(item)
        return NotificationResponse(
            id=item["id"],
            title=item["title"],
            message=item["message"],
            type=item["type"],
            read=False,
            created_at=now_iso,
            link=link,
            email_sent=True,
            email_recipient=recipient_email,
            email_subject=item["email_subject"],
            email_preview_html=email_html
        )

    @classmethod
    def get_simulated_email(cls, notif_id: str) -> Optional[SimulatedEmailResponse]:
        item = next((n for n in cls._notifications if n["id"] == notif_id), None)
        if not item:
            return None

        body_html = cls._generate_email_html(item)
        body_text = (
            f"Regionalny Ośrodek Polityki Społecznej w Krakowie\n"
            f"Platforma Innowacji Społecznych 'MiNNO'\n\n"
            f"Szanowni Państwo,\n\n"
            f"{item['message']}\n\n"
            f"Aby przejść do szczegółów, skorzystaj z platformy: {item.get('link', '/')}\n\n"
            f"Z poważaniem,\nZespół ROPS Kraków"
        )

        return SimulatedEmailResponse(
            notification_id=item["id"],
            sender="powiadomienia@rops.krakow.pl (ROPS Kraków)",
            recipient=item.get("email_recipient", "uzytkownik@malopolska.pl"),
            subject=item.get("email_subject", item["title"]),
            sent_at=item["created_at"],
            body_text=body_text,
            body_html=body_html
        )

    @staticmethod
    def _generate_email_html(item: Dict[str, Any]) -> str:
        recipient = item.get("email_recipient", "uzytkownik@malopolska.pl")
        subject = item.get("email_subject", item["title"])
        return f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e5e5e0; border-radius: 16px; overflow: hidden; background: #ffffff;">
            <div style="background: #1c1917; color: #ffffff; padding: 24px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #EFE5C6; background: rgba(255,255,255,0.1); padding: 4px 8px; rounded: 6px;">ROPS KRAKÓW</span>
                </div>
                <h2 style="margin: 12px 0 0 0; font-size: 20px; font-weight: bold; color: #ffffff;">MiNNO • Powiadomienie Systemowe</h2>
            </div>
            <div style="padding: 24px; color: #292524; line-height: 1.6; font-size: 14px;">
                <div style="background: #fafaf8; border: 1px solid #f0eee6; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #57534e;">
                    <div><strong>Do:</strong> {recipient}</div>
                    <div><strong>Od:</strong> powiadomienia@rops.krakow.pl</div>
                    <div><strong>Temat:</strong> {subject}</div>
                    <div><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">✔ Wysłano pomyślnie (SMTP Relay)</span></div>
                </div>
                <h3 style="margin-top: 0; color: #1c1917; font-size: 16px;">{item['title']}</h3>
                <p style="color: #44403c; margin: 12px 0;">{item['message']}</p>
                <div style="margin: 24px 0 12px 0;">
                    <a href="{item.get('link', '#')}" style="display: inline-block; background: #1c1917; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 13px;">Otwórz w platformie MiNNO &rarr;</a>
                </div>
            </div>
            <div style="background: #f5f5f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #e5e5e0;">
                Regionalny Ośrodek Polityki Społecznej w Krakowie • ul. Piastowska 32, 30-070 Kraków<br/>
                Wiadomość wygenerowana automatycznie przez system MiNNO.
            </div>
        </div>
        """

