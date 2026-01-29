from __future__ import annotations
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(index=True)  # citizen | district | metro | national
    region_code: Optional[str] = Field(default=None, index=True)  # 담당 지역(예: 시도/시군구 코드)

class Center(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    region_code: str = Field(index=True)  # 지도 코드와 매핑되는 지역 코드
    address: str
    phone: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    level: str = Field(index=True, default="district")  # district | metro

class RegionStat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # level: national(대한민국), sido(시도), sigungu(시군구), eupmyeondong(읍면동) 등
    level: str = Field(index=True)
    region_code: str = Field(index=True)
    as_of: datetime = Field(default_factory=datetime.utcnow, index=True)
    centers_count: int = 0
    pet_positive_rate: float = 0.0
    risk_score_avg: float = 0.0
