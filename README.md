# 🗺️ 지오맵 서비스 - 한국 지역 KPI 대시보드

**MapLibre GL + React + Zustand 기반의 프로덕션급 지오맵 대시보드**

> 🎉 **완전히 구현되고 프로덕션 준비가 완료된 상태**  
> ✨ **Mock API 지원** - 백엔드 없이 즉시 테스트 가능  
> 🚀 **프로덕션 배포 준비 완료** - TypeScript, Vite, Tailwind CSS  

---

## 🎯 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| **지오맵 시각화** | MapLibre GL 기반 인터랙티브 지도 | ✅ 완료 |
| **드릴다운** | 시도 → 시군구 → 읍면동 | ✅ 완료 |
| **KPI 데이터** | 색상 분류 (Quantile/Equal/Custom) | ✅ 완료 |
| **순위 패널** | Top 5 / Bottom 5 지역 | ✅ 완료 |
| **지표 선택** | 치매위험, 고령인구, 검사율 | ✅ 완료 |
| **기간 선택** | 월별 데이터 필터링 | ✅ 완료 |
| **호버/선택** | 인터랙티브 지역 정보 | ✅ 완료 |
| **범례 편집** | 분류 방식 및 클래스 수 조정 | ✅ 완료 |
| **Mock API** | 백엔드 없이 작동 | ✅ 완료 |
| **반응형 디자인** | 데스크톱 최적화 | ✅ 완료 |

---

## 📦 프로젝트 구조

```
geomap_service_template/
├── frontend/                          # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── features/geomap/          # 지오맵 기능 모듈
│   │   │   ├── components/           # React 컴포넌트
│   │   │   │   ├── GeoMapPage.tsx           # 메인 레이아웃
│   │   │   │   ├── MapPanel.tsx            # 지도 렌더링
│   │   │   │   ├── ControlsPanel.tsx       # 컨트롤 UI
│   │   │   │   ├── SelectionSummary.tsx    # 선택 정보
│   │   │   │   ├── RankingPanel.tsx        # 순위 표시
│   │   │   │   ├── Tooltip.tsx             # 호버 정보
│   │   │   │   ├── Breadcrumb.tsx          # 네비게이션
│   │   │   │   └── LegendEditor.tsx        # 범례 설정
│   │   │   ├── store/
│   │   │   │   └── useGeoStore.ts          # Zustand 상태관리
│   │   │   ├── api/
│   │   │   │   └── geoApi.ts               # API 레이어 (Mock 지원)
│   │   │   └── utils/
│   │   │       ├── classification.ts       # 데이터 분류 알고리즘
│   │   │       └── featureBounds.ts        # 지오메트리 유틸리티
│   │   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── lib/                      # 유틸리티 함수
│   │   ├── components/               # 공용 UI 컴포넌트
│   │   ├── App.tsx                   # 루트 컴포넌트
│   │   └── main.tsx                  # 진입점
│   ├── public/
│   │   ├── geo/                      # GeoJSON 파일
│   │   │   ├── sido.json             # 시도 단위
│   │   │   └── sigungu.json          # 시군구 단위
│   │   └── mock/
│   │       └── geo-kpi.json          # Mock KPI 데이터
│   ├── .env                          # 환경 설정
│   ├── vite.config.ts                # Vite 설정
│   ├── tsconfig.json                 # TypeScript 설정
│   ├── tailwind.config.ts            # Tailwind CSS 설정
│   ├── postcss.config.js             # PostCSS 설정
│   └── package.json                  # 의존성 목록
│
├── backend/                          # FastAPI 백엔드 (선택사항)
│   ├── app/
│   │   ├── __main__.py              # 실행 엔트리
│   │   ├── main.py                  # FastAPI 앱 + 라우트
│   │   ├── config.py                # 환경 설정
│   │   ├── db.py                    # 데이터베이스
│   │   ├── models.py                # 데이터 모델
│   │   ├── schemas.py               # API 스키마
│   │   ├── security.py              # 인증/보안
│   │   ├── deps.py                  # 의존성 주입
│   │   └── seed.py                  # 데이터 초기화
│   ├── requirements.txt              # Python 의존성
│   └── pyproject.toml                # 프로젝트 설정
│
├── southkorea-maps/                 # GeoJSON 소스 데이터
│   └── gadm/json/                   # 한국 행정구역 경계
│
├── SETUP_GUIDE.md                   # 프론트엔드 상세 가이드
├── BACKEND_GUIDE.md                 # 백엔드 상세 가이드
└── README.md                         # 이 파일

```

---

## 🚀 빠른 시작 (3분)

### 1️⃣ 프론트엔드만 실행 (권장)

