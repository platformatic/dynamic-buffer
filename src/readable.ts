// Bare `stream` (not `node:stream`) so browser bundlers can resolve/polyfill it.
import { Readable } from 'stream'
import type { DynamicBuffer } from './index.ts'

export class DynamicBufferReadable extends Readable {
  #buffers: Buffer[]
  #index: number

  constructor (buffers: Buffer[]) {
    super()

    this.#buffers = buffers.slice()
    this.#index = 0
  }

  _read (_size: number): void {
    while (this.#index < this.#buffers.length) {
      if (!this.push(this.#buffers[this.#index++])) {
        return
      }
    }

    this.push(null)
  }
}

// Stream a DynamicBuffer without pulling `node:stream` into the main entry.
// Import from the `@platformatic/dynamic-buffer/readable` subpath.
export function asReadable (buffer: DynamicBuffer): DynamicBufferReadable {
  return new DynamicBufferReadable(buffer.buffers)
}
