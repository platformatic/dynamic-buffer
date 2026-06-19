import { Readable } from 'node:stream'

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
