// Bundling smoke test run by `npm run test:bundling`.
//
// The whole point of keeping the stream helper on the `readable` subpath is so
// that a browser bundle of the main entry does not drag in a Node stream
// implementation. Both fixtures are bundled for the browser with Vite and then
// executed with Node's global `Buffer` removed, so the ONLY `Buffer` the package
// can use is the one it imports from the `buffer` module it ships as a
// dependency. That proves a browser bundle of the main entry is self-sufficient.
//
// These checks assert:
//   - the main entry bundles and RUNS with no global `Buffer`, and
//   - the main entry does not reference `stream` / `node:stream`, and
//   - `stream` is only reachable through the explicit `readable` subpath.
//
// The package is resolved by name from `node_modules` so its real `exports` map
// (including the `./readable` subpath) is exercised, exactly as a downstream
// bundler would. The built `dist/` must exist (run `npm run build` first;
// `npm run ci` does).
import { readFileSync, readdirSync, existsSync, symlinkSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { build } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distIndex = resolve(root, 'dist/index.js')
const distReadable = resolve(root, 'dist/readable.js')

for (const file of [distIndex, distReadable]) {
  if (!existsSync(file)) {
    throw new Error(`Missing built file ${file} - run \`npm run build\` first`)
  }
}

// Resolve `@platformatic/dynamic-buffer` (and its `./readable` subpath) by name
// through the real `exports` map. The package dir is gitignored, so this stray
// symlink never lands in the repo.
const pkgLink = join(root, 'node_modules/@platformatic/dynamic-buffer')
rmSync(pkgLink, { force: true, recursive: true })
mkdirSync(dirname(pkgLink), { recursive: true })
symlinkSync(root, pkgLink, 'dir')

async function bundle (entry, outDir, external) {
  await build({
    logLevel: 'silent',
    configFile: false,
    build: {
      minify: false,
      emptyOutDir: true,
      outDir,
      lib: {
        entry: resolve(root, entry),
        formats: ['es'],
        fileName: () => 'bundle.js'
      },
      rollupOptions: { external }
    }
  })
  const [name] = readdirSync(outDir).filter((file) => file.endsWith('.js'))
  return resolve(outDir, name)
}

const out = resolve(root, 'test/bundling/.out')

// 1. The main entry must bundle and run for the browser without a global
//    `Buffer` (the package provides its own via the `buffer` dependency), and
//    without pulling in stream.
const mainPath = await bundle('test/bundling/main.js', resolve(out, 'main'), () => false)
const main = readFileSync(mainPath, 'utf8')
assert.doesNotMatch(main, /node:stream/, 'main entry must not import node:stream')
assert.doesNotMatch(main, /['"]stream['"]/, 'main entry must not import stream')

// Run the bundle with the Node global `Buffer` removed: only the imported
// `buffer` module can satisfy it.
const savedBuffer = globalThis.Buffer
try {
  globalThis.Buffer = undefined
  await import(pathToFileURL(mainPath).href)
  const result = globalThis.__dynamicBufferBundle
  assert.equal(result.hex, '01020304', 'bundled main entry should decode to 01020304')
  assert.equal(result.isDynamicBuffer, true, 'DynamicBuffer.isDynamicBuffer should work')
  assert.equal(result.outOfBounds, 'function', 'OutOfBoundsError should be exported')
} finally {
  globalThis.Buffer = savedBuffer
}

// 2. The `readable` subpath is opt-in and is the only place that pulls stream.
const readablePath = await bundle('test/bundling/readable.js', resolve(out, 'readable'), (id) => id === 'stream' || id === 'node:stream')
const readable = readFileSync(readablePath, 'utf8')
assert.match(readable, /asReadable/, 'readable subpath should export asReadable')
assert.match(readable, /DynamicBufferReadable/, 'readable subpath should export DynamicBufferReadable')
assert.match(readable, /from\s*['"]stream['"]/, 'readable subpath is the only place that imports stream')

console.log('bundling check OK: main entry bundles and runs without a global Buffer, and `stream` is opt-in via the readable subpath')
