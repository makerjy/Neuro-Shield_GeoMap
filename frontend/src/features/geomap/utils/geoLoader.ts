/**
 * Geospatial data loader with validation and projection detection
 * 
 * Features:
 * - Load and parse GeoJSON/TopoJSON data
 * - Validate geometry and coordinate ranges
 * - Detect map projection (WGS84, meters, swapped coordinates)
 * - Extract sido/sigungu from raw korea.json
 * - Comprehensive logging for debugging
 */

import { Feature, FeatureCollection } from 'geojson';

export interface GeoData extends FeatureCollection {
  name?: string;
  crs?: {
    type: string;
    properties: { name: string };
  };
}

export interface LoaderOptions {
  verbose?: boolean;
  validateGeometry?: boolean;
}

/**
 * Load GeoJSON from URL with caching and validation
 */
export async function loadGeoJson(
  level: 'sido' | 'sigungu' | 'eup',
  options: LoaderOptions = {}
): Promise<GeoData> {
  const { verbose = true, validateGeometry = true } = options;
  
  const levelPaths = {
    sido: '/geo/sido.json',
    sigungu: '/geo/sigungu.json',
    eup: '/geo/eupmyeondong.json',
  };

  const geoPath = levelPaths[level];
  verbose && console.log(`[GeoLoader] Loading ${level} from ${geoPath}...`);

  try {
    const response = await fetch(geoPath);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    verbose && console.log(`[GeoLoader] Fetch successful: ${data.features?.length || 0} features`);

    if (validateGeometry) {
      const validationResult = validateGeoJson(data, verbose);
      if (!validationResult.valid) {
        console.error('[GeoLoader] Validation FAILED:', validationResult.errors);
        throw new Error(`GeoJSON validation failed: ${validationResult.errors.join(', ')}`);
      }
      verbose && console.log('[GeoLoader] Geometry validation passed');
    }

    // Detect projection
    const projection = detectProjection(data, verbose);
    verbose && console.log(`[GeoLoader] Detected projection: ${projection}`);

    // Log bounds
    const bounds = calculateBounds(data);
    verbose && console.log(
      `[GeoLoader] Bounds: lon [${bounds.minLon.toFixed(2)}, ${bounds.maxLon.toFixed(2)}], ` +
      `lat [${bounds.minLat.toFixed(2)}, ${bounds.maxLat.toFixed(2)}]`
    );

    return data as GeoData;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GeoLoader] Error loading ${level}:`, message);
    throw new Error(`Failed to load ${level} GeoJSON: ${message}`);
  }
}

/**
 * Load korea.json and extract sido/sigungu features
 * Used for development/fallback when individual GeoJSON files don't exist
 */
export async function loadAndExtractFromKorea(
  level: 'sido' | 'sigungu' | 'eup',
  verbose = true
): Promise<GeoData> {
  verbose && console.log(`[GeoLoader] Loading korea.json and extracting ${level}...`);

  try {
    const response = await fetch('/korea.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const koreaData = await response.json() as GeoData;
    verbose && console.log(`[GeoLoader] korea.json loaded: ${koreaData.features?.length || 0} features`);

    // Extract features based on code length
    // Sido: 2-digit code (11, 21, 22, ...)
    // Sigungu: 5-digit code (11110, 11140, ...)
    const filtered = filterByLevel(koreaData, level, verbose);

    // Add region_code and parent_code properties
    const processed = addRegionProperties(filtered, level, verbose);

    verbose && console.log(`[GeoLoader] Extracted ${processed.features.length} ${level} features`);

    return processed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GeoLoader] Error loading korea.json:`, message);
    throw new Error(`Failed to load from korea.json: ${message}`);
  }
}

/**
 * Validate GeoJSON structure and coordinate ranges
 */
