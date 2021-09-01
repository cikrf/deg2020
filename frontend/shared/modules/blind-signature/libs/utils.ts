import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';

export enum UintArrayType {
    Uint8Array = 8,
    Uint16Array = 16,
    Uint28Array = 28,
    Uint32Array = 32
}

export class CryptUtils {
    /**
     *
     * @param num
     * @param shift
     */
    static getCloseMin(num: BigInteger, shift: BigInteger): BigInteger {
        const numBitLen = num.bitLength();
        if (shift.lt(1)) {
            throw new Error('Can\'t get min value. Shift must be greater than zero.');
        }
        if (numBitLen.lt(bigInt(shift))) {
            throw new Error('Can\'t get min value. Shift is too big.');
        }
        return bigInt(2).pow(numBitLen.subtract(shift)).subtract(1);
    }

    static byteArrayToHexString(data, littleEndian?: boolean, format?: boolean, uintArrayType?: UintArrayType): string {
        let result = '';
        const clazz = CryptUtils.getArrayClass(data, uintArrayType);
        const v = new clazz(data.slice(0));
        if (littleEndian == null || !littleEndian) {
            v.reverse();
        }
        for (const b of v) {
            const bs = b.toString(16);
            result += (format ? ', (byte)0x' : '') + (bs.length < 2 ? '0' : '') + b.toString(16);
            // result += (format? ', ' : '') + (bs.length < 2 ? '0' : '') + b.toString();
        }
        return result;
    }

    static getArrayClass(data, uintArrayType?: UintArrayType) {
        let clazz;
        switch (uintArrayType) {
            case UintArrayType.Uint32Array:
            case UintArrayType.Uint28Array:
                clazz = Uint32Array;
                break;
            case UintArrayType.Uint16Array:
                clazz = Uint16Array;
                break;
            case UintArrayType.Uint8Array:
                clazz = Uint8Array;
                break;
            default: {
                if (uintArrayType == null && data.byteLength) {
                    clazz = Uint8Array;
                } else {
                    throw new Error('Can\'t determine array class. Unknown data type: ' + data.constructor);
                }
            }
        }
        return clazz;
    }

    static byteArrayToBigInt(data, uintArrayType?: UintArrayType): BigInteger {
        const clazz = CryptUtils.getArrayClass(data, uintArrayType);
        const v = new clazz(data).reverse();
        let bInt = bigInt.zero;
        // let bits = v.BYTES_PER_ELEMENT * 8;
        for (const b of v) {
            bInt = bInt.shiftLeft(UintArrayType.Uint8Array).or(bigInt(b));
        }
        return bInt;
        // return bigInt.one;
    }

    static bigIntTobyteArray(bInt: BigInteger): Uint8Array {
        const bytesNum = bInt.bitLength().divide(8).add(bInt.bitLength().mod(8).gt(0) ? 1 : 0).toJSNumber();
        const v = new Uint8Array(bytesNum);
        const bitsPerItem = v.BYTES_PER_ELEMENT * 8;
        for (let i = 0; i < bytesNum; i++) {
            v[i] = bInt.and(bigInt('ff', 16)).toJSNumber();
            bInt = bInt.shiftRight(bitsPerItem);
        }
        return v;
    }
}
