# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dynamic Buffer is a Node.js library that provides a list-like structure for Buffer objects, optimized for reading and writing across multiple binary chunks without copying data unnecessarily. It's designed as a fast alternative to buffer concatenation.

## Core Architecture

The library consists of three main modules:

- **`lib/dynamic-buffer.js`**: Main `DynamicBuffer` class that manages an array of Buffer objects internally
- **`lib/varint.js`**: Variable-length integer encoding/decoding utilities with ZigZag encoding for signed integers
- **`lib/definitions.js`**: Constants for buffer sizes and empty buffer instances

The `DynamicBuffer` class maintains an internal array of Buffer objects and provides methods to read/write data across buffer boundaries without copying. Key design patterns:

- Buffer boundaries are handled transparently - reads/writes spanning multiple internal buffers work seamlessly
- Methods follow Node.js Buffer conventions (same method names, endianness options)
- Variable-length integer support uses standard varint encoding with ZigZag for signed values
- Instance detection via private Symbol for type checking

## Development Commands

- **Run tests**: `npm test` (runs eslint + Node.js test runner)
- **Fix linting**: `npm run lint:fix`
- **Lint only**: `eslint --cache`
- **Single test file**: `node --test test/dynamic-buffer.test.js`

## Testing

Uses Node.js built-in test runner (`node:test`) with `node:assert` for assertions. Test files are in the `test/` directory. Tests cover both single-buffer and multi-buffer scenarios extensively, especially boundary conditions where operations span multiple internal buffers.

## Code Style

- Uses neostandard ESLint configuration
- CommonJS modules (`module.exports`/`require()`)
- Strict mode enabled
- Private class fields (#) for internal state