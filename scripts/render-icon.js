// Generate all required app icon sizes for Android (mipmap) + market
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/scripts/app-icon.html')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const sizes = [
    { size: 512, name: 'app-icon-512.png' }, // For markets (Bazaar, Myket)
    { size: 192, name: 'app-icon-192.png' }, // For Android xxxhdpi
    { size: 144, name: 'app-icon-144.png' }, // For Android xxhdpi
    { size: 96,  name: 'app-icon-96.png' },  // For Android xhdpi
    { size: 72,  name: 'app-icon-72.png' },  // For Android hdpi
    { size: 48,  name: 'app-icon-48.png' },  // For Android mdpi
  ]

  for (const { size, name } of sizes) {
    // Resize the .icon element
    await page.evaluate((s) => {
      const icon = document.querySelector('.icon')
      if (icon) {
        icon.style.width = s + 'px'
        icon.style.height = s + 'px'
        icon.style.borderRadius = Math.floor(s * 0.1875) + 'px' // keep 96/512 ratio
      }
    }, size)
    await page.waitForTimeout(150)

    const icon = await page.$('.icon')
    const outPath = `/home/z/my-project/download/${name}`
    await icon.screenshot({ path: outPath, omitBackground: false })
    console.log(`Generated: ${name} (${size}x${size})`)
  }

  await browser.close()

  // Also copy icons to Android mipmap folders
  const androidRes = '/home/z/my-project/android/app/src/main/res'
  const mipmapMap = [
    { dir: 'mipmap-mdpi',    size: 48 },
    { dir: 'mipmap-hdpi',    size: 72 },
    { dir: 'mipmap-xhdpi',   size: 96 },
    { dir: 'mipmap-xxhdpi',  size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ]

  for (const { dir, size } of mipmapMap) {
    const src = `/home/z/my-project/download/app-icon-${size}.png`
    const dest = `${androidRes}/${dir}/ic_launcher.png`
    const destRound = `${androidRes}/${dir}/ic_launcher_round.png`
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      fs.copyFileSync(src, destRound)
      console.log(`Installed: ${dir}/ic_launcher.png + ic_launcher_round.png`)
    }
  }

  console.log('\nAll icons generated and installed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
