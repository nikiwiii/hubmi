from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional
from config import decode_access_token
from supabase_client import DatabaseRepository
from login.schemas import (
    ProfileCreate,
    UserLoginRequest,
    AdminLoginRequest,
    UserProfileResponse,
    TokenResponse
)
from login.service import AuthService

router = APIRouter(prefix="/api/login", tags=["Authentication & Profiles"])
bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak nagłówka autoryzacji Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token jest nieprawidłowy lub wygasł.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def get_optional_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    if credentials is None or not credentials.credentials:
        return None
    return decode_access_token(credentials.credentials)

def get_current_admin_payload(
    user_payload: dict = Depends(get_current_user_payload),
) -> dict:
    if user_payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora. Tylko administratorzy mogą wykonywać tę operację.",
        )
    return user_payload

# 1) Endpoint do logowania userów
@router.post("/user", response_model=TokenResponse, summary="1) Logowanie zwykłego użytkownika")
def login_user(credentials: UserLoginRequest):
    """
    Logowanie standardowego użytkownika (user).
    Zwraca token JWT oraz dane profilu.
    """
    return AuthService.login_user(credentials)

# 2) Endpoint do tworzenia profilu
@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED, summary="2) Tworzenie nowego profilu (Rejestracja)")
def create_profile(profile_data: ProfileCreate):
    """
    Tworzy nowy profil użytkownika w bazie (Supabase / Local).
    Pozwala na rejestrację jako 'user' lub 'admin'.
    """
    return AuthService.create_profile(profile_data)

# Alternatywny alias dla endpointu tworzenia profilu
@router.post("/profile", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED, summary="Alias: Tworzenie profilu")
def create_profile_alias(profile_data: ProfileCreate):
    return AuthService.create_profile(profile_data)

# 3) Endpoint do logowania jako admin
@router.post("/admin", response_model=TokenResponse, summary="3) Logowanie jako administrator")
def login_admin(credentials: AdminLoginRequest):
    """
    Logowanie jako administrator.
    Weryfikuje uprawnienia: konto musi mieć rolę 'admin'.
    """
    return AuthService.login_admin(credentials)

# Pobranie aktualnego profilu (me)
@router.get("/me", response_model=UserProfileResponse, summary="Pobierz dane aktualnie zalogowanego profilu")
def get_current_profile(user_payload: dict = Depends(get_current_user_payload)):
    user_id = user_payload.get("sub")
    profile = DatabaseRepository.get_profile_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil nie został znaleziony.")
    return UserProfileResponse(
        id=profile["id"],
        email=profile["email"],
        full_name=profile["full_name"],
        role=profile["role"],
        created_at=profile.get("created_at")
    )
