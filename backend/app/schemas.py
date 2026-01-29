from pydantic import BaseModel
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    username: str
    password: str

class MeResponse(BaseModel):
    username: str
    role: str
    region_code: Optional[str] = None

class RegionStatResponse(BaseModel):
    level: str
    region_code: str
    centers_count: int
    pet_positive_rate: float
    risk_score_avg: float

class CenterResponse(BaseModel):
    id: int
    name: str
    region_code: str
    address: str
    phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    level: str
