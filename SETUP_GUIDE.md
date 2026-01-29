# 지오맵 서비스 설정 가이드

## 📋 프로젝트 개요

이 프로젝트는 한국 지역의 KPI 데이터를 시각화하는 지오맵 대시보드입니다. MapLibre GL을 사용한 인터랙티브 지도와 Zustand 상태 관리, Tailwind CSS 스타일링이 적용되어 있습니다.

### 핵심 기능
- ✅ 인터랙티브 지도 (시도 → 시군구 → 읍면동 드릴다운)
- ✅ KPI 데이터 시각화 (색상 분류: Quantile, Equal Interval, Custom)
- ✅ 실시간 순위 패널 (Top 5 / Bottom 5)
- ✅ 지역 선택 및 호버 인터랙션
- ✅ Mock API 지원 (백엔드 없이 테스트 가능)
- ✅ 반응형 대시보드 레이아웃

## 🚀 빠른 시작

### 1. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

- 자동으로 `http://localhost:5179` (또는 다음 사용 가능 포트)에서 실행됩니다.
- `.env` 파일의 `VITE_USE_MOCK_API=true` 설정으로 백엔드 없이 동작합니다.

### 2. 백엔드 실행 (선택사항)

```bash
cd backend
pip install -r requirements.txt
python -m app.__main__
```

- FastAPI 기반 백엔드
- 기본 포트: `http://localhost:8000`
- `/api/geo/kpi` 엔드포인트로 실제 데이터 제공

## 📁 프로젝트 구조

```
frontend/
├── public/
│   ├── geo/
│   │   ├── sido.json          # 시도 단위 GeoJSON
│   │   └── sigungu.json       # 시군구 단위 GeoJSON
│   └── mock/
│       └── geo-kpi.json       # Mock KPI 데이터 (46개 지역)
├── src/
│   └── features/geomap/
│       ├── components/        # React 컴포넌트
│       │   ├── GeoMapPage.tsx     # 메인 페이지 레이아웃
│       │   ├── MapPanel.tsx       # 지도 렌더링
│       │   ├── ControlsPanel.tsx  # 컨트롤 패널
│       │   ├── SelectionSummary.tsx
│       │   ├── RankingPanel.tsx   # 순위 표시
│       │   ├── Tooltip.tsx        # 호버 정보
│       │   ├── Breadcrumb.tsx     # 네비게이션
│       │   └── LegendEditor.tsx   # 범례 설정
│       ├── store/
│       │   └── useGeoStore.ts     # Zustand 상태 관리
│       ├── api/
│       │   └── geoApi.ts          # API 레이어 (Mock 지원)
│       └── utils/
│           ├── classification.ts  # 데이터 분류 알고리즘
│           └── featureBounds.ts   # 지오메트리 유틸리티
├── .env                        # 환경 설정
└── vite.config.ts             # Vite 설정
```

## 🔧 설정 파일

### `.env` (프론트엔드)

```env
# Mock API 사용 여부 (true: Mock, false: 실제 API)
VITE_USE_MOCK_API=true

# 백엔드 API URL (Mock=false일 때 사용)
VITE_API_URL=http://localhost:8000
VITE_API_BASE_PATH=/api
```

### Mock 데이터 구조 (`public/mock/geo-kpi.json`)

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
  },
  ...
]
```

### GeoJSON 구조 (`public/geo/sido.json`, `sigungu.json`)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "region_code": "11",
        "region_name": "서울특별시",
        "parent_code": null
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    },
    ...
  ]
}
```

## 📊 Zustand 상태 구조

```typescript
{
  // 현재 선택 상태
  time: string                    // 시간 선택 (예: "2025-09")
  metric: string                  // 지표 선택 (예: "risk_score")
  level: "nation" | "sido" | "sigungu" | "eup"
  regionCode: string | null       // 선택된 지역 코드
  regionPath: {                   // 드릴다운 경로
    sido: string
    sigungu: string
    eup: string
  }
  
  // 범례 설정
  legendConfig: {
    method: "quantile" | "equal" | "custom"
    classes: number
    breaks: number[]
  }
  
  // 데이터 상태
  kpiRecords: KPIRecord[]
  loading: boolean
  error: string | null
  computedAt: string | null
  
  // UI 상태
  hoveredRegionCode: string | null
}
```

## 🎨 UI 개선 사항

