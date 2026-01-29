import fs from 'node:fs'
import path from 'node:path'

const input = process.argv[2]
const output = process.argv[3]

if (!input || !output) {
  console.error('Usage: node scripts/normalize-geo.mjs <input.geojson> <output.geojson>')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(input, 'utf-8'))
const features = raw.features || []

const normalized = {
  ...raw,
  features: features.map((f, idx) => {
    const props = f.properties || {}
    const region_code = props.region_code || props.code || props.CD || String(idx)
    const region_name = props.region_name || props.name || props.NAME || `Region-${idx + 1}`
    const parent_code = props.parent_code || props.parent || props.PARENT || undefined
    return {
      ...f,
      properties: {
        ...props,
        region_code: String(region_code),
        region_name: String(region_name),
        ...(parent_code ? { parent_code: String(parent_code) } : {}),
      },
    }
  }),
}

fs.writeFileSync(output, JSON.stringify(normalized))
console.log(`normalized -> ${path.resolve(output)}`)
