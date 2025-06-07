declare module "definitions" {
    export const INT8_SIZE: 1;
    export const INT16_SIZE: 2;
    export const INT32_SIZE: 4;
    export const INT64_SIZE: 8;
    export const UUID_SIZE: 16;
    export const EMPTY_BUFFER: Buffer<ArrayBuffer>;
    export const EMPTY_UUID: Buffer<ArrayBuffer>;
    export const EMPTY_OR_SINGLE_COMPACT_LENGTH_SIZE: 1;
    export const EMPTY_TAGGED_FIELDS_BUFFER: Buffer<ArrayBuffer>;
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
    export = DynamicBuffer;
    /**
     * @class
     * @name DynamicBuffer
     */
    class DynamicBuffer {
        /**
         * @param {any} target
         * @returns {target is DynamicBuffer}
         */
        static isDynamicBuffer(target: any): target is DynamicBuffer;
        /**
         * @param {Buffer|Buffer[]} buffers
         */
        constructor(buffers: Buffer | Buffer[]);
        /**
         * @type {Buffer[]}
         */
        buffers: Buffer[];
        length: number;
        /**
         * @returns {Buffer<ArrayBuffer>}
         */
        get buffer(): Buffer<ArrayBuffer>;
        /**
         * @param {Buffer} buffer
         * @returns {this}
         */
        append(buffer: Buffer): this;
        /**
         * @param {Buffer} buffer
         * @returns {this}
         */
        prepend(buffer: Buffer): this;
        /**
         * @param {DynamicBuffer} dynamicBuffer
         * @returns {this}
         */
        appendFrom(dynamicBuffer: DynamicBuffer): this;
        /**
         * @param {DynamicBuffer} dynamicBuffer
         * @returns {this}
         */
        prependFrom(dynamicBuffer: DynamicBuffer): this;
        /**
         * @param {number} [start=0]
         * @param {number} [end]
         * @returns {DynamicBuffer}
         */
        subarray(start?: number, end?: number): DynamicBuffer;
        /**
         * @param {number} [start=0]
         * @param {number} [end]
         * @returns {Buffer<ArrayBuffer>}
         */
        slice(start?: number, end?: number): Buffer<ArrayBuffer>;
        /**
         * @param {boolean} [deep=false]
         * @returns {DynamicBuffer}
         */
        clone(deep?: boolean): DynamicBuffer;
        /**
         * @param {number} offset
         * @returns {this}
         */
        consume(offset: number): this;
        /**
         * @param {string} [encoding='utf-8']
         * @param {number} [start=0]
         * @param {number} [end]
         * @returns {string}
         */
        toString(encoding?: string, start?: number, end?: number): string;
        /**
         * @param {number} offset
         * @returns {Buffer<ArrayBuffer>}
         */
        get(offset: number): Buffer<ArrayBuffer>;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readUInt8(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readUInt16BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readUInt16LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readUInt32BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readUInt32LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readBigUInt64BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readBigUInt64LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {[number, number]}
         */
        readUnsignedVarInt(offset?: number): [number, number];
        /**
         * @param {number} [offset=0]
         * @returns {[number, number]}
         */
        readUnsignedVarInt64(offset?: number): [number, number];
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readInt8(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readInt16BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readInt16LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readInt32BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readInt32LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readBigInt64BE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readBigInt64LE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {[bigint, number]}
         */
        readVarInt(offset?: number): [bigint, number];
        /**
         * @param {number} [offset=0]
         * @returns {[bigint, number]}
         */
        readVarInt64(offset?: number): [bigint, number];
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readFloatBE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readFloatLE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readDoubleBE(offset?: number): number;
        /**
         * @param {number} [offset=0]
         * @returns {number}
         */
        readDoubleLE(offset?: number): number;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUInt8(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUInt16BE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUInt16LE(value: number, append?: number): this;
        /**
         * @param {*} value
         * @param {*} append
         * @returns {this}
         */
        writeUInt32BE(value: any, append?: any): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUInt32LE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeBigUInt64BE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeBigUInt64LE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUnsignedVarInt(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeUnsignedVarInt64(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeInt8(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeInt16BE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeInt16LE(value: number, append?: number): this;
        /**
         * @param {*} value
         * @param {*} append
         * @returns {this}
         */
        writeInt32BE(value: any, append?: any): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeInt32LE(value: number, append?: number): this;
        /**
         * @param {*} value
         * @param {*} append
         * @returns {this}
         */
        writeBigInt64BE(value: any, append?: any): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeBigInt64LE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeVarInt(value: number, append?: number): this;
        writeVarInt64(value: any, append?: boolean): void;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeFloatBE(value: number, append?: number): this;
        /**
         *
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeFloatLE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {number} [append=true]
         * @returns {this}
         */
        writeDoubleBE(value: number, append?: number): this;
        /**
         * @param {number} value
         * @param {boolean} [append=true]
         * @returns {this}
         */
        writeDoubleLE(value: number, append?: boolean): this;
        [instanceIdentifier]: boolean;
        #private;
    }
    namespace DynamicBuffer {
        export { DynamicBuffer as default, DynamicBuffer };
    }
    import { Buffer } from "buffer";
    const instanceIdentifier: unique symbol;
}
