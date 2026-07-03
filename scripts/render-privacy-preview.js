// Render privacy policy page as preview screenshot
const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 800, height: 1200 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/download/privacy-policy.html')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: '/home/z/my-project/download/privacy-policy-preview.png',
    fullPage: true,
    omitBackground: false,
  })

  await browser.close()
  console.log('Preview generated: download/privacy-policy-preview.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
