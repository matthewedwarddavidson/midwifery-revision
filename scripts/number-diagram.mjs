// Adds numbered markers to a drawing, for the labelling exercises.
// Usage: node scripts/number-diagram.mjs scripts/diagram-markers/<name>.json
//
// The JSON gives:
// - source: a drawing in scripts/diagram-sources, either SVG or a raster image (JPEG or PNG, embedded)
// - imageSize: [width, height] for a raster source, in the coordinates the markers use (usually the
//   original image's pixels, so a shrunk copy still lines up)
// - output: the file to write in scripts/diagram-output (then run scripts/render-diagrams.mjs)
// - crop: [x, y, width, height]
// - masks: optional white boxes [x, y, width, height], e.g. to hide a figure's text labels
// - markerScale: optional size multiplier for the markers
// - markers: { n, at, label }. A line runs from the number at `label` to a dot at `at`.
//   Leave out `at` when the number sits on the end of an existing leader line.
// Coordinates are in the source's own space: an SVG's width and height, or imageSize.

import { readFileSync, writeFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const sourcePath = `scripts/diagram-sources/${config.source}`

/** The drawing as an SVG fragment placed at the origin. */
function drawing() {
  const raster = config.source.match(/\.(jpe?g|png)$/i)
  if (raster) {
    const [width, height] = config.imageSize
    const type = raster[1].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg'
    const data = readFileSync(sourcePath).toString('base64')
    return `<image x="0" y="0" width="${width}" height="${height}" href="data:${type};base64,${data}"/>`
  }
  const source = readFileSync(sourcePath, 'utf8')
  const openTag = source.match(/<svg[\s\S]*?>/)[0]
  const attribute = (name) => openTag.match(new RegExp(`\\s${name}="([^"]+)"`))?.[1]
  const width = parseFloat(attribute('width'))
  const height = parseFloat(attribute('height'))
  const viewBox = attribute('viewBox') ?? `0 0 ${width} ${height}`
  const inner = source.slice(source.indexOf(openTag) + openTag.length, source.lastIndexOf('</svg>'))
  return `<svg x="0" y="0" width="${width}" height="${height}" viewBox="${viewBox}">${inner}</svg>`
}

const scale = config.markerScale ?? 1
const radius = 12 * scale

function marker({ n, at, label }) {
  const [lx, ly] = label
  const leader = at
    ? [
        `<line x1="${lx}" y1="${ly}" x2="${at[0]}" y2="${at[1]}" stroke="#2b2b2b" stroke-width="${1.6 * scale}"/>`,
        `<circle cx="${at[0]}" cy="${at[1]}" r="${2.6 * scale}" fill="#2b2b2b"/>`,
      ]
    : []
  return [
    ...leader,
    `<circle cx="${lx}" cy="${ly}" r="${radius}" fill="#fff" stroke="#2b2b2b" stroke-width="${1.6 * scale}"/>`,
    `<text x="${lx}" y="${ly}" dy="0.35em" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${13 * scale}" fill="#2b2b2b">${n}</text>`,
  ].join('')
}

const [cropX, cropY, cropWidth, cropHeight] = config.crop
const output = [
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${cropWidth}" height="${cropHeight}" viewBox="${config.crop.join(' ')}">`,
  `<rect x="${cropX}" y="${cropY}" width="${cropWidth}" height="${cropHeight}" fill="#fff"/>`,
  drawing(),
  ...(config.masks ?? []).map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`),
  `<g>${config.markers.map(marker).join('')}</g>`,
  `</svg>`,
].join('\n')

writeFileSync(`scripts/diagram-output/${config.output}`, output + '\n')
console.log(`Wrote scripts/diagram-output/${config.output} with ${config.markers.length} markers`)
