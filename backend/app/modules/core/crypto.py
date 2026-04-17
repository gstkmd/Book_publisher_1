import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

def get_cipher() -> Fernet:
    # Derive a valid 32-byte url-safe base64 key from any string provided in ENCRYPTION_KEY
    # This ensures consistency even if the user provides a simple password
    key_material = settings.ENCRYPTION_KEY.encode('utf-8')
    hashed = hashlib.sha256(key_material).digest()
    fernet_key = base64.urlsafe_b64encode(hashed)
    return Fernet(fernet_key)

def encrypt_value(value: str) -> str:
    if not value:
        return value
    cipher = get_cipher()
    encrypted = cipher.encrypt(value.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_value(encrypted_value: str) -> str:
    if not encrypted_value:
        return encrypted_value
    cipher = get_cipher()
    decrypted = cipher.decrypt(encrypted_value.encode('utf-8'))
    return decrypted.decode('utf-8')
