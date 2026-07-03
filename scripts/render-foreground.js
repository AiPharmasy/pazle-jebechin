// Generate foreground icons (transparent background) for adaptive icons
const { chromium } = require('playwright')
const fs = require('fs')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 432, height: 432 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/scripts/app-icon-foreground.html')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Android adaptive icon foreground sizes (108dp × × density)
  const sizes = [
    { size: 432, name: 'mipmap-xxxhdpi', density: 'xxxhdpi' },
    { size: 324, name: 'mipmap-xxhdpi', density: 'xxhdpi' },
    { size: 216, name: 'mipmap-xhdpi', density: 'xhdpi' },
    { size: 162, name: 'mipmap-hdpi', density: 'hdpi' },
    { size: 108, name: 'mipmap-mdpi', density: 'mdpi' },
  ]

  for (const { size, name } of sizes) {
    await page.setViewportSize({ width: size, height: size })
    await page.evaluate((s) => {
      const stack = document.querySelector('.stack')
      if (stack) {
        const scale = s / 432
        stack.style.transform = `rotate(-6deg) scale(${scale})`
        stack.style.transformOrigin = 'center center'
      }
    }, size)
    await page.waitForTimeout(200)

    const buf = await page.screenshot({
      omitBackground: true,
      type: 'png',
    })

    const dest = `/home/z/my-project/android/app/src/main/res/${name}/ic_launcher_foreground.png`
    fs.writeFileSync(dest, buf)
    console.log(`Generated: ${name}/ic_launcher_foreground.png (${size}x${size})`)
  }

  await browser.close()
  console.log('\nAll foreground icons installed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
