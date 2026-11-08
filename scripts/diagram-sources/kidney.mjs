// Draws scripts/diagram-sources/kidney.svg: a kidney in section, schematic. Run: node scripts/diagram-sources/kidney.mjs
// Pyramids are placed radially around one centre: bases just under the cortex, papillae poking into
// cup-shaped minor calyces, which join major calyces and then the renal pelvis at the hilum.

import { writeFileSync } from 'node:fs'

const centre = { x: 300, y: 275 }
const round = (n) => Math.round(n * 10) / 10
const radians = (d) => (d * Math.PI) / 180
const point = (deg, rx, ry) => ({
  x: round(centre.x + rx * Math.cos(radians(deg))),
  y: round(centre.y + ry * Math.sin(radians(deg))),
})

const BASE = [140, 185] // inner edge of the cortex
const APEX = [62, 108] // papilla tips
const CUP = [55, 97] // minor calyx centres, just inside the tips
const SPREAD = 15 // half-width of each pyramid, in degrees

const angles = [-115, -72, -32, 0, 32, 72, 115]
const pyramid = (deg) => {
  const left = point(deg - SPREAD, ...BASE)
  const right = point(deg + SPREAD, ...BASE)
  const bulge = point(deg, BASE[0] * 1.08, BASE[1] * 1.08)
  const apex = point(deg, ...APEX)
  return `<path d="M${apex.x} ${apex.y} L${left.x} ${left.y} Q${bulge.x} ${bulge.y} ${right.x} ${right.y} Z" fill="#9b4436" stroke="#7a2f24" stroke-width="1.5"/>`
}

const pelvis = { x: 236, y: 280 }
const upperMajor = { x: 258, y: 212 }
const lowerMajor = { x: 258, y: 348 }
const majorFor = (deg) => (deg < -10 ? upperMajor : deg > 10 ? lowerMajor : pelvis)
const line = (a, b, width) =>
  `<path d="M${a.x} ${a.y} L${b.x} ${b.y}" stroke="#efd77a" stroke-width="${width}" stroke-linecap="round"/>`

const calyces = [
  line(upperMajor, pelvis, 24),
  line(lowerMajor, pelvis, 24),
  ...angles.map((deg) => line(point(deg, ...CUP), majorFor(deg), 12)),
  ...angles.map((deg) => {
    const cup = point(deg, ...CUP)
    return `<circle cx="${cup.x}" cy="${cup.y}" r="13" fill="#efd77a" stroke="#c9ae4a" stroke-width="1.2"/>`
  }),
].join('\n  ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="560" viewBox="0 0 520 560">
  <!-- Kidney in section, schematic, drawn for this app. -->
  <!-- Renal artery and vein, entering at the hilum -->
  <path d="M40 222 C120 222 170 226 240 232" fill="none" stroke="#c8343a" stroke-width="16" stroke-linecap="round"/>
  <path d="M40 252 C120 252 170 254 240 256" fill="none" stroke="#3f5fb5" stroke-width="18" stroke-linecap="round"/>
  <!-- Ureter, leaving at the hilum -->
  <path d="M214 300 C192 360 188 440 198 545" fill="none" stroke="#e7cf6a" stroke-width="16" stroke-linecap="round"/>
  <!-- Kidney: capsule (outline) and cortex (fill), with the hilum notch on the left -->
  <path d="M300 60 C420 60 470 160 470 275 C470 400 410 490 300 490 C220 490 182 440 188 392 C192 356 214 336 214 306 L214 236 C214 206 192 186 188 150 C182 102 220 60 300 60 Z" fill="#cf8466" stroke="#6e2a20" stroke-width="5"/>
  <!-- Renal sinus: fat around the calyces -->
  <ellipse cx="282" cy="275" rx="82" ry="122" fill="#f4e6c8"/>
  ${calyces}
  ${angles.map(pyramid).join('\n  ')}
  <!-- Renal pelvis, funnelling into the ureter -->
  <path d="M246 262 C232 262 214 274 208 300 L222 306 C228 292 240 298 250 306 Z" fill="#efd77a"/>
  <circle cx="${pelvis.x}" cy="${pelvis.y}" r="25" fill="#efd77a" stroke="#c9ae4a" stroke-width="1.2"/>
</svg>
`
writeFileSync('scripts/diagram-sources/kidney.svg', svg)
console.log('Wrote scripts/diagram-sources/kidney.svg')
for (const deg of angles) console.log(deg, 'apex', point(deg, ...APEX), 'cup', point(deg, ...CUP))