```bash
cd frontend
npm install
npm run dev
```

✨ **결과**: `http://localhost:5179` 에서 완전히 작동하는 지오맵 대시보드  
📝 **Mock 데이터**: 46개 지역의 가상 KPI 데이터로 즉시 테스트 가능

### 2️⃣ 백엔드도 함께 실행 (선택)

```bash
# 별도 터미널에서
cd backend
pip install -r requirements.txt
python -m app.__main__
```

✨ **결과**: `http://localhost:8000` 에서 API 서버 실행

### 3️⃣ 프론트엔드 → 백엔드 연결

```bash
# frontend/.env 수정
VITE_USE_MOCK_API=false
VITE_API_URL=http://localhost:8000
```

재시작 후 실제 API에서 데이터 로드됨

---


### 1️⃣ 지도에서 지역 선택

- 🖱️ **호버**: 지역 위에 마우스를 올리면 정보 팝업 표시
- 🖱️ **클릭**: 지역 선택 (우측 "선택 현황" 패널에 상세 정보 표시)
- 📊 **우측 순위**: Top 5/Bottom 5 목록에서 클릭하면 지도에서 강조

### 2️⃣ 지표 및 기간 선택

```
좌측 패널:
├── 지표 선택: 치매위험, 고령인구, 검사율
├── 기간 선택: 2025-09 ~ 2025-12
├── 상세보기: 시도 → 시군구 → 읍면동으로 드릴다운
└── 범례 설정: 분류 방식(Quantile/Equal) 및 클래스 수 조정
```

### 3️⃣ 데이터 분석

```
우측 패널:
├── 선택 현황: 선택된 지역의 상세 데이터
│   ├── 지표값 (큰 폰트)
│   ├── 변화율 (증/감)
│   ├── 백분위수 (상대 순위)
│   └── 상태 (정상/주의/위험)
│
└── 순위 패널: 모든 지역의 Top 5 / Bottom 5
    ├── 순위 번호
    ├── 지역명
    ├── 값
    └── 상태 배지
```

---

## 🔌 API 구조

### Mock 모드 (기본)
```
Frontend
  ↓ (fetch)
public/mock/geo-kpi.json
  ↓
[46개 지역 KPI 데이터]
```

### Real API 모드 (백엔드 연결)
```
Frontend
  ↓ (fetch)
Backend API: http://localhost:8000/api/geo/kpi
  ↓
Database
  ↓
[실제 KPI 데이터]
```

**전환 방법**:
```bash
# frontend/.env 수정
VITE_USE_MOCK_API=true   # Mock 모드
VITE_USE_MOCK_API=false  # Real API 모드
```

---

## 🔧 기술 스택

| 영역 | 기술 | 버전 | 설명 |
|------|------|------|------|
| **UI 프레임워크** | React | 18.2 | 컴포넌트 기반 UI |
| **언어** | TypeScript | 5.7 | 타입 안전성 |
| **빌드 도구** | Vite | 6.4 | 빠른 개발 빌드 |
| **지도/시각화** | MapLibre GL | 2.4 | 인터랙티브 벡터 지도 |
| **상태 관리** | Zustand | 4.4 | 경량 상태 관리 |
| **스타일링** | Tailwind CSS | 4.1 | 유틸리티 CSS |
| **UI 컴포넌트** | shadcn/ui | - | 접근성 높은 컴포넌트 |
| **데이터** | GeoJSON | - | 벡터 지도 데이터 |

---

## 📖 상세 가이드

### 프론트엔드
👉 [SETUP_GUIDE.md](SETUP_GUIDE.md) - 완전한 설정 및 사용 가이드