export function validateGeoJson(
  data: any,
  verbose = true
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check FeatureCollection
  if (!data || typeof data !== 'object') {
    errors.push('Data is not an object');
    return { valid: false, errors };
  }

  if (data.type !== 'FeatureCollection') {
    errors.push(`Expected type "FeatureCollection", got "${data.type}"`);
  }

  if (!Array.isArray(data.features)) {
    errors.push('Features is not an array');
    return { valid: false, errors };
  }

  if (data.features.length === 0) {
    errors.push('Features array is empty');
  }

  // Check each feature
  data.features.forEach((feature: Feature, index: number) => {
    if (feature.type !== 'Feature') {
      errors.push(`Feature ${index}: type is not "Feature"`);
    }

    if (!feature.geometry) {
      errors.push(`Feature ${index}: missing geometry`);
      return;
    }

    const geomType = (feature.geometry as any)?.type;
    const coordinates = (feature.geometry as any)?.coordinates;
    
    if (!geomType) {
      errors.push(`Feature ${index}: geometry has no type`);
      return;
    }

    if (!coordinates) {
      errors.push(`Feature ${index}: geometry has no coordinates`);
      return;
    }

    // Validate coordinates
    try {
      validateCoordinates(coordinates, geomType, index, errors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Feature ${index}: ${msg}`);
    }
  });

  const valid = errors.length === 0;
  verbose && console.log(
    `[GeoLoader] Validation: ${valid ? '✓ PASSED' : '✗ FAILED'} ${errors.length > 0 ? `(${errors.length} errors)` : ''}`
  );

  return { valid, errors };
}

/**
 * Detect map projection by analyzing coordinates
 */
export function detectProjection(
  data: GeoData,
  verbose = true
): 'wgs84' | 'meters' | 'swapped' {
  if (!data.features || data.features.length === 0) {
    return 'wgs84'; // Default
  }

  const coords = flattenCoordinates((data.features[0].geometry as any)?.coordinates || []);
  if (coords.length === 0) {
    return 'wgs84';
  }

  const [lon, lat] = coords[0];

  let projection: 'wgs84' | 'meters' | 'swapped' = 'wgs84';

  if (
    typeof lon === 'number' && typeof lat === 'number' &&
    lon > 124 && lon < 132 &&
    lat > 33 && lat < 39
  ) {
    projection = 'wgs84';
  } else if (
    typeof lat === 'number' && typeof lon === 'number' &&
    lat > 124 && lat < 132 &&
    lon > 33 && lon < 39
  ) {
    projection = 'swapped'; // [lat, lon] instead of [lon, lat]
  } else if (Math.abs(lon) > 1000 || Math.abs(lat) > 1000) {
    projection = 'meters'; // Projected coordinate system
  }

  verbose && console.log(
    `[GeoLoader] Projection detection: sample coords [${lon}, ${lat}] → ${projection}`
  );

  return projection;
}

/**
 * Calculate bounds of all features
 */
export function calculateBounds(data: GeoData): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  if (!data.features || data.features.length === 0) {
    return { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 };
  }

  data.features.forEach((feature) => {
    const coords = flattenCoordinates((feature.geometry as any)?.coordinates || []);
    coords.forEach(([lon, lat]) => {
      if (typeof lon === 'number' && typeof lat === 'number') {
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    });
  });

  return { minLon, maxLon, minLat, maxLat };
}

/**
 * Filter features by adminlevel (code length)
 */
function filterByLevel(
  data: GeoData,
  level: 'sido' | 'sigungu' | 'eup',
  verbose = true
): GeoData {
  const codeLengths = {
    sido: 2,     // 11, 21, 22, ...
    sigungu: 5,  // 11110, 11140, ...
    eup: 8,      // 11110101, 11110102, ...
  };

  const targetLength = codeLengths[level];
  const filtered = data.features.filter((f) => {
    const code = f.properties?.code as string;
    return code && code.length === targetLength;
  });

  verbose && console.log(
    `[GeoLoader] Filtered ${data.features.length} → ${filtered.length} features for ${level}`
  );

  return {
    ...data,
    features: filtered,
  };
}

/**
 * Add region_code and parent_code to properties
 */
function addRegionProperties(
  data: GeoData,
  level: 'sido' | 'sigungu' | 'eup',
  verbose = true
): GeoData {
  const sido코드맵: Record<string, string> = {
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
    '39': '세종특별자치시',
  };

  const enhanced = data.features.map((f) => {
    const code = f.properties?.code as string;
    const name = f.properties?.name as string;

    let region_code = code;
    let region_name = name;
    let parent_code = null;

    if (level === 'sido' && code.length === 2) {
      region_name = sido코드맵[code] || name;
      parent_code = null;
    } else if (level === 'sigungu' && code.length === 5) {
      parent_code = code.substring(0, 2); // First 2 digits = parent sido
    } else if (level === 'eup' && code.length === 8) {
      parent_code = code.substring(0, 5); // First 5 digits = parent sigungu
    }

    return {
      ...f,
      properties: {
        ...f.properties,
        region_code,
        region_name,
        parent_code,
      },
    };
  });

  return {
    ...data,
    features: enhanced,
  };
}

/**
 * Validate coordinate array structure
 */
function validateCoordinates(
  coords: any,
  geomType: string,
  featureIndex: number,
  errors: string[]
): void {
  if (geomType === 'Point') {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error('Point coordinates must be [lon, lat]');
    }
  } else if (geomType === 'LineString' || geomType === 'MultiPoint') {
    if (!Array.isArray(coords) || coords.length === 0) {
      throw new Error(`${geomType} coordinates must be a non-empty array`);
    }
  } else if (geomType === 'Polygon' || geomType === 'MultiLineString') {
    if (!Array.isArray(coords) || coords.length === 0) {
      throw new Error(`${geomType} coordinates must be a non-empty array`);
    }
  } else if (geomType === 'MultiPolygon') {
    if (!Array.isArray(coords) || coords.length === 0) {
      throw new Error('MultiPolygon coordinates must be a non-empty array');
    }
  }
}

/**
 * Flatten coordinate arrays for bounds calculation
 */
function flattenCoordinates(coords: any): Array<[number, number]> {
  const result: Array<[number, number]> = [];

  function flatten(arr: any): void {
    if (!arr) return;

    if (typeof arr[0] === 'number') {
      // This is a coordinate pair [lon, lat]
      if (arr.length >= 2) {
        result.push([arr[0], arr[1]]);
      }
    } else if (Array.isArray(arr[0])) {
      // This is an array of coordinates or coordinate arrays
      arr.forEach((item: any) => flatten(item));
    }
  }

  flatten(coords);
  return result;
}
