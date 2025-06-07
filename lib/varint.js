'use strict'

const MOST_SIGNIFICANT_BIT_FLAG = 0x80 // 128 or 1000 0000
const MOST_SIGNIFICANT_BIT_FLAG_64 = 0x80n // 128 or 1000 0000
const LEAST_SIGNIFICANT_7_BITS = 0x7f // 127 or 0111 1111
const LEAST_SIGNIFICANT_7_BITS_64 = 0x7fn // 127 or 0111 1111

/**
 * This is used in varint to check if there are any other bits set after the first 7 bits,
 * which means it still needs more than a byte to represent the number in varint encoding
 *
 * 0xffffffff - 0x7f
 */
const BITS_8PLUS_MASK = 0xffffff80
const BITS_8PLUS_MASK_64 = 0xffffff80n

/**
 * @param {number} value
 * @returns {number}
 */
function intZigZagEncode (value) {
  return (value << 1) ^ (value >> 31)
}

/**
 * @param {number} value
 * @returns {number}
 */
function intZigZagDecode (value) {
  return (value >> 1) ^ -(value & 1)
}

/**
 * @param {bigint} value
 * @returns {bigint}
 */
function int64ZigZagEncode (value) {
  return (value << 1n) ^ (value >> 31n)
}

/**
 * @param {bigint} value
 * @returns {bigint}
 */
function int64ZigZagDecode (value) {
  return (value >> 1n) ^ -(value & 1n)
}

/**
 * @param {number} value
 * @returns {number}
 */
function sizeOfUnsignedVarInt (value) {
  let bytes = 1

  while ((value & BITS_8PLUS_MASK) !== 0) {
    bytes++
    value >>>= 7
  }

  return bytes
}

/**
 * @param {bigint} value
 * @returns {number}
 */
function sizeOfUnsignedVarInt64 (value) {
  let bytes = 1

  while ((value & BITS_8PLUS_MASK_64) !== 0n) {
    bytes++
    value >>= 7n
  }

  return bytes
}

module.exports = {
  MOST_SIGNIFICANT_BIT_FLAG,
  MOST_SIGNIFICANT_BIT_FLAG_64,
  LEAST_SIGNIFICANT_7_BITS,
  LEAST_SIGNIFICANT_7_BITS_64,
  BITS_8PLUS_MASK,
  BITS_8PLUS_MASK_64,
  intZigZagEncode,
  intZigZagDecode,
  int64ZigZagEncode,
  int64ZigZagDecode,
  sizeOfUnsignedVarInt,
  sizeOfUnsignedVarInt64
}
