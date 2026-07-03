// Generate all app icon sizes from v4 design (3D block stack)
const { chromium } = require('playwright')
const fs = require('fs')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file:///home/z/my-project/scripts/app-icon-v4.html')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const sizes = [
    { size: 512, name: 'app-icon-512.png' },
    { size: 192, name: 'app-icon-192.png' },
    { size: 144, name: 'app-icon-144.png' },
    { size: 96,  name: 'app-icon-96.png' },
    { size: 72,  name: 'app-icon-72.png' },
    { size: 48,  name: 'app-icon-48.png' },
  ]

  for (const { size, name } of sizes) {
    await page.evaluate((s) => {
      const icon = document.querySelector('.icon')
      if (icon) {
        icon.style.width = s + 'px'
        icon.style.height = s + 'px'
        icon.style.borderRadius = Math.floor(s * 0.1875) + 'px'
      }
    }, size)
    await page.waitForTimeout(150)

    const icon = await page.$('.icon')
    await icon.screenshot({
      path: `/home/z/my-project/download/${name}`,
      omitBackground: false,
    })
    console.log(`Generated: ${name} (${size}x${size})`)
  }

  await browser.close()

  // Install to Android mipmap folders
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
