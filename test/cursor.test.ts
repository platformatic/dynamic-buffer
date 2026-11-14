import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import { DynamicBuffer, OutOfBoundsError } from '../src/index.ts'

// Deterministic PRNG so the test is reproducible.
function mulberry32 (seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test('consume spanning multiple buffers + prepend/read across cursor', () => {
  const db = new DynamicBuffer([Buffer.from([1, 2, 3]), Buffer.from([4, 5]), Buffer.from([6, 7, 8])])

  db.consume(4) // drop [1,2,3,4]
  strictEqual(db.length, 4)
  deepStrictEqual(db.buffer, Buffer.from([5, 6, 7, 8]))
  strictEqual(db.get(0), 5)
  strictEqual(db.get(3), 8)
  deepStrictEqual(db.slice(0, 2), Buffer.from([5, 6]))
  deepStrictEqual(db.subarray(1, 3).buffer, Buffer.from([6, 7]))

  // Prepend should insert at the true logical front.
  db.prepend(Buffer.from([9, 10]))
  strictEqual(db.length, 6)
  deepStrictEqual(db.buffer, Buffer.from([9, 10, 5, 6, 7, 8]))

  // Consume everything -> empty.
  db.consume(6)
  strictEqual(db.length, 0)
  deepStrictEqual(db.buffer, Buffer.alloc(0))
  strictEqual(db.buffers.length, 0)
})

test('buffers getter reflects the trimmed logical view after consume', () => {
  const db = new DynamicBuffer([Buffer.from([1, 2]), Buffer.from([3, 4, 5]), Buffer.from([6, 7, 8, 9])])

  db.consume(1)
  strictEqual(db.buffers.length, 3)
  strictEqual(db.buffers[0].length, 1)
  deepStrictEqual(db.buffers[0], Buffer.from([2]))

  db.consume(1)
  strictEqual(db.buffers.length, 2)
  strictEqual(db.buffers[0].length, 3)
  deepStrictEqual(db.buffers[0], Buffer.from([3, 4, 5]))

  db.consume(4)
  strictEqual(db.buffers.length, 1)
  deepStrictEqual(db.buffers[0], Buffer.from([7, 8, 9]))
})

test('read operations are correct across the head cursor', () => {
  const db = new DynamicBuffer([Buffer.from([0x11, 0x22]), Buffer.from([0x33])])
  db.consume(1) // logical = [0x22, 0x33]
  strictEqual(db.readUInt8(0), 0x22)
  strictEqual(db.readUInt8(1), 0x33)
  strictEqual(db.readUInt16BE(0), 0x2233)
  // readUInt8 at offset 0 then readUInt16BE again must still be identical
  strictEqual(db.readUInt16BE(0), 0x2233)
})

test('consume from the head of a partially-consumed buffer does not rescan from zero', () => {
  const db = new DynamicBuffer([Buffer.from([1, 2, 3, 4, 5])])
  db.consume(2)
  strictEqual(db.length, 3)
  deepStrictEqual(db.buffer, Buffer.from([3, 4, 5]))
  db.consume(1)
  strictEqual(db.length, 2)
  deepStrictEqual(db.buffer, Buffer.from([4, 5]))
  db.consume(2)
  strictEqual(db.length, 0)
  deepStrictEqual(db.buffer, Buffer.alloc(0))
})

test('write with prepend (append=false) after consume lands at the logical front', () => {
  const db = new DynamicBuffer([Buffer.from([1, 2, 3])])
  db.consume(2) // logical = [3]
  db.writeUInt8(0xaa, false) // prepend
  strictEqual(db.length, 2)
  deepStrictEqual(db.buffer, Buffer.from([0xaa, 3]))
})

test('randomized differential test against a reference Buffer', () => {
  const rnd = mulberry32(0xc0ffee)

  for (let round = 0; round < 40; round++) {
    const db = new DynamicBuffer()
    // Reference model: a single contiguous Buffer holding the current logical content.
    let ref = Buffer.alloc(0)

    for (let step = 0; step < 400; step++) {
      const op = rnd()
      const dbLen = db.length

      if (op < 0.35) {
        // append a random chunk (1..20 bytes)
        const b = Buffer.from(Array.from({ length: 1 + Math.floor(rnd() * 20) }, () => Math.floor(rnd() * 256)))
        db.append(b)
        ref = Buffer.concat([ref, b])
      } else if (op < 0.5 && dbLen > 0) {
        // consume a random amount
        const n = 1 + Math.floor(rnd() * Math.min(dbLen, 25))
        db.consume(n)
        ref = ref.subarray(n)
      } else if (op < 0.65 && dbLen > 0) {
        db.consume(0) // no-op, keep parity
      } else {
        // read a byte at a valid offset
        if (dbLen > 0) {
          const offset = Math.floor(rnd() * dbLen)
          strictEqual(db.get(offset), ref[offset], `get mismatch at round=${round} step=${step} offset=${offset}`)
        }
      }

      // Invariants
      strictEqual(db.length, ref.length, `length mismatch round=${round} step=${step}`)
      deepStrictEqual(db.buffer, ref, `buffer mismatch round=${round} step=${step}`)
    }
  }
})

test('incomplete varint throws OutOfBoundsError instead of reading past the end', () => {
  // 0xFF has the most-significant bit set (continuation) but no further byte.
  const db = new DynamicBuffer([Buffer.from([0xff])])
  let threw = false
  try {
    db.readUnsignedVarInt(0)
  } catch (err) {
    threw = err instanceof OutOfBoundsError
  }
  strictEqual(threw, true)

  // Every byte demands another byte but none exists.
  const partial = new DynamicBuffer([Buffer.from([0xff, 0xff])])
  threw = false
  try {
    partial.readUnsignedVarInt(0)
  } catch (err) {
    threw = err instanceof OutOfBoundsError
  }
  strictEqual(threw, true)

  // A valid varint that terminates exactly at the last byte still works.
  const ok = new DynamicBuffer([Buffer.from([0x81]), Buffer.from([0x01])])
  const [value, read] = ok.readUnsignedVarInt(0)
  strictEqual(read, 2)
  strictEqual(value, 0x81)
})

test('consume rejects out-of-bounds', () => {
  const db = new DynamicBuffer([Buffer.from([1, 2])])
  db.consume(1)
  strictEqual(db.length, 1)
  // consuming more than length throws
  let threw = false
  try {
    db.consume(2)
  } catch (err) {
    threw = err instanceof OutOfBoundsError
  }
  strictEqual(threw, true)
})
