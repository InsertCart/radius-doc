/**
 * Reports which <Screenshot> slots still have no image file.
 *
 * Every screen in the product has a slot in the docs whether or not the
 * screenshot exists yet, so this is the checklist of what is still owed —
 * and, run the other way, it catches a slot pointing at a path that was
 * renamed or never existed.
 *
 *   npm run shots
 *
 * Exits 1 when anything is missing, so CI can report it. The deploy workflow
 * treats that as advisory: a page with a placeholder is still a useful page.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const DOCS = 'docs'
const IMAGES = join(DOCS, 'public', 'images')

async function walk(dir, match) {
  const found = []

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === '.vitepress' || entry.name === 'public') continue
      found.push(...(await walk(path, match)))
    } else if (match(entry.name)) {
      found.push(path)
    }
  }

  return found
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const pages = await walk(DOCS, (name) => name.endsWith('.md'))

// Matches src="..." inside a <Screenshot> tag, however the attributes are
// wrapped across lines.
const TAG = /<Screenshot\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gs

const missing = []
const orphans = new Set()
let total = 0

for (const page of pages) {
  const source = await readFile(page, 'utf8')

  for (const [, src] of source.matchAll(TAG)) {
    total++
    const file = join(IMAGES, ...src.split('/'))

    if (await exists(file)) {
      orphans.add(relative(IMAGES, file).split(sep).join('/'))
    } else {
      missing.push({ page: page.split(sep).join('/'), src })
    }
  }
}

// Images present on disk that no page references.
const onDisk = (await exists(IMAGES))
  ? (await walk(IMAGES, (name) => /\.(png|jpe?g|webp|gif|avif)$/i.test(name))).map((p) =>
      relative(IMAGES, p).split(sep).join('/'),
    )
  : []

const unused = onDisk.filter((f) => !orphans.has(f))

const done = total - missing.length
const pct = total ? Math.round((done / total) * 100) : 100

console.log(`\nScreenshots: ${done}/${total} present (${pct}%)\n`)

if (missing.length) {
  console.log('Still to capture:\n')

  const byPage = new Map()
  for (const m of missing) {
    if (!byPage.has(m.page)) byPage.set(m.page, [])
    byPage.get(m.page).push(m.src)
  }

  for (const [page, files] of [...byPage].sort()) {
    console.log(`  ${page}`)
    for (const f of files.sort()) console.log(`      docs/public/images/${f}`)
    console.log('')
  }
}

if (unused.length) {
  console.log('On disk but not referenced by any page:\n')
  for (const f of unused.sort()) console.log(`      ${f}`)
  console.log('')
}

process.exit(missing.length ? 1 : 0)
