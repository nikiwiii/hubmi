from fastapi import HTTPException, status
from typing import List, Optional
from supabase_client import DatabaseRepository
from ideas.schemas import (
    IdeaCreate,
    IdeaResponse,
    ReactionResponse,
    ReactionType,
    AssignExpertRequest,
    PartnershipRequest
)
from notifications.service import NotificationService

class IdeaService:
    @staticmethod
    def _compute_stats(idea: dict, current_user_id: Optional[str] = None) -> IdeaResponse:
        reactions = DatabaseRepository.get_reactions_for_idea(idea["id"])
        likes = sum(1 for r in reactions if r["reaction_type"] == "like")
        volunteers = sum(1 for r in reactions if r["reaction_type"] == "volunteer")
        dislikes = sum(1 for r in reactions if r["reaction_type"] == "dislike")

        my_reactions = []
        if current_user_id:
            my_reactions = [
                r["reaction_type"] for r in reactions if r["user_id"] == current_user_id
            ]

        return IdeaResponse(
            id=str(idea["id"]),
            title=idea["title"],
            description=idea["description"],
            category=idea.get("category", "general"),
            user_id=str(idea["user_id"]),
            author_name=idea.get("author_name") or "Anonim",
            image_url=idea.get("image_url") or idea.get("essence"),
            created_at=str(idea["created_at"]),
            likes_count=likes,
            volunteers_count=volunteers,
            dislikes_count=dislikes,
            my_reactions=my_reactions,
            looking_for_partner=bool(idea.get("looking_for_partner", False)),
            partner_types=idea.get("partner_types") or [],
            assigned_expert_id=idea.get("assigned_expert_id"),
            assigned_expert_name=idea.get("assigned_expert_name"),
            assigned_expert_specialization=idea.get("assigned_expert_specialization")
        )

    @classmethod
    def list_ideas(cls, current_user_id: Optional[str] = None) -> List[IdeaResponse]:
        ideas = DatabaseRepository.get_all_ideas()
        return [cls._compute_stats(i, current_user_id) for i in ideas]

    @classmethod
    def create_idea(cls, data: IdeaCreate, user_id: str, author_name: str) -> IdeaResponse:
        new_data = {
            "title": data.title,
            "description": data.description,
            "category": data.category or "general",
            "user_id": user_id,
            "author_name": author_name,
            "looking_for_partner": bool(data.looking_for_partner),
            "partner_types": data.partner_types or [],
            "assigned_expert_id": data.assigned_expert_id,
            "assigned_expert_name": data.assigned_expert_name,
            "assigned_expert_specialization": data.assigned_expert_specialization
        }
        created = DatabaseRepository.create_idea(new_data)

        # Powiadom administratora i eksperta o nowym pomyśle mieszkańca (z symulacją e-mail)
        NotificationService.create_notification(
            title=f"Nowy pomysł w Hubie: {data.title}",
            message=f"Mieszkaniec {author_name} opublikował nowy pomysł w kategorii '{data.category}'. Zapoznaj się z koncepcją i zaproponuj wsparcie mentoringowe.",
            notif_type="new_idea",
            role_target="admin",
            link="/admin",
            recipient_email="admin@rops.krakow.pl",
            subject=f"[MiNNO / ROPS Kraków] Nowe zgłoszenie pomysłu: {data.title}"
        )

        return cls._compute_stats(created, user_id)

    @classmethod
    def delete_idea(cls, idea_id: str, user_id: str, is_admin: bool = False) -> bool:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pomysł o podanym ID nie istnieje."
            )
        
        # Check permissions: author or admin
        if idea["user_id"] != user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień. Tylko autor posta lub administrator może go usunąć."
            )

        success = DatabaseRepository.delete_idea(idea_id)
        if not success:
            raise HTTPException(status_code=500, detail="Nie udało się usunąć posta.")
        return True

    @classmethod
    def assign_expert(cls, idea_id: str, data: AssignExpertRequest, user_id: str, is_admin: bool = False) -> IdeaResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        updates = {
            "assigned_expert_id": data.expert_id,
            "assigned_expert_name": data.expert_name,
            "assigned_expert_specialization": data.expert_specialization
        }
        updated = DatabaseRepository.update_idea(idea_id, updates)
        if not updated:
            raise HTTPException(status_code=500, detail="Nie udało się przypisać eksperta.")

        # Wyślij powiadomienie (i symulowany e-mail) do autora pomysłu
        NotificationService.create_notification(
            title=f"Przypisano mentora ROPS do pomysłu: {idea.get('title')}",
            message=f"Ekspert {data.expert_name} ({data.expert_specialization or 'ROPS Kraków'}) został oficjalnym mentorem Twojego projektu. Możesz skonsultować założenia na czacie.",
            notif_type="expert_assigned",
            role_target="user",
            link=f"/chat?topic={idea.get('title')}",
            recipient_email="autor@hubmi.org",
            subject=f"[MiNNO / ROPS] Twój projekt '{idea.get('title')}' otrzymał mentora merytorycznego"
        )

        return cls._compute_stats(updated, user_id)

    @classmethod
    def request_partnership(cls, idea_id: str, data: PartnershipRequest, sender_name: str) -> dict:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        # Wyślij powiadomienie do autora pomysłu
        NotificationService.create_notification(
            title=f"Nowe zgłoszenie partnerstwa dla: {idea.get('title')}",
            message=f"{data.partner_name} ({data.partner_type}) zgłasza chęć współpracy przy Twoim pomyśle: \"{data.message}\". Kontakt: {data.contact_email}",
            notif_type="partnership",
            role_target="user",
            link="/discover",
            recipient_email="autor@hubmi.org",
            subject=f"[MiNNO / Partnerstwo] {data.partner_name} chce nawiązać partnerstwo przy '{idea.get('title')}'"
        )

        return {
            "status": "success",
            "message": f"Zgłoszenie partnerstwa wysłane do autora pomysłu '{idea.get('title')}'. Wysłano również powiadomienie e-mail."
        }

    @classmethod
    def toggle_reaction(cls, idea_id: str, user_id: str, reaction_type: ReactionType) -> ReactionResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pomysł o podanym ID nie istnieje."
            )

        res = DatabaseRepository.toggle_reaction(idea_id, user_id, reaction_type)
        reactions = DatabaseRepository.get_reactions_for_idea(idea_id)
        
        likes = sum(1 for r in reactions if r["reaction_type"] == "like")
        volunteers = sum(1 for r in reactions if r["reaction_type"] == "volunteer")
        dislikes = sum(1 for r in reactions if r["reaction_type"] == "dislike")

        return ReactionResponse(
            idea_id=idea_id,
            reaction_type=reaction_type,
            active=res["active"],
            likes_count=likes,
            volunteers_count=volunteers,
            dislikes_count=dislikes
        )

