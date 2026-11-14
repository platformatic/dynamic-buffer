import { EMPTY_BUFFER, INT16_SIZE, INT32_SIZE, INT64_SIZE, INT8_SIZE } from './definitions.ts'
import { DynamicBufferReadable } from './readable.ts'
import {
  BITS_8PLUS_MASK,
  BITS_8PLUS_MASK_64,
  int64ZigZagDecode,
  int64ZigZagEncode,
  intZigZagDecode,
  intZigZagEncode,
  LEAST_SIGNIFICANT_7_BITS,
  LEAST_SIGNIFICANT_7_BITS_64,
  MOST_SIGNIFICANT_BIT_FLAG,
  MOST_SIGNIFICANT_BIT_FLAG_64,
  sizeOfUnsignedVarInt,
  sizeOfUnsignedVarInt64
} from './varint.ts'

const instanceIdentifier = Symbol('plt.dynamicBuffer.instanceIdentifier')

export * from './definitions.ts'
export * from './readable.ts'
export * from './varint.ts'

export class OutOfBoundsError extends Error {
  code: string

  constructor (message: string) {
    super(message)
    this.code = 'OUT_OF_BOUNDS'
  }
}

export class DynamicBuffer {
  // The physical chunk array. The logical content is:
  //   #chunks[#headIndex].subarray(#headOffset) ++ #chunks[#headIndex + 1..]
  // Keeping a head cursor (instead of physically trimming/splicing on every
  // consume) makes `consume` amortized O(1) per chunk rather than O(n^2), while
  // `buffers` still exposes a fully-materialized (trimmed) view on demand.
  #chunks: Buffer[]
  #headIndex: number
  #headOffset: number
  length: number
  #readBuffer: Buffer; // This is used from the fixed length readers
  [instanceIdentifier]: boolean

  static isDynamicBuffer (target: any): boolean {
    return target?.[instanceIdentifier] === true
  }

  constructor (buffers?: Buffer | Buffer[]) {
    this.#chunks = []
    this.#headIndex = 0
    this.#headOffset = 0
    this.#readBuffer = Buffer.allocUnsafe(8)
    this[instanceIdentifier] = true
    this.length = 0

    if (buffers) {
      if (Buffer.isBuffer(buffers)) {
        this.#chunks.push(buffers)
        this.length += buffers.length
      } else {
        for (const buffer of buffers) {
          this.#chunks.push(buffer)
          this.length += buffer.length
        }
      }
    }
  }

  get buffer (): Buffer {
    if (this.length === 0) {
      return EMPTY_BUFFER
    }

    const chunks = this.#logicalChunks()

    if (chunks.length === 1) {
      return chunks[0]
    }

    return Buffer.concat(chunks, this.length)
  }

  get buffers (): Buffer[] {
    // Materialize the logical (trimmed) view so callers get a stable, writable
    // array of the current chunks — matching the historical contract.
    this.#compact()
    return this.#chunks
  }

  append (buffer: Buffer): this {
    this.#chunks.push(buffer)
    this.length += buffer.length

    return this
  }

