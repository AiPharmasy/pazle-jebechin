// Render portfolio banner 1200x630
const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/scripts/portfolio-banner.html')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const banner = await page.$('.banner')
  await banner.screenshot({
    path: '/home/z/my-project/download/portfolio-banner-1200x630.png',
    omitBackground: false,
  })

  await browser.close()
  console.log('Portfolio banner generated: download/portfolio-banner-1200x630.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
