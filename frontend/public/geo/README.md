# GeoJSON assets

Place the normalized GeoJSON files here:

- `sido.geojson`
- `sigungu.geojson`
- `eupmyeondong.geojson` (optional)

Each feature must include:
- `region_code`
- `region_name`
- `parent_code` (for child levels)

You can normalize raw files using:

```
npm run normalize-geo -- <input.geojson> <output.geojson>
```
