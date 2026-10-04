from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    full_name: str
    role: str = "user"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


def decode_access_token(token: str, settings: Settings) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    """Mirrors backend/login/router.py::get_current_user_payload (claims: sub, email, role, name)."""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak nagłówka autoryzacji Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials, settings)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token jest nieprawidłowy lub wygasł.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return CurrentUser(
        id=str(payload["sub"]),
        full_name=payload.get("name") or "Anonim",
        role=payload.get("role") or "user",
    )


def get_current_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Mirrors backend/login/router.py::get_current_admin_payload."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora. Tylko administratorzy mogą wykonywać tę operację.",
        )
    return user