### 구현된 기능
1. **향상된 로딩 상태**
   - Spinner 애니메이션 포함
   - 배경 블러 효과
   
2. **개선된 에러 표시**
   - 아이콘 포함 에러 메시지
   - 사용자 친화적 텍스트

3. **우아한 디자인**
   - Tailwind CSS 4 그래디언트
   - 상태별 색상 코딩 (정상/주의/위험)
   - 카드 기반 레이아웃

4. **순위 패널 개선**
   - 순위 번호 표시
   - 상태 배지 (상태별 색상)
   - 호버 효과 강화

5. **범례 에디터 개선**
   - 색상 미리보기
   - 분류 방식 설명
   - 브레이크 값 시각화

## 📱 반응형 레이아웃

```
┌─────────────────────────────────────────────┐
│  좌측 (280px)  │  중앙 (1fr)  │  우측 (320px) │
├─────────────────────────────────────────────┤
│ · 지표 선택     │              │ · 선택 요약   │
│ · 기간 선택     │  지도 표시   │ · 순위 패널   │
│ · 드릴다운      │              │              │
│ · 경로표시     │              │              │
│ · 범례 설정     │              │              │
└─────────────────────────────────────────────┘
```

## 🔌 API 엔드포인트

### Mock API
- 파일 기반: `/mock/geo-kpi.json` (자동 로드)
- 데이터 필터링: 클라이언트 측 처리

### 실제 API (백엔드)
```
GET /api/geo/kpi?level=sido&metric=risk_score&time=2025-09
```

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

## 🧪 테스트 시나리오

### 1. Mock 모드 테스트
```bash
# .env의 VITE_USE_MOCK_API=true 확인
npm run dev
# 브라우저에서 http://localhost:5179 접속
# → 46개 지역의 Mock 데이터가 자동 로드됨
```

### 2. 지도 상호작용
- 🖱️ **호버**: 지역 위에 마우스 올리면 정보 표시
- 🖱️ **클릭**: 지역 선택 (우측 "선택 현황" 업데이트)
- 📊 **순위**: 우측 패널의 지역을 클릭하면 지도에 선택됨

### 3. 드릴다운 테스트
1. 지도에서 시도 선택
2. "상세 보기" 버튼 클릭 → 시군구 레벨로 변경
3. "돌아가기" 버튼으로 복귀

### 4. 범례 설정 변경
- 분류 방식: Quantile / Equal Interval / Custom 전환
- 클래스 수: 3~7개 조정
- 지도 색상이 실시간 업데이트됨

## 🐛 문제 해결

### 지도가 표시되지 않음
1. GeoJSON 파일 확인: `public/geo/sido.json`, `sigungu.json` 존재 확인
2. 브라우저 콘솔 확인: 네트워크 에러 확인
3. Vite 서버 재시작

### Mock 데이터 로드 실패
1. `public/mock/geo-kpi.json` 존재 확인
2. `.env`의 `VITE_USE_MOCK_API=true` 확인
3. 브라우저 개발자 도구 → Network 탭에서 요청 확인

### 실제 API 연결 오류
1. 백엔드 서버 실행 확인
2. `.env`의 `VITE_API_URL` 올바른지 확인
3. `VITE_USE_MOCK_API=false` 설정
4. CORS 에러 시 백엔드 CORS 설정 확인

## 📦 의존성

### 주요 라이브러리
- `react` 18.2.0
- `vite` 6.4.1
- `typescript` 5.7.3
- `tailwindcss` 4.1.0
- `maplibre-gl` 2.4.0
- `zustand` 4.4.0

### UI 컴포넌트
- `@radix-ui/*` (Select, Slot)
- `shadcn/ui` (Card, Button)

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

### 배포 체크리스트
- [ ] `.env` 프로덕션 설정 확인
- [ ] `VITE_USE_MOCK_API=false` 설정
- [ ] 백엔드 API URL 확인
- [ ] 빌드 성공 확인
- [ ] 정적 파일 서빙 확인 (Nginx, S3 등)

## 📞 지원

### 로그 확인
```bash
# Vite 개발 서버 로그
npm run dev

# 브라우저 콘솔 (F12)
# → Application 탭: Zustand 상태 확인
# → Network 탭: API 요청 확인
# → Console 탭: 에러 메시지 확인
```

## 📄 라이선스

MIT License

---

**마지막 업데이트**: 2025-01-XX
**버전**: 1.0.0 (프로덕션 준비 완료)
