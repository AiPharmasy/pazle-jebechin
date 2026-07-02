const { chromium } = require('playwright')
const fs = require('fs')

async function main() {
  const browser = await chromium.launch()
  const sizes = [
    { size: 512, name: 'app-icon-512.png' },
    { size: 192, name: 'app-icon-192.png' },
    { size: 144, name: 'app-icon-144.png' },
    { size: 96,  name: 'app-icon-96.png' },
    { size: 72,  name: 'app-icon-72.png' },
    { size: 48,  name: 'app-icon-48.png' },
  ]

  for (const { size, name } of sizes) {
    const context = await browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await page.goto('file:///home/z/my-project/scripts/app-icon-final.html')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)

    await page.evaluate((s) => {
      const icon = document.querySelector('.icon')
      if (icon) { icon.style.width = s + 'px'; icon.style.height = s + 'px' }
      const stack = document.querySelector('.stack')
      if (stack) {
        const scale = s / 512
        stack.style.transform = `rotate(-6deg) scale(${scale})`
        stack.style.transformOrigin = 'center center'
      }
      document.body.style.margin = '0'
      document.body.style.padding = '0'
    }, size)
    await page.waitForTimeout(200)

    const iconEl = await page.$('.icon')
    await iconEl.screenshot({
      path: `/home/z/my-project/download/${name}`,
      omitBackground: true,
    })
    console.log(`Generated: ${name} (${size}x${size})`)
    await context.close()
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
    fs.copyFileSync(src, `${androidRes}/${dir}/ic_launcher.png`)
    fs.copyFileSync(src, `${androidRes}/${dir}/ic_launcher_round.png`)
    fs.copyFileSync(src, `${androidRes}/${dir}/ic_launcher_foreground.png`)
    console.log(`Installed: ${dir}/`)
  }
  console.log('\nDone.')
}

main().catch((err) => { console.error(err); process.exit(1) })
