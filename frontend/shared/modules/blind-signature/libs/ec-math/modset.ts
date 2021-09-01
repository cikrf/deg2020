import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';

export class ModSet {
    private _p1: BigInteger;
    private _p2: BigInteger;

    constructor(
        private _p: BigInteger
    ) {
    }

    get p(): BigInteger {
        return this._p;
    }

    get p1(): BigInteger {
        return this._p1;
    }

    get p2(): BigInteger {
        return this._p2;
    }

    // random() {
    //   return this.mod(BigInt('0x'+crypto.randomBytes(64).toString('hex')))
    // }

    mod(n: BigInteger): BigInteger {
        return n.mod(this.p).add(this.p).mod(this.p);
    }

    add(a: BigInteger, b: BigInteger): BigInteger {
        return this.mod(a.add(b));
    }

    subtract(a: BigInteger, b: BigInteger): BigInteger {
        return this.mod(a.subtract(b));
    }

    multiply(a: BigInteger, b: BigInteger): BigInteger {
        return this.mod(a.multiply(b));
    }

    divide(c: BigInteger, a: BigInteger): BigInteger {
        const ap = this.power(a, this.p.subtract(bigInt(2)));
        return this.mod(this.multiply(c, ap));
    }

    inverse(n: BigInteger): BigInteger {
        return this.multiply(n, bigInt(-1));
    }

    squareRoots(k: BigInteger): BigInteger[] {
        this._p1 = this._p1 || (this._p.subtract(bigInt.one)).divide(bigInt(2));
        if (this.power(k, this._p1).notEquals(bigInt.one)) {
            throw new Error('no integer square root');
        }
        this._p2 = this._p2 || (this._p.add(bigInt.one)).divide(bigInt(4));
        const root = this.power(k, this.p2);
        const negativeRoot = this._p.subtract(root);

        return [root, negativeRoot];
    }

    power(a: BigInteger, b: BigInteger): BigInteger {
        let x = bigInt.one;
        while (b.gt(bigInt.zero)) {
            if (a.eq(bigInt.zero)) {
                return bigInt.zero;
            }
            if (b.mod(bigInt(2)).eq(bigInt.one)) {
                x = this.multiply(x, a);
            }
            b = b.divide(bigInt(2));
            a = this.multiply(a, a);
        }

        return x;
    }
}
