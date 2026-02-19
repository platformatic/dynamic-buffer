import { run, bench, group } from 'mitata'
import BufferList from 'bl'
import { DynamicBuffer } from './src/index.ts'

function createTestBuffers (count: number, size: number): Buffer[] {
  const buffers: Buffer[] = []
  for (let i = 0; i < count; i++) {
    const buf = Buffer.allocUnsafe(size)
    buf.fill(i % 256)
    buffers.push(buf)
  }
  return buffers
}

const smallBuffers = createTestBuffers(10, 100)
const mediumBuffers = createTestBuffers(50, 200)
const largeBuffers = createTestBuffers(100, 1000)

group('Construction', () => {
  bench('DynamicBuffer - small buffers', () => {
    return new DynamicBuffer(smallBuffers)
  })

  bench('BufferList - small buffers', () => {
    return new BufferList(smallBuffers)
  })

  bench('DynamicBuffer - medium buffers', () => {
    return new DynamicBuffer(mediumBuffers)
  })

  bench('BufferList - medium buffers', () => {
    return new BufferList(mediumBuffers)
  })

  bench('DynamicBuffer - large buffers', () => {
    return new DynamicBuffer(largeBuffers)
  })

  bench('BufferList - large buffers', () => {
    return new BufferList(largeBuffers)
  })
})

group('Append Operations', () => {
  const testBuffer = Buffer.allocUnsafe(100).fill(42)

  bench('DynamicBuffer - append', () => {
    const db = new DynamicBuffer()
    for (let i = 0; i < 100; i++) {
      db.append(testBuffer)
    }
    return db
  })

  bench('BufferList - append', () => {
    const bl = new BufferList()
    for (let i = 0; i < 100; i++) {
      bl.append(testBuffer)
    }
    return bl
  })
})

group('Reading Operations', () => {
  const dynamicBuffer = new DynamicBuffer(mediumBuffers)
  const bufferList = new BufferList(mediumBuffers)

  bench('DynamicBuffer - readUInt32BE', () => {
    let sum = 0
    for (let i = 0; i < dynamicBuffer.length - 4; i += 4) {
      sum += dynamicBuffer.readUInt32BE(i)
    }
    return sum
  })

  bench('BufferList - readUInt32BE', () => {
    let sum = 0
    for (let i = 0; i < bufferList.length - 4; i += 4) {
      sum += bufferList.readUInt32BE(i)
    }
    return sum
  })

  bench('DynamicBuffer - readUInt8', () => {
    let sum = 0
    for (let i = 0; i < Math.min(1000, dynamicBuffer.length); i++) {
      sum += dynamicBuffer.readUInt8(i)
    }
    return sum
  })

  bench('BufferList - readUInt8', () => {
    let sum = 0
    for (let i = 0; i < Math.min(1000, bufferList.length); i++) {
      sum += bufferList.readUInt8(i)
    }
    return sum
  })
})

group('Slice Operations', () => {
  const dynamicBuffer = new DynamicBuffer(mediumBuffers)
  const bufferList = new BufferList(mediumBuffers)

  bench('DynamicBuffer - slice', () => {
    return dynamicBuffer.slice(100, 500)
  })

  bench('BufferList - slice', () => {
    return bufferList.slice(100, 500)
  })

  bench('DynamicBuffer - subarray', () => {
    return dynamicBuffer.subarray(100, 500)
  })

  bench('BufferList - subarray', () => {
    return bufferList.subarray(100, 500)
  })
})

group('Buffer Access', () => {
  const dynamicBuffer = new DynamicBuffer(smallBuffers)
  const bufferList = new BufferList(smallBuffers)

  bench('DynamicBuffer - get buffer property', () => {
    return dynamicBuffer.buffer
  })

  bench('BufferList - slice entire buffer', () => {
    return bufferList.slice()
  })
})

group('Consume Operations', () => {
  bench('DynamicBuffer - consume', () => {
    const db = new DynamicBuffer(smallBuffers.map((b) => b.slice()))
    for (let i = 0; i < 5; i++) {
      db.consume(10)
    }
    return db
  })

  bench('BufferList - consume', () => {
    const bl = new BufferList(smallBuffers.map((b) => b.slice()))
    for (let i = 0; i < 5; i++) {
      bl.consume(10)
    }
    return bl
  })
})

group('Variable Integer Operations', () => {
  const testValues = [1, 127, 128, 16383, 16384, 2097151, 2097152]

  bench('DynamicBuffer - write/read varints', () => {
    const db = new DynamicBuffer()

    for (const value of testValues) {
      db.writeUnsignedVarInt(value)
    }

    let offset = 0
    let sum = 0
    for (let i = 0; i < testValues.length; i++) {
      const [value, bytesRead] = db.readUnsignedVarInt(offset)
      sum += value
      offset += bytesRead
    }

    return sum
  })
})

group('Memory Usage Simulation', () => {
  const chunks: Buffer[] = []
  for (let i = 0; i < 1000; i++) {
    chunks.push(Buffer.allocUnsafe(Math.floor(Math.random() * 100 + 50)))
  }

  bench('DynamicBuffer - incremental build', () => {
    const db = new DynamicBuffer()
    for (const chunk of chunks) {
      db.append(chunk)
    }
    return db.length
  })

  bench('BufferList - incremental build', () => {
    const bl = new BufferList()
    for (const chunk of chunks) {
      bl.append(chunk)
    }
    return bl.length
  })
})

console.log('Running DynamicBuffer vs BufferList (bl) benchmarks...\n')
run()
