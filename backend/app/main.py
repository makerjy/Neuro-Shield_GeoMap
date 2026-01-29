from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from .config import settings
from .db import init_db, get_session
from .models import User, Center, RegionStat
from .security import verify_password, create_access_token
from .deps import get_current_user, require_roles
from .schemas import Token, MeResponse, RegionStatResponse, CenterResponse

app = FastAPI(title="GeoMap Dementia Center Service API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_allow_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

# ---------- Auth ----------
@app.post("/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/password")
    token = create_access_token(subject=user.username, role=user.role, region_code=user.region_code)
    return Token(access_token=token)

@app.get("/auth/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)):
    return MeResponse(username=user.username, role=user.role, region_code=user.region_code)

# ---------- Geo / Stats ----------
@app.get("/geo/stats", response_model=list[RegionStatResponse])
def get_stats(
    level: str = Query(..., description="national|sido|sigungu|eupmyeondong"),
    parent_code: str | None = Query(None, description="상위 지역 코드 (드릴다운용)"),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    # 권한 예시: metro는 본인 region_code 하위만, district는 본인 region_code만, citizen은 공개 범위만
    q = select(RegionStat).where(RegionStat.level == level)

    if parent_code:
        # 간단 규칙: region_code가 parent_code로 시작한다고 가정 (실서비스에서는 별도 매핑 테이블 권장)
        q = q.where(RegionStat.region_code.startswith(parent_code))

    if user.role == "district":
        if not user.region_code:
            raise HTTPException(400, "district user has no region_code")
        q = q.where(RegionStat.region_code == user.region_code)
    elif user.role == "metro":
        if not user.region_code:
            raise HTTPException(400, "metro user has no region_code")
        q = q.where(RegionStat.region_code.startswith(user.region_code))
    # national, citizen은 전체 허용(여기선 demo)

    rows = session.exec(q).all()
    return [
        RegionStatResponse(
            level=r.level,
            region_code=r.region_code,
            centers_count=r.centers_count,
            pet_positive_rate=r.pet_positive_rate,
            risk_score_avg=r.risk_score_avg,
        )
        for r in rows
    ]

@app.get("/geo/kpi")
def get_kpi(
    level: str = Query("sido", description="sido|sigungu|eupmyeondong"),
    metric: str = Query("risk_score", description="risk_score|elderly_ratio|screening_rate"),
    time: str = Query("2025-09", description="YYYY-MM"),
    session: Session = Depends(get_session),
):
    """
    지오맵 대시보드용 KPI 데이터 엔드포인트
    
    Query Parameters:
    - level: 지역 수준 (sido|sigungu|eupmyeondong)
    - metric: 지표 (risk_score|elderly_ratio|screening_rate)
    - time: 기간 (YYYY-MM 형식)
    
    Response: KPI 레코드 배열 (region_code, region_name, value, change_rate, percentile, status, computed_at)
    """
    # Map metric to RegionStat column
    metric_map = {
        "risk_score": "risk_score_avg",
        "elderly_ratio": "pet_positive_rate",  # PET positive rate as proxy
        "screening_rate": "centers_count",
    }
    
    column_name = metric_map.get(metric, "risk_score_avg")
    
    # Query RegionStat from database
    q = select(RegionStat).where(RegionStat.level == level)
    rows = session.exec(q).all()
    
    if not rows:
        return []
    
    # Convert to KPI response format
    result = []
    for row in rows:
        if column_name == "risk_score_avg":
            value = row.risk_score_avg or 50.0
        elif column_name == "pet_positive_rate":
            value = (row.pet_positive_rate or 0.15) * 100  # Convert to percentage
        else:
            value = float(row.centers_count or 0)
        
        # Simple percentile calculation (0-100 based on position)
        percentile = min(99, max(1, int((value / 100.0) * 100)))
        status = "normal" if percentile < 70 else ("warning" if percentile < 85 else "alert")
        
        result.append({
            "region_code": row.region_code,
            "region_name": row.region_code,  # Will be enriched by frontend
            "value": value,
            "change_rate": 0.0,
            "percentile": percentile,
            "status": status,
            "computed_at": "2025-01-29T00:00:00Z"
        })
    
    return result

@app.get("/centers", response_model=list[CenterResponse])
def list_centers(
    region_code: str | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    q = select(Center)
    if region_code:
        q = q.where(Center.region_code == region_code)

    if user.role == "district" and user.region_code:
        q = q.where(Center.region_code == user.region_code)
    elif user.role == "metro" and user.region_code:
        q = q.where(Center.region_code.startswith(user.region_code))

    rows = session.exec(q).all()
    return [CenterResponse(**r.model_dump()) for r in rows]

@app.get("/centers/{center_id}", response_model=CenterResponse)
def get_center(
    center_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    center = session.get(Center, center_id)
    if not center:
        raise HTTPException(404, "Not found")

    if user.role == "district" and user.region_code and center.region_code != user.region_code:
        raise HTTPException(403, "Forbidden")
    if user.role == "metro" and user.region_code and not center.region_code.startswith(user.region_code):
        raise HTTPException(403, "Forbidden")

    return CenterResponse(**center.model_dump())

# ---------- Admin-only example ----------
@app.get("/admin/users", dependencies=[Depends(require_roles("national"))])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()
