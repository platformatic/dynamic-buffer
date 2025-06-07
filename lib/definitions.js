'use strict'

const INT8_SIZE = 1
const INT16_SIZE = 2
const INT32_SIZE = 4
const INT64_SIZE = 8
const UUID_SIZE = 16

const EMPTY_BUFFER = Buffer.alloc(0)
const EMPTY_UUID = Buffer.alloc(UUID_SIZE)

// Since it is serialized at either 0 (for nullable) or 1 (since length is stored as length + 1), it always uses a single byte
const EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE = INT8_SIZE

// TODO(ShogunPanda): Tagged fields are not supported yet
const EMPTY_TAGGED_FIELDS_BUFFER = Buffer.from([0])

module.exports = {
  INT8_SIZE,
  INT16_SIZE,
  INT32_SIZE,
  INT64_SIZE,
  UUID_SIZE,
  EMPTY_BUFFER,
  EMPTY_UUID,
  EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE,
  EMPTY_TAGGED_FIELDS_BUFFER
}