  asReadable (): DynamicBufferReadable {
    return new DynamicBufferReadable(this.#logicalChunks())
  }

  prepend (buffer: Buffer): this {
    // Materialize first so prepended data sits at the true logical front.
    this.#compact()
    this.#chunks.unshift(buffer)
    this.length += buffer.length

    return this
  }

  appendFrom (DynamicBuffer: DynamicBuffer): this {
    const buffers = DynamicBuffer.#logicalChunks()

    for (let i = 0; i < buffers.length; i++) {
      this.#chunks.push(buffers[i])
    }

    this.length += DynamicBuffer.length

    return this
  }

  prependFrom (DynamicBuffer: DynamicBuffer): this {
    this.#compact()

    const buffers = DynamicBuffer.#logicalChunks()

    for (let i = buffers.length - 1; i >= 0; i--) {
      this.#chunks.unshift(buffers[i])
    }

    this.length += DynamicBuffer.length

    return this
  }

  subarray (start: number = 0, end?: number): DynamicBuffer {
    if (typeof end === 'undefined') {
      end = this.length
    }

    if (start < 0 || start > this.length || end > this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    if (start === end) {
      return new DynamicBuffer(EMPTY_BUFFER)
    }

    if (this.length === 0) {
      return new DynamicBuffer(EMPTY_BUFFER)
    }

    const chunks = this.#chunks

    // Fast path: a single untouched chunk covers the whole logical range.
    if (chunks.length === 1 && this.#headIndex === 0 && this.#headOffset === 0) {
      return new DynamicBuffer(chunks[0].subarray(start, end))
    }

    let length = end - start
    let [startBuffer, current] = this.#findInitialBuffer(start)
    start = startBuffer

    // The slice is in a single buffer
    if (length <= chunks[current].length - start) {
      return new DynamicBuffer(chunks[current].subarray(start, start + length))
    }

    // Copy all subarrays
    const buffers = []
    while (length > 0) {
      const currentEnd = Math.min(chunks[current].length - start, length)
      buffers.push(chunks[current].subarray(start, start + currentEnd))
      length -= currentEnd
      start = 0
      current++
    }

    return new DynamicBuffer(buffers)
  }

  slice (start: number = 0, end?: number): Buffer {
    if (typeof end === 'undefined') {
      end = this.length
    }

    if (start < 0 || start > this.length || end > this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    if (start === end) {
      return EMPTY_BUFFER
    }

    if (this.length === 0) {
      return EMPTY_BUFFER
    }

    const chunks = this.#chunks

    // Fast path: a single untouched chunk covers the whole logical range.
    if (chunks.length === 1 && this.#headIndex === 0 && this.#headOffset === 0) {
      return chunks[0].slice(start, end)
    }

    let position = 0
    let length = end - start
    let [startBuffer, current] = this.#findInitialBuffer(start)
    start = startBuffer

    // The slice is in a single buffer
    if (length <= chunks[current].length - start) {
      return chunks[current].slice(start, start + length)
    }

    // Copy all buffers
    const buffer = Buffer.allocUnsafe(length)
    while (length > 0) {
      const currentEnd = Math.min(chunks[current].length - start, length)
      chunks[current].copy(buffer, position, start, start + currentEnd)
      position += currentEnd
      length -= currentEnd
      start = 0
      current++
    }

    return buffer
  }

  clone (deep: boolean = false): DynamicBuffer {
    if (!deep) {
      return new DynamicBuffer(this.#logicalChunks())
    }

    const buffers = this.#logicalChunks().map(buffer => buffer.slice())

    return new DynamicBuffer(buffers)
  }

  consume (offset: number): this {
    if (offset < 0 || offset > this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    if (offset === 0) {
      return this
    }

    this.length -= offset

    const [start, current] = this.#findInitialBuffer(offset)

    this.#headIndex = current
    this.#headOffset = start

    // Periodically drop fully-consumed chunks so a streaming parser does not
    // retain them forever. Amortized O(1) per chunk.
    this.#maybeCompact()

    return this
  }

  toString (encoding: BufferEncoding = 'utf-8', start: number = 0, end?: number): string {
    return this.slice(start, end).toString(encoding)
  }

  get (offset: number): number {
    if (offset < 0 || offset >= this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    const [finalIndex, current] = this.#findInitialBuffer(offset)
    return this.#chunks[current][finalIndex]
  }

  readUInt8 (offset: number = 0): number {
    if (offset < 0 || offset >= this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    const [finalIndex, current] = this.#findInitialBuffer(offset)
    this.#readBuffer[0] = this.#chunks[current][finalIndex]

    return this.#readBuffer.readUInt8(0)
  }

  readUInt16BE (offset: number = 0): number {
    this.#readMultiple(offset, 2)
    return this.#readBuffer.readUInt16BE(0)
  }

  readUInt16LE (offset: number = 0): number {
    this.#readMultiple(offset, 2)
    return this.#readBuffer.readUInt16LE(0)
  }

  readUInt32BE (offset: number = 0): number {
    this.#readMultiple(offset, 4)
    return this.#readBuffer.readUInt32BE(0)
  }

  readUInt32LE (offset: number = 0): number {
    this.#readMultiple(offset, 4)
    return this.#readBuffer.readUInt32LE(0)
  }

  readBigUInt64BE (offset: number = 0): bigint {
    this.#readMultiple(offset, 8)
    return this.#readBuffer.readBigUInt64BE(0)
  }

  readBigUInt64LE (offset: number = 0): bigint {
    this.#readMultiple(offset, 8)
    return this.#readBuffer.readBigUInt64LE(0)
  }

  readUnsignedVarInt (offset: number): [number, number] {
    let i = 0
    let byte: number
    let value = 0
    let read = 0

    if (offset < 0 || offset >= this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    const available = this.length - offset

    // Find the initial buffer
    let [startOffset, current] = this.#findInitialBuffer(offset)

    do {
      if (read >= available) {
        // The most significant bit demands another byte that does not exist.
        throw new OutOfBoundsError('Incomplete varint.')
      }

      byte = this.#chunks[current][startOffset++]
      read++

      if (startOffset >= this.#chunks[current].length) {
        current++
        startOffset = 0
      }

      value += (byte & LEAST_SIGNIFICANT_7_BITS) << i
      i += 7
    } while (byte >= MOST_SIGNIFICANT_BIT_FLAG)

    return [value, read]
  }

  readUnsignedVarInt64 (offset: number): [bigint, number] {
    let i = 0n
    let byte: bigint
    let value = 0n
    let read = 0

    if (offset < 0 || offset >= this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    const available = this.length - offset

    // Find the initial buffer
    let [startOffset, current] = this.#findInitialBuffer(offset)

    do {
      if (read >= available) {
        // The most significant bit demands another byte that does not exist.
        throw new OutOfBoundsError('Incomplete varint.')
      }

      byte = BigInt(this.#chunks[current][startOffset++])
      read++

      if (startOffset >= this.#chunks[current].length) {
        current++
        startOffset = 0
      }

      value += (byte & LEAST_SIGNIFICANT_7_BITS_64) << i
      i += 7n
    } while (byte >= MOST_SIGNIFICANT_BIT_FLAG_64)

    return [value, read]
  }

  readInt8 (offset: number = 0): number {
    if (offset < 0 || offset >= this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    const [finalIndex, current] = this.#findInitialBuffer(offset)
    this.#readBuffer[0] = this.#chunks[current][finalIndex]

    return this.#readBuffer.readInt8(0)
  }

  readInt16BE (offset: number = 0): number {
    this.#readMultiple(offset, INT16_SIZE)
    return this.#readBuffer.readInt16BE(0)
  }

  readInt16LE (offset: number = 0): number {
    this.#readMultiple(offset, INT16_SIZE)
    return this.#readBuffer.readInt16LE(0)
  }

  readInt32BE (offset: number = 0): number {
    this.#readMultiple(offset, INT32_SIZE)
    return this.#readBuffer.readInt32BE(0)
  }

  readInt32LE (offset: number = 0): number {
    this.#readMultiple(offset, INT32_SIZE)
    return this.#readBuffer.readInt32LE(0)
  }

  readBigInt64BE (offset: number = 0): bigint {
    this.#readMultiple(offset, INT64_SIZE)
    return this.#readBuffer.readBigInt64BE(0)
  }

  readBigInt64LE (offset: number = 0): bigint {
    this.#readMultiple(offset, INT64_SIZE)
    return this.#readBuffer.readBigInt64LE(0)
  }

  readVarInt (offset: number): [number, number] {
    const [value, read] = this.readUnsignedVarInt(offset)
    return [intZigZagDecode(value), read]
  }

  readVarInt64 (offset: number): [bigint, number] {
    const [value, read] = this.readUnsignedVarInt64(offset)
    return [int64ZigZagDecode(value), read]
  }

  readFloatBE (offset: number = 0): number {
    this.#readMultiple(offset, INT32_SIZE)
    return this.#readBuffer.readFloatBE(0)
  }

  readFloatLE (offset: number = 0): number {
    this.#readMultiple(offset, INT32_SIZE)
    return this.#readBuffer.readFloatLE(0)
  }

  readDoubleBE (offset: number = 0): number {
    this.#readMultiple(offset, INT64_SIZE)
    return this.#readBuffer.readDoubleBE(0)
  }

  readDoubleLE (offset: number = 0): number {
    this.#readMultiple(offset, INT64_SIZE)
    return this.#readBuffer.readDoubleLE(0)
  }

  writeUInt8 (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT8_SIZE)
    buffer.writeUInt8(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeUInt16BE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT16_SIZE)
    buffer.writeUInt16BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeUInt16LE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT16_SIZE)
    buffer.writeUInt16LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeUInt32BE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeUInt32BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeUInt32LE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeUInt32LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeBigUInt64BE (value: bigint, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeBigUInt64BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeBigUInt64LE (value: bigint, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeBigUInt64LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeUnsignedVarInt (value: number, append: boolean = true): void {
    const buffer = Buffer.allocUnsafe(sizeOfUnsignedVarInt(value))
    let position = 0

    while ((value & BITS_8PLUS_MASK) !== 0) {
      buffer.writeUInt8((value & LEAST_SIGNIFICANT_7_BITS) | MOST_SIGNIFICANT_BIT_FLAG, position)
      position++
      value >>>= 7
    }

    buffer.writeUInt8(value & LEAST_SIGNIFICANT_7_BITS, position)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }
  }

  writeUnsignedVarInt64 (value: bigint, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(sizeOfUnsignedVarInt64(value))
    let position = 0

    while ((value & BITS_8PLUS_MASK_64) !== 0n) {
      buffer.writeUInt8(Number((value & LEAST_SIGNIFICANT_7_BITS_64) | MOST_SIGNIFICANT_BIT_FLAG_64), position)
      position++
      value >>= 7n
    }

    buffer.writeUInt8(Number(value & LEAST_SIGNIFICANT_7_BITS_64), position)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }
  }

  writeInt8 (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT8_SIZE)
    buffer.writeInt8(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeInt16BE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT16_SIZE)
    buffer.writeInt16BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeInt16LE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT16_SIZE)
    buffer.writeInt16LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeInt32BE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeInt32BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeInt32LE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeInt32LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeBigInt64BE (value: bigint, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeBigInt64BE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeBigInt64LE (value: bigint, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeBigInt64LE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeVarInt (value: number, append: boolean = true) {
    this.writeUnsignedVarInt(intZigZagEncode(value), append)
  }

  writeVarInt64 (value: bigint, append: boolean = true) {
    this.writeUnsignedVarInt64(int64ZigZagEncode(value), append)
  }

  writeFloatBE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeFloatBE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeFloatLE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT32_SIZE)
    buffer.writeFloatLE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeDoubleBE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeDoubleBE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  writeDoubleLE (value: number, append: boolean = true) {
    const buffer = Buffer.allocUnsafe(INT64_SIZE)
    buffer.writeDoubleLE(value)

    if (append) {
      this.append(buffer)
    } else {
      this.prepend(buffer)
    }

    return this
  }

  // Returns the logical (trimmed) chunk list without mutating `this`.
  #logicalChunks (): Buffer[] {
    const chunks = this.#chunks
    const hi = this.#headIndex

    if (hi === 0 && this.#headOffset === 0) {
      return chunks
    }

    const out = chunks.slice(hi)

    if (this.#headOffset > 0 && out.length > 0) {
      out[0] = out[0].subarray(this.#headOffset)
    }

    return out
  }

  // Drop fully-consumed chunks and trim the head. Mutates the internal
  // representation so it can be exposed through the `buffers` getter.
  #compact () {
    const chunks = this.#chunks
    const hi = this.#headIndex
    const ho = this.#headOffset

    if (hi === 0 && ho === 0) {
      return
    }

    const out = chunks.slice(hi)

    if (ho > 0 && out.length > 0) {
      out[0] = out[0].subarray(ho)
    }

    this.#chunks = out
    this.#headIndex = 0
    this.#headOffset = 0
  }

  #maybeCompact () {
    if (this.#headIndex === 0 && this.#headOffset === 0) {
      return
    }

    const length = this.#chunks.length

    // Compact when the head has consumed a substantial prefix, or everything.
    if (this.#headIndex >= length || (this.#headIndex > 0 && this.#headIndex >= length / 2)) {
      this.#compact()
    }
  }

  // Returns [offsetWithinChunk, chunkIndex] for a logical offset, accounting for
  // the head cursor. Scans from the head, never from index 0.
  #findInitialBuffer (start: number): [number, number] {
    let current = this.#headIndex
    let off = this.#headOffset + start

    while (current < this.#chunks.length && off >= this.#chunks[current].length) {
      off -= this.#chunks[current].length
      current++
    }

    return [off, current]
  }

  #readMultiple (index: number, length: number) {
    if (index < 0 || index + length > this.length) {
      throw new OutOfBoundsError('Out of bounds.')
    }

    let [startOffset, current] = this.#findInitialBuffer(index)

    for (let i = 0; i < length; i++) {
      this.#readBuffer[i] = this.#chunks[current][startOffset++]

      if (startOffset === this.#chunks[current].length) {
        current++
        startOffset = 0
      }
    }
  }
}
