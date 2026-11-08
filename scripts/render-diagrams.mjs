// Renders every diagram in scripts/diagram-output to a WebP in public/diagrams, which is what the app loads.
// WebP is far smaller and quicker to decode than the SVGs, several of which embed a photo.
// Usage: node scripts/render-diagrams.mjs   (needs Playwright's Chromium: npx playwright install chromium-headless-shell)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

/** Wide enough to stay sharp on a phone screen and in the desktop column. */
const TARGET_WIDTH = 1000
const QUALITY = 0.8
/** Diagrams built on a small photo or scan: rendering wider than the source adds bytes, not detail. */
const WIDTHS = { 'fetal-skull.svg': 600 }
const TYPES = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg' }

const browser = await chromium.launch()
const page = await browser.newPage()

for (const file of readdirSync('scripts/diagram-output')) {
  const extension = file.split('.').pop()
  if (!TYPES[extension]) continue
  const source = `data:${TYPES[extension]};base64,${readFileSync(`scripts/diagram-output/${file}`).toString('base64')}`
  // Vector diagrams render at the target width; raster ones keep their own size, as upscaling adds nothing.
  const webp = await page.evaluate(
    async ({ source, isVector, targetWidth, quality }) => {
      const image = new Image()
      image.src = source
      await image.decode()
      const width = isVector ? targetWidth : image.naturalWidth
      const height = Math.round((image.naturalHeight * width) / image.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      return canvas.toDataURL('image/webp', quality)
    },
    { source, isVector: extension === 'svg', targetWidth: WIDTHS[file] ?? TARGET_WIDTH, quality: QUALITY },
  )
  const output = `public/diagrams/${file.replace(/\.\w+$/, '.webp')}`
  const bytes = Buffer.from(webp.split(',')[1], 'base64')
  writeFileSync(output, bytes)
  console.log(`${output}  ${Math.round(bytes.length / 1024)} KB`)
}

await browser.close()
