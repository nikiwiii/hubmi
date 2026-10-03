from fastapi import HTTPException, status
from typing import Dict, Any
from config import hash_password, verify_password, create_access_token
from supabase_client import DatabaseRepository
from login.schemas import ProfileCreate, UserLoginRequest, AdminLoginRequest, TokenResponse, UserProfileResponse

class AuthService:
    @staticmethod
    def create_profile(data: ProfileCreate) -> UserProfileResponse:
        # Check if already exists
        existing = DatabaseRepository.get_profile_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Konto z adresem e-mail '{data.email}' już istnieje."
            )
        
        hashed = hash_password(data.password)
        new_profile = {
            "email": data.email,
            "password_hash": hashed,
            "full_name": data.full_name,
            "role": data.role
        }
        created = DatabaseRepository.create_profile(new_profile)
        return UserProfileResponse(
            id=created["id"],
            email=created["email"],
            full_name=created["full_name"],
            role=created["role"],
            created_at=created.get("created_at")
        )

    @staticmethod
    def login_user(data: UserLoginRequest) -> TokenResponse:
        user = DatabaseRepository.get_profile_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy adres e-mail lub hasło."
            )
        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy adres e-mail lub hasło."
            )

        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["full_name"]
        })
        profile = UserProfileResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            created_at=user.get("created_at")
        )
        return TokenResponse(access_token=token, token_type="bearer", user=profile)

    @staticmethod
    def login_admin(data: AdminLoginRequest) -> TokenResponse:
        user = DatabaseRepository.get_profile_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy adres e-mail lub hasło administratora."
            )
        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy adres e-mail lub hasło administratora."
            )
        if user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Dostęp zabroniony: Użytkownik nie posiada uprawnień administratora."
            )

        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": "admin",
            "name": user["full_name"]
        })
        profile = UserProfileResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            created_at=user.get("created_at")
        )
        return TokenResponse(access_token=token, token_type="bearer", user=profile)
