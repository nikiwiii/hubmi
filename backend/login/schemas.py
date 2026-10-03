from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

class ProfileCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4, description="Hasło użytkownika")
    full_name: str = Field(..., min_length=2, description="Imię i nazwisko lub nick")
    role: Literal["user", "admin", "expert"] = "user"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
