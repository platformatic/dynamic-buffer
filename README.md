# dynamic-buffer

A fast, efficient list of Buffer objects optimized for reading and writing across multiple binary chunks without unnecessary copying.

## Installation

```bash
npm install dynamic-buffer
```

## Features

- **Zero-copy operations**: Read and write across buffer boundaries without copying data
- **Buffer-compatible API**: Familiar methods that mirror Node.js Buffer API
- **Variable-length integers**: Built-in support for varint encoding with ZigZag for signed values
- **Memory efficient**: Only concatenates buffers when explicitly requested
- **TypeScript ready**: Written in JavaScript with clear type patterns

## Quick Start

```javascript
const { DynamicBuffer } = require('dynamic-buffer')

// Create from existing buffers
const db = new DynamicBuffer([
  Buffer.from([1, 2]),
  Buffer.from([3, 4, 5])
])

// Read across buffer boundaries seamlessly
console.log(db.readUInt16BE(1)) // Reads bytes 1-2: [2, 3]

// Append more data
db.append(Buffer.from([6, 7, 8]))

// Access the full buffer when needed
console.log(db.buffer) // <Buffer 01 02 03 04 05 06 07 08>
```

## API Reference

### Constructor

#### `new DynamicBuffer([buffers])`

Creates a new DynamicBuffer instance.

- `buffers` (Buffer | Buffer[]): Optional initial buffer(s)

```javascript
const db1 = new DynamicBuffer() // Empty
const db2 = new DynamicBuffer(Buffer.from([1, 2, 3])) // Single buffer
const db3 = new DynamicBuffer([buf1, buf2, buf3]) // Multiple buffers
```

### Properties

#### `length`
Returns the total length of all buffers combined.

#### `buffer`
Returns a concatenated Buffer of all internal buffers. Only performs concatenation when accessed.

#### `buffers`
Direct access to the internal buffer array (use with caution).

### Static Methods

#### `DynamicBuffer.isDynamicBuffer(obj)`
Checks if an object is a DynamicBuffer instance.

```javascript
DynamicBuffer.isDynamicBuffer(new DynamicBuffer()) // true
DynamicBuffer.isDynamicBuffer(Buffer.from([1, 2])) // false
```

### Buffer Management

#### `append(buffer)`
Appends a buffer to the end. Returns `this` for chaining.

```javascript
db.append(Buffer.from([1, 2, 3]))
```

#### `prepend(buffer)`
Prepends a buffer to the beginning. Returns `this` for chaining.

```javascript
db.prepend(Buffer.from([1, 2, 3]))
```

#### `appendFrom(dynamicBuffer)`
Appends all buffers from another DynamicBuffer. Returns `this` for chaining.

```javascript
const other = new DynamicBuffer([buf1, buf2])
db.appendFrom(other)
```

#### `prependFrom(dynamicBuffer)`
Prepends all buffers from another DynamicBuffer. Returns `this` for chaining.

```javascript
db.prependFrom(other)
```

### Data Access

#### `get(offset)`
Returns the byte at the specified offset.

```javascript
const byte = db.get(5) // Returns byte at position 5
```

#### `slice(start, end)`
Returns a new Buffer containing the specified slice.

```javascript
const slice = db.slice(2, 8) // Buffer from positions 2-7
```

#### `subarray(start, end)`
Returns a new DynamicBuffer containing the specified range.

```javascript
const sub = db.subarray(2, 8) // DynamicBuffer from positions 2-7
```

#### `toString(encoding, start, end)`
Converts to string using the specified encoding.

```javascript
const str = db.toString('utf8', 0, 10)
```

### Buffer Operations

#### `clone(deep = false)`
Creates a copy of the DynamicBuffer.

- `deep` (boolean): If true, creates copies of internal buffers

```javascript
const shallow = db.clone()
const deep = db.clone(true)
```

#### `consume(offset)`
Removes bytes from the beginning up to the specified offset. Returns `this` for chaining.

```javascript
db.consume(4) // Remove first 4 bytes
```

### Reading Methods

All read methods support an optional `offset` parameter (defaults to 0).

