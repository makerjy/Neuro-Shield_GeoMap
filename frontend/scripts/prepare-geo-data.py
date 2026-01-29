#!/usr/bin/env python3
"""
준비 스크립트: GeoJSON 데이터와 Mock KPI JSON 생성
"""
import json
import random
from pathlib import Path
from datetime import datetime

# 기본 경로
ROOT = Path(__file__).parent.parent.parent
KOREA_JSON = ROOT / 'korea.json'
GEO_DIR = ROOT / 'frontend' / 'public' / 'geo'
MOCK_DIR = ROOT / 'frontend' / 'public' / 'mock'

# 한글 주소명
SIDO_NAMES = {
    '11': '서울특별시',
    '26': '부산광역시',
    '27': '대구광역시',
    '28': '인천광역시',
    '29': '광주광역시',
    '30': '대전광역시',
    '31': '울산광역시',
    '41': '경기도',
    '42': '강원도',
    '43': '충청북도',
    '44': '충청남도',
    '45': '전라북도',
    '46': '전라남도',
    '47': '경상북도',
    '48': '경상남도',
    '50': '제주도',
}

SIGUNGU_MAP = {
    '11': [  # 서울
        ('11010', '종로구'),
        ('11020', '중구'),
        ('11030', '용산구'),
        ('11040', '성동구'),
        ('11050', '광진구'),
        ('11060', '동대문구'),
        ('11070', '중랑구'),
        ('11080', '성북구'),
        ('11090', '강북구'),
        ('11100', '도봉구'),
        ('11110', '노원구'),
        ('11120', '은평구'),
        ('11130', '서대문구'),
        ('11140', '마포구'),
        ('11150', '양천구'),
        ('11160', '강서구'),
        ('11170', '구로구'),
        ('11180', '금천구'),
        ('11190', '영등포구'),
        ('11200', '동작구'),
        ('11210', '관악구'),
        ('11220', '서초구'),
        ('11230', '강남구'),
        ('11240', '송파구'),
        ('11250', '강동구'),
    ],
    '26': [  # 부산
        ('26110', '중구'),
        ('26140', '서구'),
        ('26170', '동구'),
        ('26200', '영도구'),
        ('26210', '부산진구'),
        ('26220', '동래구'),
        ('26230', '남구'),
        ('26240', '북구'),
        ('26250', '해운대구'),
        ('26260', '사하구'),
        ('26270', '금정구'),
        ('26280', '강서구'),
        ('26290', '연제구'),
        ('26300', '수영구'),
        ('26310', '사상구'),
        ('26320', '기장군'),
    ],
}

def create_sample_geojson(properties_list):
    """샘플 지오메트리와 함께 GeoJSON 생성"""
    features = []
    # 간단한 폴리곤 좌표 (한반도 대략적 위치)
    coord_base = {
        '11': [127.0, 37.5],  # 서울
        '26': [129.0, 35.1],  # 부산
        '27': [128.6, 35.9],  # 대구
        '28': [126.7, 37.5],  # 인천
        '41': [127.1, 37.3],  # 경기
        '42': [128.3, 37.8],  # 강원
        '43': [127.5, 36.8],  # 충북
        '44': [127.0, 36.3],  # 충남
        '45': [127.1, 35.8],  # 전북
        '46': [127.0, 34.8],  # 전남
        '47': [129.1, 36.5],  # 경북
        '48': [128.4, 35.4],  # 경남
    }
    
    for props in properties_list:
        code = props['region_code']
        base_lon, base_lat = coord_base.get(code[:2], [127.0, 37.0])
        offset_x = random.uniform(-0.5, 0.5)
        offset_y = random.uniform(-0.5, 0.5)
        
        # 간단한 직사각형 폴리곤
        lon, lat = base_lon + offset_x, base_lat + offset_y
        feature = {
            'type': 'Feature',
            'properties': props,
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [lon - 0.25, lat - 0.25],
                    [lon + 0.25, lat - 0.25],
                    [lon + 0.25, lat + 0.25],
                    [lon - 0.25, lat + 0.25],
                    [lon - 0.25, lat - 0.25],
                ]]
            }
        }
        features.append(feature)
    
    return {
        'type': 'FeatureCollection',
        'features': features
    }

