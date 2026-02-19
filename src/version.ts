// This file is replaced by the postbuild script to be bundler friendly

import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const name = packageJson.name
export const version = packageJson.version
