import { Buffer } from 'buffer'
import { DynamicBuffer, OutOfBoundsError } from '@platformatic/dynamic-buffer'

const db = new DynamicBuffer([Buffer.from([1, 2]), Buffer.from([3, 4])])

globalThis.__dynamicBufferBundle = {
  hex: db.buffer.toString('hex'),
  isDynamicBuffer: DynamicBuffer.isDynamicBuffer(db),
  outOfBounds: typeof OutOfBoundsError
}
