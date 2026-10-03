from fastapi import HTTPException, status
from typing import List, Optional
from supabase_client import DatabaseRepository
from ideas.schemas import (
    IdeaCreate,
    IdeaResponse,
    ReactionResponse,
    ReactionType,
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
from notifications.service import NotificationService

class IdeaService:
    @staticmethod
    def _compute_stats(idea: dict, current_user_id: Optional[str] = None) -> IdeaResponse:
        reactions = DatabaseRepository.get_reactions_for_idea(idea["id"])
        likes = sum(1 for r in reactions if r["reaction_type"] == "like")
        volunteers = sum(1 for r in reactions if r["reaction_type"] == "volunteer")
        approved_apps = DatabaseRepository.get_tester_applications(idea_id=str(idea["id"]), status="approved")
        volunteers = max(volunteers, len(approved_apps))
        dislikes = sum(1 for r in reactions if r["reaction_type"] == "dislike")

        my_reactions = []
        if current_user_id:
            my_reactions = [
                r["reaction_type"] for r in reactions if r["user_id"] == current_user_id
            ]
            my_approved = any(str(a.get("user_id")) == str(current_user_id) for a in approved_apps)
            if my_approved and "volunteer" not in my_reactions:
                my_reactions.append("volunteer")

        return IdeaResponse(
            id=str(idea["id"]),
            title=idea["title"],
            description=idea["description"],
            category=idea.get("category", "general"),
            user_id=str(idea["user_id"]),
            author_name=idea.get("author_name") or "Anonim",
            image_url=idea.get("image_url") or idea.get("essence"),
            created_at=str(idea["created_at"]),
            status=idea.get("status", "pending"),
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
    def list_ideas(cls, current_user_id: Optional[str] = None, is_admin: bool = False) -> List[IdeaResponse]:
        ideas = DatabaseRepository.get_all_ideas()
        result = []
        for i in ideas:
            st = i.get("status", "pending")
            # Administrator widzi wszystkie pomysły (w tym pending i rejected)
            if is_admin:
                result.append(cls._compute_stats(i, current_user_id))
            # Zwykły użytkownik / gość widzi tylko pomysły aktywne i w trakcie testów,
            # oraz swoje własne zgłoszone pomysły (aby widzieć status moderacji)
            elif st in ("active", "testing") or (current_user_id and str(i.get("user_id")) == str(current_user_id)):
                result.append(cls._compute_stats(i, current_user_id))
        return result

    @classmethod
    def create_idea(cls, data: IdeaCreate, user_id: str, author_name: str) -> IdeaResponse:
        new_data = {
            "title": data.title,
            "description": data.description,
            "category": data.category or "general",
            "user_id": user_id,
            "author_name": author_name,
            "status": data.status or "pending",
            "looking_for_partner": bool(data.looking_for_partner),
            "partner_types": data.partner_types or [],
            "assigned_expert_id": data.assigned_expert_id,
            "assigned_expert_name": data.assigned_expert_name,
            "assigned_expert_specialization": data.assigned_expert_specialization
        }
        created = DatabaseRepository.create_idea(new_data)

        # Powiadom administratora o nowym pomyśle oczekującym na weryfikację
        NotificationService.create_notification(
            title=f"Nowy pomysł oczekuje na moderację: {data.title}",
            message=f"Mieszkaniec {author_name} zgłosił nowy pomysł w kategorii '{data.category}'. Wymaga zatwierdzenia w Panelu Administratora przed publikacją na ogólnym feedzie.",
            notif_type="new_idea",
            role_target="admin",
            link="/admin",
            recipient_email="admin@rops.krakow.pl",
            subject=f"[minno / Moderacja] Nowe zgłoszenie pomysłu do weryfikacji: {data.title}"
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

    # ==========================================
    # TESTER INNOWACJI: Usability rating, feedback & comments
    # ==========================================

    @classmethod
    def get_testing_summary(cls, idea_id: str) -> TestingSummaryResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        raw_feedback = DatabaseRepository.get_feedback_for_idea(idea_id)
        raw_comments = DatabaseRepository.get_comments_for_idea(idea_id)
        reactions = DatabaseRepository.get_reactions_for_idea(idea_id)
        volunteers_from_reactions = sum(1 for r in reactions if r["reaction_type"] == "volunteer")
        approved_apps = DatabaseRepository.get_tester_applications(idea_id=idea_id, status="approved")
        testers_count = max(volunteers_from_reactions, len(approved_apps))

        reviews_count = len(raw_feedback)
        if reviews_count > 0:
            avg_overall = round(sum(f.get("overall_rating", 0) for f in raw_feedback) / reviews_count, 1)
            avg_usability = round(sum(f.get("usability_rating", 0) for f in raw_feedback) / reviews_count, 1)
            avg_accessibility = round(sum(f.get("accessibility_rating", 0) for f in raw_feedback) / reviews_count, 1)
            avg_impact = round(sum(f.get("impact_rating", 0) for f in raw_feedback) / reviews_count, 1)
        else:
            avg_overall = 0.0
            avg_usability = 0.0
            avg_accessibility = 0.0
            avg_impact = 0.0

        feedback_list = [
            FeedbackResponse(
                id=str(f.get("id")),
                idea_id=str(f.get("idea_id")),
                user_id=str(f.get("user_id")) if f.get("user_id") else None,
                author_name=f.get("author_name", "Anonimowy tester"),
                author_role=f.get("author_role", "Tester społeczny"),
                overall_rating=int(f.get("overall_rating", 5)),
                usability_rating=int(f.get("usability_rating", 5)),
                accessibility_rating=int(f.get("accessibility_rating", 5)),
                impact_rating=int(f.get("impact_rating", 5)),
                strengths=f.get("strengths"),
                weaknesses=f.get("weaknesses"),
                suggested_improvements=f.get("suggested_improvements"),
                comment=f.get("comment"),
                created_at=str(f.get("created_at")),
            )
            for f in raw_feedback
        ]

        comments_list = [
            CommentResponse(
                id=str(c.get("id")),
                idea_id=str(c.get("idea_id")),
                user_id=str(c.get("user_id")) if c.get("user_id") else None,
                author_name=c.get("author_name", "Użytkownik"),
                content=c.get("content", ""),
                created_at=str(c.get("created_at")),
            )
            for c in raw_comments
        ]

        return TestingSummaryResponse(
            idea_id=idea_id,
            testers_count=max(testers_count, reviews_count),
            reviews_count=reviews_count,
            avg_overall_rating=avg_overall,
            avg_usability_rating=avg_usability,
            avg_accessibility_rating=avg_accessibility,
            avg_impact_rating=avg_impact,
            feedback_list=feedback_list,
            comments_list=comments_list
        )

    @classmethod
    def _is_user_approved_tester(
        cls,
        idea_id: str,
        user_id: Optional[str],
        user_email: Optional[str],
        user_role: Optional[str]
    ) -> bool:
        """
        Sprawdza, czy użytkownik ma uprawnienia testera:
        1. Administratorzy i eksperci ROPS – zawsze uprawnieni
        2. Zaakceptowani testerzy z zatwierdzonym wnioskiem (status 'approved')
        3. Użytkownicy na liście testersList powiązanej z pomysłem
        """
        if user_role in ("admin", "expert") or (user_email and "admin" in user_email.lower()):
            return True

        approved_apps = DatabaseRepository.get_tester_applications(idea_id=idea_id, status="approved")
        for app in approved_apps:
            if user_id and app.get("user_id") and str(app.get("user_id")) == str(user_id):
                return True
            if user_email and app.get("user_email") and str(app.get("user_email")).lower() == user_email.lower():
                return True

        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if idea and user_email:
            testers_list = idea.get("testersList") or []
            if any(t.lower() == user_email.lower() for t in testers_list):
                return True

        return False

    @classmethod
    def add_feedback(
        cls,
        idea_id: str,
        data: FeedbackCreate,
        user_id: Optional[str],
        author_name: str,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> FeedbackResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        # Wymóg: tylko zaakceptowany tester lub administrator może wystawić ocenę i opinię
        if not cls._is_user_approved_tester(idea_id, user_id, user_email, user_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Dodawanie recenzji i ocen użyteczności wymaga wcześniejszej akceptacji Twojego zgłoszenia jako testera przez administratora."
            )

        feedback_data = {
            "idea_id": idea_id,
            "user_id": user_id,
            "author_name": author_name,
            "author_role": data.author_role or "Tester społeczny",
            "overall_rating": data.overall_rating,
            "usability_rating": data.usability_rating,
            "accessibility_rating": data.accessibility_rating,
            "impact_rating": data.impact_rating,
            "strengths": data.strengths,
            "weaknesses": data.weaknesses,
            "suggested_improvements": data.suggested_improvements,
            "comment": data.comment,
        }

        created = DatabaseRepository.create_feedback(feedback_data)

        # Powiadomienie autora i admina o nowym feedbacku i ocenie użyteczności
        notif_msg = f"Tester {author_name} ocenił prototyp '{idea.get('title')}' na {data.overall_rating}/5 (użyteczność: {data.usability_rating}/5)."
        if data.suggested_improvements:
            notif_msg += f" Zgłoszono usprawnienie: \"{data.suggested_improvements[:80]}...\""

        NotificationService.create_notification(
            title=f"Nowa ocena i informacja zwrotna: {idea.get('title')}",
            message=notif_msg,
            notif_type="new_idea",
            role_target="user",
            link=f"/discover/{idea_id}",
            recipient_email="autor@hubmi.org",
            subject=f"[minno / Tester] Nowy feedback i ocena użyteczności dla '{idea.get('title')}'"
        )

        return FeedbackResponse(
            id=str(created["id"]),
            idea_id=str(created["idea_id"]),
            user_id=str(created.get("user_id")) if created.get("user_id") else None,
            author_name=created["author_name"],
            author_role=created["author_role"],
            overall_rating=created["overall_rating"],
            usability_rating=created["usability_rating"],
            accessibility_rating=created["accessibility_rating"],
            impact_rating=created["impact_rating"],
            strengths=created.get("strengths"),
            weaknesses=created.get("weaknesses"),
            suggested_improvements=created.get("suggested_improvements"),
            comment=created.get("comment"),
            created_at=str(created["created_at"]),
        )

    @classmethod
    def add_comment(
        cls,
        idea_id: str,
        data: CommentCreate,
        user_id: Optional[str],
        author_name: str,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> CommentResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        # Wymóg: zaakceptowany tester, administrator lub autor projektu odpowiadający w dyskusji
        is_tester_or_admin = cls._is_user_approved_tester(idea_id, user_id, user_email, user_role)
        is_author = (user_id and str(idea.get("user_id")) == str(user_id)) or (
            user_email and idea.get("author_email") and idea.get("author_email").lower() == user_email.lower()
        )

        if not (is_tester_or_admin or is_author):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Dodawanie komentarzy w wątku testowym wymaga wcześniejszej akceptacji Twojego zgłoszenia jako testera przez administratora."
            )

        comment_data = {
            "idea_id": idea_id,
            "user_id": user_id,
            "author_name": author_name,
            "content": data.content,
        }
        created = DatabaseRepository.create_comment(comment_data)
        return CommentResponse(
            id=str(created["id"]),
            idea_id=str(created["idea_id"]),
            user_id=str(created.get("user_id")) if created.get("user_id") else None,
            author_name=created["author_name"],
            content=created["content"],
            created_at=str(created["created_at"]),
        )

    # ==========================================
    # MODERACJA POMYSŁÓW PRZEZ ADMINISTRATORA
    # ==========================================

    @classmethod
    def update_idea_status(cls, idea_id: str, new_status: str, admin_name: str = "Administrator") -> IdeaResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        updated = DatabaseRepository.update_idea(idea_id, {"status": new_status})
        if not updated:
            raise HTTPException(status_code=500, detail="Nie udało się zaktualizować statusu pomysłu.")

        if new_status == "active":
            NotificationService.create_notification(
                title=f"Twój pomysł został zaakceptowany i opublikowany! 🎉",
                message=f"Administrator ({admin_name}) zatwierdził Twój pomysł '{idea.get('title')}'. Jest on teraz widoczny na ogólnym feedzie społeczności i otwarty na zgłoszenia testerów.",
                notif_type="idea_approved",
                role_target="user",
                link=f"/discover/{idea_id}",
                recipient_email="autor@hubmi.org",
                subject=f"[minno / ROPS Kraków] Twój pomysł '{idea.get('title')}' został opublikowany na feedzie!"
            )
        elif new_status == "rejected":
            NotificationService.create_notification(
                title=f"Decyzja moderacyjna: Pomysł odrzucony",
                message=f"Twój pomysł '{idea.get('title')}' nie został zaakceptowany do publikacji na ogólnym feedzie.",
                notif_type="system",
                role_target="user",
                link="/discover",
                recipient_email="autor@hubmi.org",
                subject=f"[minno / ROPS Kraków] Status moderacji pomysłu '{idea.get('title')}'"
            )

        return cls._compute_stats(updated, None)

    # ==========================================
    # ZGŁOSZENIA TESTERÓW I AKCEPTACJA PRZEZ ADMINA
    # ==========================================

    @classmethod
    def apply_as_tester(
        cls,
        idea_id: str,
        user_id: str,
        user_name: str,
        user_email: Optional[str] = None,
        motivation: Optional[str] = None
    ) -> TesterApplicationResponse:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomysł nie istnieje.")

        existing = DatabaseRepository.get_tester_applications(idea_id=idea_id, user_id=user_id)
        if existing:
            if any(a.get("status") == "approved" for a in existing):
                raise HTTPException(status_code=400, detail="Jesteś już zatwierdzonym testerem tej innowacji.")
            if any(a.get("status") == "pending" for a in existing):
                raise HTTPException(status_code=400, detail="Twoje zgłoszenie do testowania oczekuje już na decyzję administratora.")

        app_data = {
            "idea_id": idea_id,
            "idea_title": idea.get("title", "Innowacja społeczna"),
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_email or f"{user_name.lower().replace(' ', '.')}@example.com",
            "status": "pending",
            "motivation": motivation
        }
        created = DatabaseRepository.create_tester_application(app_data)

        # Powiadomienie do administratora o nowym wniosku o zostanie testerem
        NotificationService.create_notification(
            title=f"Nowe zapytanie o zostanie testerem: {idea.get('title')}",
            message=f"Użytkownik {user_name} ({user_email or 'mieszkaniec'}) wysłał zgłoszenie do testowania innowacji '{idea.get('title')}'. Przejdź do Panelu Administratora, aby zaakceptować wniosek.",
            notif_type="tester_application",
            role_target="admin",
            link="/admin",
            recipient_email="admin@rops.krakow.pl",
            subject=f"[minno / Tester Innowacji] Nowe zgłoszenie testera dla '{idea.get('title')}'"
        )

        return TesterApplicationResponse(
            id=str(created["id"]),
            idea_id=str(created["idea_id"]),
            idea_title=created.get("idea_title", ""),
            user_id=str(created.get("user_id")) if created.get("user_id") else None,
            user_name=created["user_name"],
            user_email=created.get("user_email"),
            status=created["status"],
            motivation=created.get("motivation"),
            created_at=str(created["created_at"])
        )

    @classmethod
    def list_tester_applications(
        cls,
        idea_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[TesterApplicationResponse]:
        apps = DatabaseRepository.get_tester_applications(
            idea_id=idea_id, user_id=user_id, user_email=user_email, status=status
        )
        return [
            TesterApplicationResponse(
                id=str(a.get("id")),
                idea_id=str(a.get("idea_id")),
                idea_title=a.get("idea_title", ""),
                user_id=str(a.get("user_id")) if a.get("user_id") else None,
                user_name=a.get("user_name", "Anonim"),
                user_email=a.get("user_email"),
                status=a.get("status", "pending"),
                motivation=a.get("motivation"),
                created_at=str(a.get("created_at"))
            )
            for a in apps
        ]

    @classmethod
    def update_tester_application_status(
        cls,
        app_id: str,
        new_status: str,
        admin_name: str = "Administrator"
    ) -> TesterApplicationResponse:
        app = DatabaseRepository.get_tester_application_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie testera nie istnieje.")

        updated = DatabaseRepository.update_tester_application(app_id, {"status": new_status})
        if not updated:
            raise HTTPException(status_code=500, detail="Nie udało się zaktualizować zgłoszenia.")

        if new_status == "approved":
            # Aktywuj reakcję volunteer dla użytkownika, jeśli jeszcze jej nie ma
            if app.get("idea_id") and app.get("user_id"):
                reactions = DatabaseRepository.get_reactions_for_idea(str(app["idea_id"]))
                already_vol = any(
                    r.get("reaction_type") == "volunteer" and str(r.get("user_id")) == str(app["user_id"])
                    for r in reactions
                )
                if not already_vol:
                    DatabaseRepository.toggle_reaction(str(app["idea_id"]), str(app["user_id"]), "volunteer")

            # Powiadomienie dla zaakceptowanego testera (w aplikacji oraz symulowany e-mail)
            NotificationService.create_notification(
                title=f"Zostałeś zaakceptowany jako tester innowacji! 🎉",
                message=f"Administrator ({admin_name}) zatwierdził Twoje zgłoszenie do innowacji '{app.get('idea_title', 'społecznej')}'. Masz teraz aktywny status testera i możesz dodawać recenzje oraz oceny użyteczności.",
                notif_type="tester_approved",
                role_target="user",
                link=f"/discover/{app.get('idea_id')}",
                recipient_email=app.get("user_email") or "tester@minno.pl",
                subject=f"[minno / ROPS Kraków] Twoje zgłoszenie testera zostało zaakceptowane!"
            )
        elif new_status == "rejected":
            NotificationService.create_notification(
                title=f"Status zgłoszenia do testów: Odrzucone",
                message=f"Twoje zgłoszenie do testowania '{app.get('idea_title')}' nie zostało zaakceptowane. Zachęcamy do zgłaszania się do innych innowacji w Hubie.",
                notif_type="system",
                role_target="user",
                link="/discover",
                recipient_email=app.get("user_email") or "tester@minno.pl",
                subject=f"[minno / Tester Innowacji] Aktualizacja statusu Twojego zgłoszenia"
            )

        return TesterApplicationResponse(
            id=str(updated["id"]),
            idea_id=str(updated["idea_id"]),
            idea_title=updated.get("idea_title", ""),
            user_id=str(updated.get("user_id")) if updated.get("user_id") else None,
            user_name=updated.get("user_name", "Anonim"),
            user_email=updated.get("user_email"),
            status=updated.get("status", "pending"),
            motivation=updated.get("motivation"),
            created_at=str(updated.get("created_at"))
        )

