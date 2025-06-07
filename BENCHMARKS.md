# Benchmark Results

Performance comparison between DynamicBuffer and BufferList (bl library) using mitata benchmarking.

## Key Performance Highlights

### Construction Performance
- **DynamicBuffer**: 47-214 ns per operation
- **BufferList**: 973 ns - 4.33 µs per operation
- **Winner**: DynamicBuffer (20-40x faster)

### Append Operations
- **DynamicBuffer**: 207 ns per iteration
- **BufferList**: 4.69 µs per iteration  
- **Winner**: DynamicBuffer (22x faster)

### Reading Operations
- **readUInt32BE**: DynamicBuffer 57 µs vs BufferList 106 µs (1.9x faster)
- **readUInt8**: DynamicBuffer 4.32 µs vs BufferList 38.13 µs (8.8x faster)

### Slice Operations
- **slice()**: Comparable performance (~71-74 ns)
- **subarray()**: DynamicBuffer supports it, BufferList doesn't

### Consume Operations
- **DynamicBuffer**: 437 ns per operation
- **BufferList**: 1.32 µs per operation
- **Winner**: DynamicBuffer (3x faster)

### Memory Usage Simulation (1000 random chunks)
- **DynamicBuffer**: 2.30 µs
- **BufferList**: 39.54 µs  
- **Winner**: DynamicBuffer (17x faster)

## Unique Features

### Variable-Length Integers
- DynamicBuffer has built-in varint support (357 ns for write/read cycle)
- BufferList has no native varint support

### API Differences
- DynamicBuffer supports `subarray()` method
- BufferList doesn't implement `subarray()`
- Both support similar reading/writing operations

## Test Environment
- **CPU**: Apple M4 Max (~4.18 GHz)
- **Runtime**: Node.js 22.16.0 (arm64-darwin)
- **Benchmark Tool**: mitata

## Conclusion

DynamicBuffer significantly outperforms BufferList in most operations, especially:
- Construction and append operations (20-40x faster)
- Memory-intensive operations (17x faster) 
- Individual byte reading (8.8x faster)
- Consume operations (3x faster)

The performance gains come from DynamicBuffer's optimized internal structure and zero-copy design principles.