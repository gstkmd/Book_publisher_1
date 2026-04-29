from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt
import bcrypt
from cryptography.fernet import Fernet
from app.core.config import settings

ALGORITHM = "HS256"

# For Password Reset tokens
PASSWORD_RESET_ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    # Bcrypt automatically handles the 72-byte limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# --- Encryption for API Keys ---

def encrypt_string(text: str) -> str:
    if not text:
        return ""
    f = Fernet(settings.ENCRYPTION_KEY.encode())
    return f.encrypt(text.encode()).decode()

def decrypt_string(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    try:
        f = Fernet(settings.ENCRYPTION_KEY.encode())
        return f.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return ""

# --- Password Reset Tokens ---

def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=24)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=PASSWORD_RESET_ALGORITHM,
    )
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[PASSWORD_RESET_ALGORITHM])
        if decoded_token["type"] != "password_reset":
            return None
        return decoded_token["sub"]
    except jwt.JWTError:
        return None

