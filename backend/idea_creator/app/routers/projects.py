from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import CurrentUser, get_current_user
from app.repository import IdeasRepository, RepositoryError, get_repository
from app.schemas import ProjectCreate, ProjectOut, parse_image_data_url
from app.services.storage import ImageStorage, StorageError, get_image_storage

router = APIRouter(prefix="/projects", tags=["Projects"])

DB_ERROR_DETAIL = "Błąd bazy danych. Spróbuj ponownie za chwilę."


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED, summary="Opublikuj projekt")
def publish_project(
    project: ProjectCreate,
    user: CurrentUser = Depends(get_current_user),
    repo: IdeasRepository = Depends(get_repository),
    storage: ImageStorage = Depends(get_image_storage),
):
    image_url = None
    if project.image:
        try:
            image_url = storage.upload(*parse_image_data_url(project.image))
        except StorageError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Nie udało się zapisać obrazu. Spróbuj ponownie albo opublikuj projekt bez obrazu.",
            )
    try:
        created = repo.create(project, user_id=user.id, author_name=user.full_name, image_url=image_url)
        try:
            from notifications.service import NotificationService
            NotificationService.create_notification(
                title=f"Nowy pomysł w Hubie: {project.tytul}",
                message=f"Mieszkaniec {user.full_name} opublikował nowy pomysł w Kreatorze: '{project.tytul}'. Zapoznaj się z koncepcją i zaproponuj wsparcie mentoringowe.",
                notif_type="new_idea",
                role_target="admin",
                link="/admin",
                recipient_email="admin@rops.krakow.pl",
                subject=f"[MiNNO / ROPS Kraków] Nowe zgłoszenie w Kreatorze Pomysłów: {project.tytul}"
            )
        except Exception:
            pass
        return created
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)


@router.get("", response_model=list[ProjectOut], summary="Lista projektów")
def list_projects(repo: IdeasRepository = Depends(get_repository)):
    try:
        return repo.list()
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)


@router.get("/{project_id}", response_model=ProjectOut, summary="Szczegóły projektu")
def get_project(project_id: str, repo: IdeasRepository = Depends(get_repository)):
    try:
        project = repo.get(str(project_id))
    except RepositoryError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=DB_ERROR_DETAIL)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projekt o podanym ID nie istnieje.")
    return project
