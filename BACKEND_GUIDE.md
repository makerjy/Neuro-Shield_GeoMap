# 백엔드 설치 및 실행 가이드

## 📋 프로젝트 개요

FastAPI 기반의 지오맵 서비스 백엔드입니다. 인증, 권한 관리, 지역 통계 데이터 제공 기능을 포함합니다.

## 🚀 빠른 시작

### 1. 환경 준비

```bash
# Python 3.9+ 확인
python --version

# 가상 환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows
```

### 2. 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

### 3. 서버 실행

```bash
# 개발 모드
python -m app.__main__

# 또는 직접 실행
python -m uvicorn app.main:app --reload --port 8000
```

서버가 `http://localhost:8000`에서 실행됩니다.

## 📡 API 엔드포인트

### 인증 (Auth)

#### 로그인
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user&password=password
```

응답:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

#### 사용자 정보 조회
```http
GET /auth/me
Authorization: Bearer <token>
```

응답:
```json
{
  "username": "user",
  "role": "citizen",
  "region_code": null
}
```

### 지역 통계 (Stats)

#### 지역별 통계 조회
```http
GET /geo/stats?level=sido&parent_code=11
Authorization: Bearer <token>
```

파라미터:
- `level`: "national", "sido", "sigungu", "eupmyeondong"
- `parent_code`: (선택) 상위 지역 코드로 필터링

응답:
```json
[
  {
    "level": "sido",
    "region_code": "11",
    "centers_count": 42,
    "pet_positive_rate": 15.5,
    "risk_score_avg": 72.3
  }
]
```

### 지오맵 KPI (GeoMap)

#### KPI 데이터 조회 ⭐ (프론트엔드용)
```http
GET /api/geo/kpi?level=sido&metric=risk_score&time=2025-09
```

파라미터:
- `level`: "sido", "sigungu", "eupmyeondong"
- `metric`: "risk_score", "elderly_ratio", "screening_rate"
- `time`: "YYYY-MM" 형식

응답:
```json
[
  {
    "region_code": "11",
    "region_name": "서울특별시",
    "value": 75.5,
    "change_rate": 2.3,
    "percentile": 85,
    "status": "normal",
    "computed_at": "2025-01-01T00:00:00Z"
  }
]
```

### 센터 관리 (Centers)

#### 센터 목록 조회
```http
GET /centers?region_code=11
Authorization: Bearer <token>
```

응답:
```json
[
  {
    "id": 1,
    "name": "서울센터",
    "address": "서울시 강남구",
    "region_code": "11",
    "lat": 37.4979,
    "lon": 127.0276
  }
]
```

#### 센터 상세 조회
```http
GET /centers/1
Authorization: Bearer <token>
```

### 헬스 체크

```http
GET /health
```

응답:
```json
{"ok": true}
```

## 🔐 권한 시스템

### 사용자 역할 (Roles)

| 역할 | 설명 | 데이터 접근 범위 |
|------|------|-----------------|
| `citizen` | 일반 시민 | 공개 데이터만 |
| `district` | 구청 관계자 | 해당 구청 데이터만 |
| `metro` | 광역시청 관계자 | 해당 광역시 데이터만 |
| `national` | 중앙 정부 | 전국 데이터 |

### 테스트 계정

```
# national (중앙)
username: admin
password: admin123
role: national

# metro (서울시청)
username: metro_11
password: metro123
role: metro
region_code: 11

# district (강남구청)
username: district_11040
password: district123
role: district
region_code: 11040
```

## 📊 데이터베이스 스키마

### 테이블 구조

```sql
-- 사용자
CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  username VARCHAR UNIQUE,
  password_hash VARCHAR,
  role VARCHAR,
  region_code VARCHAR
);

-- 센터
CREATE TABLE center (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  address VARCHAR,
  region_code VARCHAR,
  lat FLOAT,
  lon FLOAT
);

-- 지역 통계
CREATE TABLE region_stat (
  id INTEGER PRIMARY KEY,
  level VARCHAR,
  region_code VARCHAR,
  centers_count INTEGER,
  pet_positive_rate FLOAT,
  risk_score_avg FLOAT
);
```

## ⚙️ 설정

### 환경 변수 (`.env`)

```env
# 데이터베이스
DATABASE_URL=sqlite:///./geomap.db

# CORS 설정
CORS_ALLOW_ORIGINS=http://localhost:5173 http://localhost:5179 http://localhost:3000

# JWT 보안
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## 🧪 테스트

### cURL로 테스트

```bash
# 1. 로그인
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# 결과에서 access_token 복사

# 2. 헬더에 토큰 추가하여 요청
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <your-token>"

# 3. 지오맵 KPI 데이터 조회 (인증 불필요)
curl "http://localhost:8000/api/geo/kpi?level=sido&metric=risk_score&time=2025-09"
```

### Python으로 테스트

```python
import requests

# 로그인
response = requests.post(
    "http://localhost:8000/auth/login",
    data={"username": "admin", "password": "admin123"}
)
token = response.json()["access_token"]

# KPI 데이터 조회
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/geo/kpi",
    params={"level": "sido", "metric": "risk_score", "time": "2025-09"},
    headers=headers
)
print(response.json())
```

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── __main__.py       # 실행 엔트리 포인트
│   ├── main.py          # FastAPI 애플리케이션 및 라우트
│   ├── config.py        # 환경 설정
│   ├── db.py            # 데이터베이스 연결
│   ├── models.py        # SQLModel 모델
│   ├── schemas.py       # Pydantic 스키마
│   ├── security.py      # 인증 및 JWT
│   ├── deps.py          # 의존성 주입
│   └── seed.py          # 데이터 초기화
├── requirements.txt     # 의존성 목록
└── pyproject.toml       # 프로젝트 설정
```

## 🐛 문제 해결

### "Address already in use" 오류

```bash
# 다른 포트 사용
python -m uvicorn app.main:app --reload --port 8001
```

### CORS 에러

1. 프론트엔드 URL 확인: 보통 `http://localhost:5179`
2. `.env`의 `CORS_ALLOW_ORIGINS` 업데이트
3. 서버 재시작

### 데이터베이스 오류

```bash
# 데이터베이스 초기화 (테스트 데이터 포함)
rm geomap.db
python -m app.seed
```

## 🚀 배포

### Docker 빌드

```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app ./app
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Gunicorn으로 실행

```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📚 API 문서

### Swagger UI
```
http://localhost:8000/docs
```

### ReDoc
```
http://localhost:8000/redoc
```

## 📞 기술 스택

- **프레임워크**: FastAPI 0.104
- **ORM**: SQLModel
- **데이터베이스**: SQLite (개발), PostgreSQL (배포)
- **인증**: JWT
- **서버**: Uvicorn

## 📄 라이선스

MIT License

---

**마지막 업데이트**: 2025-01-XX
**버전**: 1.0.0 (프로덕션 준비 완료)
