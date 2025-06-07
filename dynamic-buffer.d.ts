declare module "definitions" {
    export const INT8_SIZE: 1;
    export const INT16_SIZE: 2;
    export const INT32_SIZE: 4;
    export const INT64_SIZE: 8;
    export const UUID_SIZE: 16;
    export const EMPTY_BUFFER: any;
    export const EMPTY_UUID: any;
    export const EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE: 1;
    export const EMPTY_TAGGED_FIELDS_BUFFER: any;
}
declare module "varint" {
    export const MOST_SIGNIFICANT_BIT_FLAG: 128;
    export const MOST_SIGNIFICANT_BIT_FLAG_64: 0x80n;
    export const LEAST_SIGNIFICANT_7_BITS: 127;
    export const LEAST_SIGNIFICANT_7_BITS_64: 0x7fn;
    export const BITS_8PLUS_MASK: number;
    export const BITS_8PLUS_MASK_64: bigint;
    export function intZigZagEncode(value: any): number;
    export function intZigZagDecode(value: any): number;
    export function int64ZigZagEncode(value: any): bigint;
    export function int64ZigZagDecode(value: any): bigint;
    export function sizeOfUnsignedVarInt(value: any): number;
    export function sizeOfUnsignedVarInt64(value: any): number;
}
declare module "dynamic-buffer" {
    export class DynamicBuffer {
        static isDynamicBuffer(target: any): boolean;
        constructor(buffers: any);
        buffers: any[];
        length: number;
        get buffer(): any;
        append(buffer: any): this;
        prepend(buffer: any): this;
        appendFrom(DynamicBuffer: any): this;
        prependFrom(DynamicBuffer: any): this;
        subarray(start: number, end: any): DynamicBuffer;
        slice(start: number, end: any): any;
        clone(deep?: boolean): DynamicBuffer;
        consume(offset: any): this;
        toString(encoding: string, start: number, end: any): any;
        get(offset: any): any;
        readUInt8(offset?: number): any;
        readUInt16BE(offset?: number): any;
        readUInt16LE(offset?: number): any;
        readUInt32BE(offset?: number): any;
        readUInt32LE(offset?: number): any;
        readBigUInt64BE(offset?: number): any;
        readBigUInt64LE(offset?: number): any;
        readUnsignedVarInt(offset?: number): number[];
        readUnsignedVarInt64(offset?: number): (number | bigint)[];
        readInt8(offset?: number): any;
        readInt16BE(offset?: number): any;
        readInt16LE(offset?: number): any;
        readInt32BE(offset?: number): any;
        readInt32LE(offset?: number): any;
        readBigInt64BE(offset?: number): any;
        readBigInt64LE(offset?: number): any;
        readVarInt(offset: any): number[];
        readVarInt64(offset: any): (number | bigint)[];
        readFloatBE(offset?: number): any;
        readFloatLE(offset?: number): any;
        readDoubleBE(offset?: number): any;
        readDoubleLE(offset?: number): any;
        writeUInt8(value: any, append?: boolean): this;
        writeUInt16BE(value: any, append?: boolean): this;
        writeUInt16LE(value: any, append?: boolean): this;
        writeUInt32BE(value: any, append?: boolean): this;
        writeUInt32LE(value: any, append?: boolean): this;
        writeBigUInt64BE(value: any, append?: boolean): this;
        writeBigUInt64LE(value: any, append?: boolean): this;
        writeUnsignedVarInt(value: any, append?: boolean): void;
        writeUnsignedVarInt64(value: any, append?: boolean): void;
        writeInt8(value: any, append?: boolean): this;
        writeInt16BE(value: any, append?: boolean): this;
        writeInt16LE(value: any, append?: boolean): this;
        writeInt32BE(value: any, append?: boolean): this;
        writeInt32LE(value: any, append?: boolean): this;
        writeBigInt64BE(value: any, append?: boolean): this;
        writeBigInt64LE(value: any, append?: boolean): this;
        writeVarInt(value: any, append?: boolean): void;
        writeVarInt64(value: any, append?: boolean): void;
        writeFloatBE(value: any, append?: boolean): this;
        writeFloatLE(value: any, append?: boolean): this;
        writeDoubleBE(value: any, append?: boolean): this;
        writeDoubleLE(value: any, append?: boolean): this;
        #private;
    }
}
