import { CryptUtils } from './utils';
import * as bigInt_ from 'big-integer';
import { BigInteger } from 'big-integer';
import * as crypto from 'gost-crypto';

const bigInt = bigInt_;

export class Random {

    /**
     * Проверка длины числа в битах.
     * Если число длиннее, то сдвинуть вправо.
     *
     * @param num число
     * @param max максимальное количество бит
     */
    static checkMaxLengthAndShift(num: BigInteger, max: BigInteger): BigInteger {
        let result = num;
        if (num.bitLength().gt(max)) {
            const diff = num.bitLength().subtract(max);
            for (let i = 0; i < diff.toJSNumber(); i++) {
                result = result.shiftRight(bigInt.one);
            }
            return result;
        }
        return num;
    }

    /**
     * Проверка длины числа в битах.
     * Если число длиннее, то обрезать слева.
     *
     * @param num число
     * @param max максимальное количество бит
     */
    static checkMaxLengthAndStrip(num: BigInteger, max: BigInteger): BigInteger {
        if (num.bitLength().gt(max)) {
            const diff = num.bitLength().subtract(max);
            let mask = bigInt.one;
            for (let i = 0; i < max.toJSNumber(); i++) {
                mask = mask.shiftLeft(bigInt.one).add(bigInt.one);
            }
            return num.xor(mask);
        }
        return num;
    }

    /**
     * Генерация случайного числа с помощью алгоритма ГОСТа.
     * Длина в битах берётся на два бита меньше, чем максимальное число,
     * чтобы не было ситуации, когда взяли, например, число 100000010,
     * для которого будет всего два варианта случайного числа: 100000001 и 100000010.
     *
     * Если дан одноразовый блокнот, то сгенерированное локально случайное число
     * складывается по модулю с одноразовым блокнотом.
     *
     * @param max максимальное число
     * @param oneTimePad одноразовый блокнот
     * @returns BigInteger случайное число
     */
    static getSecureRandom(min: BigInteger, max: BigInteger, oneTimePad?: BigInteger): BigInteger {
        // console.log('Range: [' + min + ': ' + max + ']');
        // if (max.lt(bigInt.one)) {
        //     throw new Error('Random number must be greater then zero.');
        // }
        // if (max.bitLength().lt(bigInt(3))) {
        //     throw new Error('Maximum random must have at least 3 bits length.');
        // }
        if (min != null && min.add(1) > max ) {
            throw new Error('(max - min) must be greater then 1.');
        }
        min = min == null ? bigInt.one: min;
        const range = max.subtract(min).add(bigInt.one); // Добавляем 1 для того, чтобы максимальное число было в списке возможных
        // console.log('Range: ' + range);
        const bitsLen = max.bitLength();
        const bitsPerByte = bigInt(8);
        const bytes = bitsLen.divide(bitsPerByte)
            .add(bigInt(bitsLen.mod(bitsPerByte).gt(bigInt.zero) ? 1 : 0));
        const buf = new Uint8Array(bytes.toJSNumber());
        crypto.getRandomValues(buf);
        let gostRandom = Random.checkMaxLengthAndShift(CryptUtils.byteArrayToBigInt(buf), bitsLen); // ГОСТ
        // console.log('GOST: ' + gostRandom.toString(2) + ' (' + gostRandom + ')');

        const bIntRandom = bigInt.randBetween(bigInt.zero, max); // Стандартный способ
        // console.log('bInt: ' + bIntRandom.toString(2) + ' (' + bIntRandom + ')');
        /**
         * TODO добавить время, но таким образом,
         * чтобы распределение бит у числа, полученного из времени,
         * было равномерно распределено.
         * Сделать это можно, вычисляя хеш
         *
         * let timeRandom = Random.checkMaxLengthAndStrip(bigInt(new Date().getTime()), bitsLen); // Время
         */
        //
        // Старший бит одного из чисел нужно убрать, чтобы при одинаковой длине в битах старшие разряды не обращались в 0.
        gostRandom = Random.removeSeniorBit(gostRandom);
        // console.log('GOST: ' + gostRandom.toString(2) + ' (' + gostRandom + ')');
        let r = gostRandom.xor(bIntRandom);
            // .xor(timeRandom); // ГОСТ * стандартный способ * время
        // console.log('r   : ' + r.toString(2) + ' (' + r + ')');
        if (oneTimePad != null) {
            r = Random.mix(r, oneTimePad);
        }
        const rModRange = r.mod(range);
        // console.log('r % range:' + rModRange);
        const result = rModRange.add(min);
        // console.log('result: ' + result);
        return result;
    }

    static removeSeniorBit(num: BigInteger) {
        return num.xor(bigInt.one.shiftLeft(num.bitLength().subtract(bigInt.one)));
    }

    static mix(selfGenerated: BigInteger, oneTimePad: BigInteger) {
        const otpLen: BigInteger = oneTimePad.bitLength();
        if (selfGenerated.bitLength().gt(otpLen)) {
            throw Error('One time pad is too short. Must be at least ' + selfGenerated.bitLength() + ' bits.');
        }

        const lenDiff = otpLen.subtract(selfGenerated.bitLength());
        // Если длина блокнота больше длины сгенерированного здесь числа, то блокнот следует укоротить.
        return selfGenerated.xor(Random.removeSeniorBit(oneTimePad.shiftRight(lenDiff)));
    }

    /**
     * Returns a random big integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     *
     * @param min Минимальное значение
     * @param max Максимальное значение
     */
    static getMathRandom(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}