def main():
    GEO_DIR.mkdir(parents=True, exist_ok=True)
    MOCK_DIR.mkdir(parents=True, exist_ok=True)
    
    print("🔄 GeoJSON 데이터 생성 중...")
    
    # 1. SIDO 레벨 GeoJSON
    sido_features = []
    sido_kpi = []
    
    for code, name in SIDO_NAMES.items():
        sido_features.append({
            'region_code': code,
            'region_name': name,
            'parent_code': None,
        })
        
        # Mock KPI 데이터
        value = random.uniform(40, 85)
        sido_kpi.append({
            'region_code': code,
            'region_name': name,
            'value': round(value, 1),
            'change_rate': round(random.uniform(-5, 5), 1),
            'percentile': random.randint(10, 90),
            'status': 'critical' if value < 50 else 'warning' if value < 70 else 'normal',
            'computed_at': datetime.now().isoformat() + 'Z',
        })
    
    sido_geojson = create_sample_geojson(sido_features)
    with open(GEO_DIR / 'sido.json', 'w', encoding='utf-8') as f:
        json.dump(sido_geojson, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(sido_features)} Sido GeoJSON 생성: {GEO_DIR / 'sido.json'}")
    
    # 2. SIGUNGU 레벨 GeoJSON
    sigungu_features = []
    sigungu_kpi = []
    all_sigungu = []
    
    for sido_code in SIDO_NAMES.keys():
        if sido_code in SIGUNGU_MAP:
            for sig_code, sig_name in SIGUNGU_MAP[sido_code]:
                sigungu_features.append({
                    'region_code': sig_code,
                    'region_name': sig_name,
                    'parent_code': sido_code,
                })
                all_sigungu.append({
                    'region_code': sig_code,
                    'region_name': sig_name,
                    'value': round(random.uniform(40, 85), 1),
                    'change_rate': round(random.uniform(-5, 5), 1),
                    'percentile': random.randint(10, 90),
                    'status': 'critical' if random.random() < 0.2 else 'warning' if random.random() < 0.4 else 'normal',
                    'computed_at': datetime.now().isoformat() + 'Z',
                })
        else:
            # 다른 지역도 예시로 추가
            for i in range(3):
                code = f"{sido_code}{(i+1)*10:02d}"
                name = f"{SIDO_NAMES[sido_code]} 시군{i+1}"
                sigungu_features.append({
                    'region_code': code,
                    'region_name': name,
                    'parent_code': sido_code,
                })
                all_sigungu.append({
                    'region_code': code,
                    'region_name': name,
                    'value': round(random.uniform(40, 85), 1),
                    'change_rate': round(random.uniform(-5, 5), 1),
                    'percentile': random.randint(10, 90),
                    'status': 'critical' if random.random() < 0.2 else 'warning' if random.random() < 0.4 else 'normal',
                    'computed_at': datetime.now().isoformat() + 'Z',
                })
    
    sigungu_geojson = create_sample_geojson(sigungu_features)
    with open(GEO_DIR / 'sigungu.json', 'w', encoding='utf-8') as f:
        json.dump(sigungu_geojson, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(sigungu_features)} Sigungu GeoJSON 생성: {GEO_DIR / 'sigungu.json'}")
    
    # 3. 통합 Mock KPI JSON (모든 레벨)
    all_kpi = sido_kpi + all_sigungu
    with open(MOCK_DIR / 'geo-kpi.json', 'w', encoding='utf-8') as f:
        json.dump(all_kpi, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(all_kpi)}개 Mock KPI 레코드 생성: {MOCK_DIR / 'geo-kpi.json'}")
    
    print("\n✨ 모든 데이터 준비 완료!")
    print(f"  - Sido: {len(sido_features)}개 지역")
    print(f"  - Sigungu: {len(sigungu_features)}개 지역")
    print(f"  - Total KPI: {len(all_kpi)}개 레코드")

if __name__ == '__main__':
    main()
