# @platformatic/dynamic-buffer

A fast, efficient list of `Buffer` objects optimized for reading and writing across multiple binary chunks without unnecessary copying.

`DynamicBuffer` lets you append/prepend chunks, read values across chunk boundaries, and encode/decode varints without manually concatenating buffers every time.

## Installation

```bash
npm i @platformatic/dynamic-buffer
```

## Features

- **Zero-copy operations**: read and write across buffer boundaries without eagerly concatenating
- **Buffer-compatible API**: familiar methods mirroring Node.js `Buffer`
- **Variable-length integers**: built-in unsigned varint and zig-zag varint support
- **Memory efficient**: internal chunks are only concatenated when explicitly requested
- **TypeScript ready**: exports type definitions

## Quick start

```ts
import { DynamicBuffer } from '@platformatic/dynamic-buffer'

const db = new DynamicBuffer([Buffer.from([1, 2]), Buffer.from([3, 4, 5])])

// Read across boundaries
console.log(db.readUInt16BE(1)) // bytes [2, 3]

// Append data
db.append(Buffer.from([6, 7, 8]))

// Contiguous buffer view (concatenates on access)
console.log(db.buffer) // <Buffer 01 02 03 04 05 06 07 08>
```

## API reference

### Exports

- `DynamicBuffer`
- `OutOfBoundsError`

### Constructor

#### `new DynamicBuffer([buffers])`

Creates a new `DynamicBuffer` instance.

- `buffers` (`Buffer | Buffer[]`): optional initial buffer(s)

```ts
const db1 = new DynamicBuffer()
const db2 = new DynamicBuffer(Buffer.from([1, 2, 3]))
const db3 = new DynamicBuffer([Buffer.from([1]), Buffer.from([2, 3])])
```

### Properties

#### `length`

Total length (in bytes) across all internal buffers.

#### `buffer`

Returns a contiguous `Buffer` of all internal chunks.

- Returns the original chunk when there is only one buffer
- Concatenates only when there are multiple chunks

#### `buffers`

Direct access to internal chunks (`Buffer[]`). Use with caution.

### Static methods

#### `DynamicBuffer.isDynamicBuffer(obj)`

Checks whether a value is a `DynamicBuffer` instance.

```ts
DynamicBuffer.isDynamicBuffer(new DynamicBuffer()) // true
DynamicBuffer.isDynamicBuffer(Buffer.from([1, 2])) // false
```

### Buffer management

#### `append(buffer)`

Appends a chunk. Returns `this`.

#### `prepend(buffer)`

Prepends a chunk. Returns `this`.

#### `appendFrom(dynamicBuffer)`

Appends chunks from another `DynamicBuffer`. Returns `this`.

#### `prependFrom(dynamicBuffer)`

Prepends chunks from another `DynamicBuffer`. Returns `this`.

### Data access

#### `get(offset)`

Returns the byte at `offset`.

#### `slice(start, end)`

Returns a `Buffer` for the selected range.

#### `subarray(start, end)`

Returns a new `DynamicBuffer` for the selected range.

#### `toString(encoding, start, end)`

Converts a selected range to string.

### Buffer operations

#### `clone(deep = false)`

Creates a copy of the `DynamicBuffer`.

- `deep = false`: copies the chunk list only (shared chunk references)
- `deep = true`: clones each chunk via `Buffer.slice()`

#### `consume(offset)`

Consumes bytes from the front up to `offset`. Returns `this`.

### Reading methods

All read methods support an optional `offset` (default `0`, except varints where offset is required).

#### Integer reading

- `readUInt8`, `readUInt16BE`, `readUInt16LE`, `readUInt32BE`, `readUInt32LE`
- `readInt8`, `readInt16BE`, `readInt16LE`, `readInt32BE`, `readInt32LE`
- `readBigUInt64BE`, `readBigUInt64LE`
- `readBigInt64BE`, `readBigInt64LE`

#### Floating-point reading

- `readFloatBE`, `readFloatLE`
- `readDoubleBE`, `readDoubleLE`

#### Variable-length integer reading

Returns a tuple: `[value, bytesRead]`

- `readUnsignedVarInt(offset): [number, number]`
- `readUnsignedVarInt64(offset): [bigint, number]`
- `readVarInt(offset): [number, number]` (zig-zag decoded)
- `readVarInt64(offset): [bigint, number]` (zig-zag decoded)

### Writing methods

Most write methods accept `append = true` (when `false`, data is prepended) and return `this`.

#### Integer writing

- `writeUInt8`, `writeUInt16BE`, `writeUInt16LE`, `writeUInt32BE`, `writeUInt32LE`
- `writeInt8`, `writeInt16BE`, `writeInt16LE`, `writeInt32BE`, `writeInt32LE`
- `writeBigUInt64BE`, `writeBigUInt64LE`
- `writeBigInt64BE`, `writeBigInt64LE`

#### Floating-point writing

- `writeFloatBE`, `writeFloatLE`
- `writeDoubleBE`, `writeDoubleLE`

#### Variable-length integer writing

- `writeUnsignedVarInt(value, append)`
- `writeUnsignedVarInt64(value, append)`
- `writeVarInt(value, append)` (zig-zag encoded)
- `writeVarInt64(value, append)` (zig-zag encoded)

> Note: varint write methods append/prepend encoded bytes but do not return `this`.

## Examples

### Building a protocol message

```ts
import { DynamicBuffer } from '@platformatic/dynamic-buffer'

const payload = Buffer.from('hello')
const message = new DynamicBuffer()

message.writeUInt32BE(0x12345678) // magic
message.writeUInt16BE(1) // version
message.writeVarInt(payload.length) // payload size
message.append(payload)

socket.write(message.buffer)
```

### Parsing streaming data

```ts
import { DynamicBuffer } from '@platformatic/dynamic-buffer'

const parser = new DynamicBuffer()

socket.on('data', chunk => {
  parser.append(chunk)

  while (parser.length >= 4) {
    const messageLength = parser.readUInt32BE(0)

    if (parser.length >= 4 + messageLength) {
      const message = parser.slice(4, 4 + messageLength)
      processMessage(message)
      parser.consume(4 + messageLength)
    } else {
      break
    }
  }
})
```

### Working with varints

```ts
import { DynamicBuffer } from '@platformatic/dynamic-buffer'

const db = new DynamicBuffer()

db.writeVarInt(42)
db.writeVarInt(-42)
db.writeVarInt64(123456789012345n)

let offset = 0
const [v1, b1] = db.readVarInt(offset)
offset += b1

const [v2, b2] = db.readVarInt(offset)
offset += b2

const [v3] = db.readVarInt64(offset)
```

## Error handling

Out-of-range access throws `OutOfBoundsError` with `code: 'OUT_OF_BOUNDS'`.

## License

Apache-2.0. See [LICENSE](LICENSE).
