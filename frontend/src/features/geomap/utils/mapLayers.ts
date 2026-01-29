/**
 * MapLibre layer management helpers
 * 
 * Simplifies adding/updating GeoJSON sources and layers
 * Handles fill, line, and label layers with consistent styling
 */

import type { Map } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type { GeoData } from './geoLoader';

export interface LayerStyle {
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
  lineOpacity?: number;
  labelField?: string;
  labelSize?: number;
  labelColor?: string;
}

const DEFAULT_STYLE: LayerStyle = {
  fillColor: '#88ccee',
  fillOpacity: 0.6,
  lineColor: '#666',
  lineWidth: 1,
  lineOpacity: 1,
  labelSize: 12,
  labelColor: '#000',
};

/**
 * Add or update GeoJSON source
 */
export function addOrUpdateGeoSource(
  map: Map,
  sourceId: string,
  data: GeoData,
  verbose = true
): void {
  verbose && console.log(`[MapLayers] Adding/updating source "${sourceId}" with ${data.features.length} features`);

  const source = map.getSource(sourceId) as GeoJSONSource | undefined;

  if (source && source.type === 'geojson') {
    // Update existing source
    source.setData(data as any);
    verbose && console.log(`[MapLayers] Updated source "${sourceId}"`);
  } else {
    // Add new source
    map.addSource(sourceId, {
      type: 'geojson',
      data: data as any,
      promoteId: 'region_code', // Use region_code for feature-state
    });
    verbose && console.log(`[MapLayers] Created source "${sourceId}"`);
  }
}

/**
 * Add or update fill layer
 */
export function addOrUpdateFillLayer(
  map: Map,
  layerId: string,
  sourceId: string,
  paintExpression?: any,
  style = DEFAULT_STYLE,
  verbose = true
): void {
  verbose && console.log(`[MapLayers] Adding/updating fill layer "${layerId}"`);

  const paint: any = paintExpression || {
    'fill-color': style.fillColor || DEFAULT_STYLE.fillColor,
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      style.fillOpacity ? (style.fillOpacity + 0.2) : 0.8, // Hover effect
      style.fillOpacity || DEFAULT_STYLE.fillOpacity,
    ],
  };

  const layer: any = {
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint,
  };

  const existing = map.getLayer(layerId);
  if (existing) {
    // Update paint properties
    Object.entries(paint).forEach(([key, value]) => {
      map.setPaintProperty(layerId, key, value);
    });
    verbose && console.log(`[MapLayers] Updated fill layer "${layerId}"`);
  } else {
    // Add new layer
    map.addLayer(layer);
    verbose && console.log(`[MapLayers] Created fill layer "${layerId}"`);
  }
}

/**
 * Add or update line layer (boundaries)
 */
export function addOrUpdateLineLayer(
  map: Map,
  layerId: string,
  sourceId: string,
  style = DEFAULT_STYLE,
  verbose = true
): void {
  verbose && console.log(`[MapLayers] Adding/updating line layer "${layerId}"`);

  const paint: any = {
    'line-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#000', // Black for selected
      style.lineColor || DEFAULT_STYLE.lineColor,
    ],
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      (style.lineWidth || DEFAULT_STYLE.lineWidth || 1) + 1, // Thicker when selected
      style.lineWidth || DEFAULT_STYLE.lineWidth,
    ],
    'line-opacity': style.lineOpacity || DEFAULT_STYLE.lineOpacity,
  };

  const layer: any = {
    id: layerId,
    type: 'line',
    source: sourceId,
    paint,
  };

  const existing = map.getLayer(layerId);
  if (existing) {
    Object.entries(paint).forEach(([key, value]) => {
      map.setPaintProperty(layerId, key, value);
    });
    verbose && console.log(`[MapLayers] Updated line layer "${layerId}"`);
  } else {
    map.addLayer(layer);
    verbose && console.log(`[MapLayers] Created line layer "${layerId}"`);
  }
}

/**
 * Add or update label layer
 */
export function addOrUpdateLabelLayer(
  map: Map,
  layerId: string,
  sourceId: string,
  labelField = 'region_name',
  style = DEFAULT_STYLE,
  verbose = true
): void {
  verbose && console.log(`[MapLayers] Adding/updating label layer "${layerId}"`);

  const layout: any = {
    'text-field': `{${labelField}}`,
    'text-size': style.labelSize || DEFAULT_STYLE.labelSize,
    'text-allow-overlap': false,
    'text-anchor': 'center',
  };

  const paint: any = {
    'text-color': style.labelColor || DEFAULT_STYLE.labelColor,
    'text-halo-color': '#fff',
    'text-halo-width': 1,
  };

  const layer: any = {
    id: layerId,
    type: 'symbol',
    source: sourceId,
    layout,
    paint,
  };

  const existing = map.getLayer(layerId);
  if (existing) {
    Object.entries(layout).forEach(([key, value]) => {
      map.setLayoutProperty(layerId, key, value);
    });
    Object.entries(paint).forEach(([key, value]) => {
      map.setPaintProperty(layerId, key, value);
    });
    verbose && console.log(`[MapLayers] Updated label layer "${layerId}"`);
  } else {
    map.addLayer(layer);
    verbose && console.log(`[MapLayers] Created label layer "${layerId}"`);
  }
}

/**
 * Remove layers and source
 */
export function removeGeoLayers(
  map: Map,
  layerIds: string[],
  sourceId: string,
  verbose = true
): void {
  verbose && console.log(`[MapLayers] Removing layers and source`);

  layerIds.forEach((layerId) => {
    const layer = map.getLayer(layerId);
    if (layer) {
      map.removeLayer(layerId);
      verbose && console.log(`[MapLayers] Removed layer "${layerId}"`);
    }
  });

  const source = map.getSource(sourceId);
  if (source) {
    map.removeSource(sourceId);
    verbose && console.log(`[MapLayers] Removed source "${sourceId}"`);
  }
}

/**
 * Fit map to bounds of all features
 */
export function fitToFeatures(
  map: Map,
  bounds: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  },
  padding = 50,
  verbose = true
): void {
  verbose && console.log(
    `[MapLayers] Fitting map to bounds: ` +
    `lon [${bounds.minLon.toFixed(2)}, ${bounds.maxLon.toFixed(2)}], ` +
    `lat [${bounds.minLat.toFixed(2)}, ${bounds.maxLat.toFixed(2)}]`
  );

  map.fitBounds(
    [
      [bounds.minLon, bounds.minLat],
      [bounds.maxLon, bounds.maxLat],
    ],
    { padding }
  );
}
