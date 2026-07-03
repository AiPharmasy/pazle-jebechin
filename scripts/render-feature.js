// Render feature graphic 1024x500
const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/scripts/feature-graphic.html')
  await page.waitForLoadState('networkidle')

  // Wait for web fonts to load
  await page.waitForTimeout(800)

  // Screenshot the .feature element
  const feature = await page.$('.feature')
  await feature.screenshot({
    path: '/home/z/my-project/download/feature-graphic-1024x500.png',
    omitBackground: false,
  })

  await browser.close()
  console.log('Feature graphic generated: download/feature-graphic-1024x500.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
