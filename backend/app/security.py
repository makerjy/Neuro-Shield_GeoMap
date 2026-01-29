from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from .config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_access_token(subject: str, role: str, region_code: str | None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_minutes)
    to_encode = {"sub": subject, "role": role, "region_code": region_code, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