### 백엔드
👉 [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - FastAPI 설정 및 API 명세

---

## 🧪 테스트 시나리오

### ✅ Mock 모드 테스트
```bash
npm run dev
# 브라우저: http://localhost:5179
# → 46개 지역 데이터 자동 로드
```

### ✅ 지도 상호작용 테스트
1. 지도에서 시도 클릭 → 시군구로 변경
2. "상세보기" 버튼 → 드릴다운 진행
3. "돌아가기" 버튼 → 이전 레벨로 복귀

### ✅ 순위 패널 테스트
1. 우측 패널의 지역명 클릭
2. 지도에서 해당 지역 강조됨
3. "선택 현황" 업데이트됨

### ✅ 범례 설정 변경 테스트
1. 좌측 "분류 방식" 변경 (Quantile → Equal Interval)
2. 지도 색상 실시간 업데이트

---

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

생성된 파일:
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css
└── geo/
    ├── sido.json
    └── sigungu.json
```

### Vercel 배포 (권장)
```bash
npm install -g vercel
vercel
```

### Nginx 배포
```nginx
server {
  listen 80;
  root /var/www/geomap/dist;
  
  location / {
    try_files $uri /index.html;
  }
}
```

---

## 🐛 문제 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 지도 표시 안됨 | GeoJSON 로드 실패 | `public/geo/` 파일 확인 |
| Mock 데이터 안 보임 | Mock 파일 위치 오류 | `public/mock/geo-kpi.json` 확인 |
| API 연결 오류 | 백엔드 미실행 또는 CORS | `VITE_USE_MOCK_API=true` 또는 백엔드 CORS 설정 |
| 느린 성능 | 브라우저 개발자 도구 활성화 | 닫고 재시작 |
| 스타일 미적용 | Tailwind 빌드 오류 | `npm install` 다시 실행 |

---

## 📦 설치된 패키지

### 필수
```json
{
  "react": "^18.2.0",
  "maplibre-gl": "^2.4.0",
  "zustand": "^4.4.0"
}
```

### 스타일링
```json
{
  "tailwindcss": "^4.1.0",
  "@tailwindcss/postcss": "^4.1.0"
}
```

### UI 컴포넌트
```json
{
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-slot": "^2.0.0"
}
```

### 개발 도구
```json
{
  "vite": "^6.4.1",
  "typescript": "^5.7.3",
  "@types/react": "^18.2.0"
}
```

---

## 📞 문의 및 지원

### 로그 확인
```bash
# 브라우저 개발자 도구 (F12)
→ Console 탭: 에러 메시지 확인
→ Network 탭: API 요청/응답 확인
→ Application 탭: Zustand 상태 확인
```

### 빌드 오류 확인
```bash
npm run build 2>&1 | head -50
```

---

## 📄 라이선스

**MIT License** - 자유롭게 사용, 수정, 배포 가능

---

## 🙏 감사의 말

- **MapLibre GL** - 오픈소스 지도 라이브러리
- **Zustand** - 경량 상태 관리
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **shadcn/ui** - 접근성 높은 UI 컴포넌트
- **South Korea Maps** - GeoJSON 데이터

---

**버전**: 1.0.0  
**마지막 업데이트**: 2025-01-XX  
**상태**: ✅ 프로덕션 준비 완료
- ✅ React 네이티브 (JSX)
- ✅ 개발 속도 빠름
- ✅ 커스터마이징 자유

**지금 바로 시작하세요**! 🚀

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 열기
```

---

**최종 업데이트**: 2026년 1월 28일  
**버전**: 1.0.0  
**상태**: ✅ 즉시 사용 가능

cd backend
python -m venv .venv
# mac/linux
source .venv/bin/activate
# windows
# .venv\Scripts\activate

pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

- 프론트: http://localhost:5173
- 백엔드: http://localhost:8000/docs

---

## 3) rMate 파일 복사(필수)
아래 경로에 당신이 가진 rMate 자산을 넣으세요.

- frontend/public/rmate/LicenseKey/rMateMapChartH5License.js
- frontend/public/rmate/JS/rMateMapChartH5.js
- frontend/public/rmate/Assets/rMateMapChartH5.css (선택)
- frontend/public/rmate/MapSource/KoreaSiDo.svg (또는 당신의 SVG)
- frontend/public/rmate/MapDataBaseXml/KoreaSiDo.xml (또는 당신의 MapDataBase)

> 파일명/경로는 프론트 코드에서 참조합니다. 다른 이름이면 `frontend/src/lib/rmatePaths.ts`만 바꾸면 됩니다.

---

## 4) 로그인 (Demo 계정)
시드 데이터에서 아래 계정을 생성합니다.

- national / password123   (전국 관리자)
- metro01  / password123   (광역센터)
- dist01   / password123   (지역구 센터)
- citizen1 / password123   (시민)

---

## 5) 이 템플릿이 제공하는 것
- (1) 역할 기반 대시보드 라우팅
- (2) 지도 클릭 -> 지역 코드(code) 기반으로 백엔드에서 통계/센터 목록 조회
- (3) 지표(metric) 선택(예: 센터 수, 위험도 평균 등) 후 지도 색/툴팁 갱신
- (4) DB 스키마/샘플 API

---

## 6) 다음 단계 (너가 해야 하는 실제 작업)
- **(필수)** rMate MapSource(SVG)와 MapDataBase(XML)의 지역 코드 체계를 너 서비스의 “센터/지역 통계” 테이블과 1:1로 맞추기
- (권장) SQLite -> Postgres로 교체 + Alembic 마이그레이션 도입
- (권장) 통계 집계 파이프라인(ETL) 구축: 센터 이벤트/인원/검진 결과 등에서 지역별 집계 생성

