// Adds numbered markers with leader lines to an unlabelled SVG drawing, for the labelling exercises.
// Usage: node scripts/number-diagram.mjs scripts/diagram-markers/<name>.json
//
// The JSON gives the source drawing (in scripts/diagram-sources), the output file (in public/diagrams),
// a crop box, optional white masks ([x, y, width, height]) to hide unwanted parts, and the markers. Coordinates are in the source's pixel space (its width and height),
// so they match a render of the source at 100%.

import { readFileSync, writeFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const source = readFileSync(`scripts/diagram-sources/${config.source}`, 'utf8')

const openTag = source.match(/<svg[\s\S]*?>/)[0]
const attribute = (name) => openTag.match(new RegExp(`\\s${name}="([^"]+)"`))?.[1]
const width = parseFloat(attribute('width'))
const height = parseFloat(attribute('height'))
const viewBox = attribute('viewBox') ?? `0 0 ${width} ${height}`
const inner = source.slice(source.indexOf(openTag) + openTag.length, source.lastIndexOf('</svg>'))

const scale = config.markerScale ?? 1
const radius = 12 * scale

function marker({ n, at, label }) {
  const [x, y] = at
  const [lx, ly] = label
  return [
    `<line x1="${lx}" y1="${ly}" x2="${x}" y2="${y}" stroke="#2b2b2b" stroke-width="${1.6 * scale}"/>`,
    `<circle cx="${x}" cy="${y}" r="${2.6 * scale}" fill="#2b2b2b"/>`,
    `<circle cx="${lx}" cy="${ly}" r="${radius}" fill="#fff" stroke="#2b2b2b" stroke-width="${1.6 * scale}"/>`,
    `<text x="${lx}" y="${ly}" dy="0.35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${13 * scale}" fill="#2b2b2b">${n}</text>`,
  ].join('')
}

const [cropX, cropY, cropWidth, cropHeight] = config.crop
const output = [
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${cropWidth}" height="${cropHeight}" viewBox="${config.crop.join(' ')}">`,
  `<rect x="${cropX}" y="${cropY}" width="${cropWidth}" height="${cropHeight}" fill="#fff"/>`,
  `<svg x="0" y="0" width="${width}" height="${height}" viewBox="${viewBox}">${inner}</svg>`,
  ...(config.masks ?? []).map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`),
  `<g>${config.markers.map(marker).join('')}</g>`,
  `</svg>`,
].join('\n')

writeFileSync(`public/diagrams/${config.output}`, output + '\n')
console.log(`Wrote public/diagrams/${config.output} with ${config.markers.length} markers`)
