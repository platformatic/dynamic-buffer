import { Buffer } from 'buffer'
import { DynamicBuffer } from '@platformatic/dynamic-buffer'
import { asReadable, DynamicBufferReadable } from '@platformatic/dynamic-buffer/readable'

const db = new DynamicBuffer([Buffer.from([5, 6])])
const stream = asReadable(db)

globalThis.__readableBundle = {
  asReadable: typeof asReadable,
  ctor: typeof DynamicBufferReadable,
  isStream: stream instanceof DynamicBufferReadable
}
