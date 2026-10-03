from fastapi import HTTPException, status
from typing import List, Optional
from supabase_client import DatabaseRepository
from ideas.schemas import IdeaCreate, IdeaResponse, ReactionResponse, ReactionType

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
            id=idea["id"],
            title=idea["title"],
            description=idea["description"],
            category=idea.get("category", "general"),
            author_id=idea["author_id"],
            author_name=idea["author_name"],
            created_at=str(idea["created_at"]),
            likes_count=likes,
            volunteers_count=volunteers,
            dislikes_count=dislikes,
            my_reactions=my_reactions
        )

    @classmethod
    def list_ideas(cls, current_user_id: Optional[str] = None) -> List[IdeaResponse]:
        ideas = DatabaseRepository.get_all_ideas()
        return [cls._compute_stats(i, current_user_id) for i in ideas]

    @classmethod
    def create_idea(cls, data: IdeaCreate, author_id: str, author_name: str) -> IdeaResponse:
        new_data = {
            "title": data.title,
            "description": data.description,
            "category": data.category or "general",
            "author_id": author_id,
            "author_name": author_name
        }
        created = DatabaseRepository.create_idea(new_data)
        return cls._compute_stats(created, author_id)

    @classmethod
    def delete_idea(cls, idea_id: str, user_id: str, is_admin: bool = False) -> bool:
        idea = DatabaseRepository.get_idea_by_id(idea_id)
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pomysł o podanym ID nie istnieje."
            )
        
        # Check permissions: author or admin
        if idea["author_id"] != user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień. Tylko autor posta lub administrator może go usunąć."
            )

        success = DatabaseRepository.delete_idea(idea_id)
        if not success:
            raise HTTPException(status_code=500, detail="Nie udało się usunąć posta.")
        return True

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