#### Integer Reading
```javascript
db.readUInt8(offset)
db.readInt8(offset)
db.readUInt16BE(offset)
db.readUInt16LE(offset)
db.readInt16BE(offset)
db.readInt16LE(offset)
db.readUInt32BE(offset)
db.readUInt32LE(offset)
db.readInt32BE(offset)
db.readInt32LE(offset)
db.readBigUInt64BE(offset)
db.readBigUInt64LE(offset)
db.readBigInt64BE(offset)
db.readBigInt64LE(offset)
```

#### Floating Point Reading
```javascript
db.readFloatBE(offset)
db.readFloatLE(offset)
db.readDoubleBE(offset)
db.readDoubleLE(offset)
```

#### Variable-Length Integer Reading
Returns `[value, bytesRead]` tuple.

```javascript
const [value, bytesRead] = db.readUnsignedVarInt(offset)
const [value, bytesRead] = db.readUnsignedVarInt64(offset)
const [value, bytesRead] = db.readVarInt(offset) // ZigZag decoded
const [value, bytesRead] = db.readVarInt64(offset) // ZigZag decoded
```

### Writing Methods

All write methods support an optional `append` parameter (defaults to true). When `append` is false, data is prepended.

#### Integer Writing
```javascript
db.writeUInt8(value, append)
db.writeInt8(value, append)
db.writeUInt16BE(value, append)
db.writeUInt16LE(value, append)
db.writeInt16BE(value, append)
db.writeInt16LE(value, append)
db.writeUInt32BE(value, append)
db.writeUInt32LE(value, append)
db.writeInt32BE(value, append)
db.writeInt32LE(value, append)
db.writeBigUInt64BE(value, append)
db.writeBigUInt64LE(value, append)
db.writeBigInt64BE(value, append)
db.writeBigInt64LE(value, append)
```

#### Floating Point Writing
```javascript
db.writeFloatBE(value, append)
db.writeFloatLE(value, append)
db.writeDoubleBE(value, append)
db.writeDoubleLE(value, append)
```

#### Variable-Length Integer Writing
```javascript
db.writeUnsignedVarInt(value, append)
db.writeUnsignedVarInt64(value, append)
db.writeVarInt(value, append) // ZigZag encoded
db.writeVarInt64(value, append) // ZigZag encoded
```

## Examples

### Building a Protocol Message

```javascript
const { DynamicBuffer } = require('dynamic-buffer')

const message = new DynamicBuffer()

// Write header
message.writeUInt32BE(0x12345678) // Magic number
message.writeUInt16BE(1) // Version
message.writeVarInt(payload.length) // Payload length

// Append payload
message.append(payload)

// Send the complete message
socket.write(message.buffer)
```

### Parsing Streaming Data

```javascript
const parser = new DynamicBuffer()

socket.on('data', (chunk) => {
  parser.append(chunk)
  
  while (parser.length >= 4) {
    const messageLength = parser.readUInt32BE(0)
    
    if (parser.length >= 4 + messageLength) {
      // Extract complete message
      const message = parser.slice(4, 4 + messageLength)
      processMessage(message)
      
      // Remove processed data
      parser.consume(4 + messageLength)
    } else {
      break // Wait for more data
    }
  }
})
```

### Working with Variable-Length Integers

```javascript
const db = new DynamicBuffer()

// Write variable-length integers
db.writeVarInt(42)      // Positive number
db.writeVarInt(-42)     // Negative number (ZigZag encoded)
db.writeVarInt64(123456789012345n) // Large number

// Read them back
let offset = 0
const [val1, bytes1] = db.readVarInt(offset)
offset += bytes1

const [val2, bytes2] = db.readVarInt(offset)
offset += bytes2

const [val3, bytes3] = db.readVarInt64(offset)
```

## Performance

DynamicBuffer is designed for scenarios where you need to:
- Build up binary data incrementally without knowing the final size
- Read structured data from multiple buffer chunks
- Avoid expensive buffer concatenation operations
- Work with streaming data where messages may span multiple chunks

The library only allocates new memory when absolutely necessary (like calling `.buffer` or `.slice()`).

## License

Apache-2.0

## Contributing

This project follows standard Node.js conventions. Run `npm test` to execute the test suite.