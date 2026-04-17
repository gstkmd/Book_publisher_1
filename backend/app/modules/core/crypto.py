from cryptography.fernet import Fernet
from app.core.config import settings

def get_cipher() -> Fernet:
    # Important: ENCRYPTION_KEY must be a valid 32-byte url-safe base64 string
    # If it is not configured properly, this will raise an exception during startup
    return Fernet(settings.ENCRYPTION_KEY.encode('utf-8'))

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
