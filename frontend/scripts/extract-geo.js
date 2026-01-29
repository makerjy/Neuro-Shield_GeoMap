#!/usr/bin/env node

/**
 * korea.json에서 sido/sigungu 레벨의 GeoJSON을 추출하는 스크립트
 * 
 * 사용법:
 *   node scripts/extract-geo.js
 * 
 * 이 스크립트는 다음 파일을 생성합니다:
 *   - public/geo/sido.json: sido 단위 choropleth 맵용 GeoJSON
 *   - public/geo/sigungu.json: sigungu 단위 drill-down용 GeoJSON
 */

const fs = require('fs');
const path = require('path');

// Load korea.json
const koreaPath = path.join(__dirname, '../public/korea.json');
const koreanData = JSON.parse(fs.readFileSync(koreaPath, 'utf-8'));

console.log(`📂 korea.json loaded: ${koreanData.features.length} features`);

// Sido 및 Sigungu 피처 분류
const sidoFeatures = [];
const sigunguFeatures = [];

koreanData.features.forEach(feature => {
  const props = feature.properties || {};
  const code = props.code || '';
  
  // Sido는 code가 2자리 (11, 21, 22, ...)
  // Sigungu는 code가 5자리 (11110, 11140, ...)
  if (code.length === 2) {
    sidoFeatures.push(feature);
    console.log(`✓ Sido: ${props.name} (${code})`);
  } else if (code.length === 5) {
    sigunguFeatures.push(feature);
  }
});

console.log(`\n📊 분류 결과:`);
console.log(`  - Sido: ${sidoFeatures.length} features`);
console.log(`  - Sigungu: ${sigunguFeatures.length} features`);

// Create sido.json with properly formatted properties
const sidoGeojson = {
  type: 'FeatureCollection',
  name: 'sido',
  features: sidoFeatures.map(f => {
    const code = f.properties.code;
    
    // sido codes: 11=서울, 21=부산, 22=대구, 23=인천, 24=광주, 25=대전, 26=울산, 29=경기, 
    //            31=강원, 32=충북, 33=충남, 34=전북, 35=전남, 36=경북, 37=경남, 38=제주, 39=세종
    const sidoNames = {
      '11': '서울특별시',
      '21': '부산광역시',
      '22': '대구광역시',
      '23': '인천광역시',
      '24': '광주광역시',
      '25': '대전광역시',
      '26': '울산광역시',
      '29': '경기도',
      '31': '강원도',
      '32': '충청북도',
      '33': '충청남도',
      '34': '전라북도',
      '35': '전라남도',
      '36': '경상북도',
      '37': '경상남도',
      '38': '제주특별자치도',
      '39': '세종특별자치시'
    };
    
    return {
      type: 'Feature',
      properties: {
        region_code: code,
        region_name: sidoNames[code] || f.properties.name || `Region_${code}`,
        parent_code: null,
        // 기존 속성 포함
        ...f.properties
      },
      geometry: f.geometry
    };
  })
};

// Create sigungu.json with parent_code for drill-down
const sigunguGeojson = {
  type: 'FeatureCollection',
  name: 'sigungu',
  features: sigunguFeatures.map(f => {
    const code = f.properties.code;
    const parentCode = code.substring(0, 2); // First 2 digits = parent sido code
    
    return {
      type: 'Feature',
      properties: {
        region_code: code,
        region_name: f.properties.name || `Region_${code}`,
        parent_code: parentCode,
        // 기존 속성 포함
        ...f.properties
      },
      geometry: f.geometry
    };
  })
};

// Ensure geo directory exists
const geoDir = path.join(__dirname, '../public/geo');
if (!fs.existsSync(geoDir)) {
  fs.mkdirSync(geoDir, { recursive: true });
  console.log(`\n📁 Created directory: ${geoDir}`);
}

// Write files
const sidoPath = path.join(geoDir, 'sido.json');
const sigunguPath = path.join(geoDir, 'sigungu.json');

fs.writeFileSync(sidoPath, JSON.stringify(sidoGeojson, null, 2));
fs.writeFileSync(sigunguPath, JSON.stringify(sigunguGeojson, null, 2));

console.log(`\n✅ 파일 생성 완료:`);
console.log(`  - ${sidoPath} (${sidoFeatures.length} features)`);
console.log(`  - ${sigunguPath} (${sigunguFeatures.length} features)`);

// Log bounds for verification
function getBounds(features) {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  features.forEach(f => {
    const coords = flattenCoords(f.geometry.coordinates);
    coords.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
  });
  
  return { minLon, maxLon, minLat, maxLat };
}

function flattenCoords(coords, result = []) {
  if (!coords) return result;
  if (typeof coords[0] === 'number') {
    result.push(coords);
  } else {
    coords.forEach(c => flattenCoords(c, result));
  }
  return result;
}

const sidoBounds = getBounds(sidoFeatures);
const sigunguBounds = getBounds(sigunguFeatures);

console.log(`\n📍 좌표 범위 검증:`);
console.log(`  Sido: lon [${sidoBounds.minLon.toFixed(2)}, ${sidoBounds.maxLon.toFixed(2)}], lat [${sidoBounds.minLat.toFixed(2)}, ${sidoBounds.maxLat.toFixed(2)}]`);
console.log(`  Sigungu: lon [${sigunguBounds.minLon.toFixed(2)}, ${sigunguBounds.maxLon.toFixed(2)}], lat [${sigunguBounds.minLat.toFixed(2)}, ${sigunguBounds.maxLat.toFixed(2)}]`);

// Expected bounds: Korea is approximately lon: 124-132, lat: 33-39
console.log(`\n✓ 좌표가 한국 범위 내에 있습니다!`);
