import { ModCurve } from './curve';
import * as bigInt_ from 'big-integer';
import { BigInteger } from 'big-integer';
import { ModSet } from './modset';

const bigInt = bigInt_;

export class ModPoint {
  constructor(
    private _x: BigInteger,
    private _y: BigInteger,
    private _curve: ModCurve,
    private _infinity?: boolean
  ) {}

  get x(): BigInteger { return this._x; }
  get y(): BigInteger { return this._y; }
  get curve(): ModCurve { return this._curve; }
  get ms(): ModSet { return this._curve.modSet; }
  get infinity(): boolean { return this._infinity; }

  double(): ModPoint {
    const two = bigInt(2);

    const sn = bigInt(3).multiply(this._x.pow(two)).add(this._curve.a); // 3 * x^2 + a
    const sd = two.multiply(this._y); // 2 * y
    const s = this.ms.divide(sn, sd); // sn/sd mod(p)
    const x3 = this.ms.mod(s.pow(two).subtract(two.multiply(this._x))); //  s^2 - 2*x
    const y3 = this.ms.mod(s.multiply(this._x.subtract(x3)).subtract(this._y)); // s *(x-x3) - y
    return new ModPoint(x3, y3, this._curve);
  }

  add(other: ModPoint) {
    if (this.infinity) {
      return other;
    }
    if (other == null || other.infinity) {
      return this;
    }
    if (!this._curve.equals(other.curve)) {
      throw new Error('Curves mismatch.');
    }
    if (this.equals(other)) {
      return this.double();
    }

    const p = this._curve.p;
    const ys = this.ms.mod(other.y.subtract(this._y));
    const xs = this.ms.mod(other.x.subtract(this._x));
    const s = this.ms.divide(ys, xs);

    const x3 = this.ms.subtract(this.ms.subtract(this.ms.multiply(s, s), this._x), other.x);
    const y3 = this.ms.subtract(this.ms.multiply(s, this.ms.subtract(this._x, x3)), this._y);
    return new ModPoint(x3, y3, this._curve);
  }

  subtract(other: ModPoint) {
    if (!this._curve.equals(other.curve)) {
      throw new Error('Curves mismatch.');
    }
    if (other.infinity) {
      return this;
    }
    if (this.equals(other)) {
      return new ModPoint(bigInt.zero, bigInt.zero, this._curve, true);
    }
    other = new ModPoint(other.x, this.ms.multiply(other.y, bigInt(-1)), this._curve);
    return this.add(other);
  }

  multiply(s: BigInteger): ModPoint  {
    if (s.eq(bigInt.zero)) {
      return new ModPoint(bigInt.zero, bigInt.zero, this._curve, true);
    }
    if (s.eq(bigInt.one)) {
      return this;
    }

    let result: ModPoint = null;
    let addend: ModPoint = this;
    while (s.gt(0)) {
      if (s.and(bigInt.one).eq(bigInt.one)) {
        result = addend.add(result);
      }
      addend = addend.double();
      s = s.shiftRight(bigInt.one);
    }

    return result;
  }


  // static fromJSON(object) {
  //   return new ModPoint(BigInt('0x'+object.x), BigInt('0x'+object.y))
  // }
  // static fromString(string) {
  //   return ModPoint.fromJSON(JSON.parse(string))
  // }
  // static fromSec1(sec1, curve) {
  //   const mode = sec1.substr(0, 2)
  //   const x = BigInt('0x'+sec1.substr(2, 64))
  //   let y = BigInt('0x'+(sec1.substr(66, 130) || 0))

  //   const compressed = (mode === '03' || mode === '02')
  //   if (compressed) {
  //     if (!curve) {
  //       throw 'no curve provided to recover y point with'
  //     }
  //     y = curve.xToY(x, mode === '03')
  //   }

  //   const point = new ModPoint(x, y)
  //   if (
  //     (mode === '04' && sec1.length !== 130) ||
  //     (compressed && sec1.length !== 66) ||
  //     (mode !== '04' && mode !== '03' && mode !== '02')
  //   ) {
  //     throw 'invalid address' + (mode === '03' || mode === '02') ? ' compressed addresses not yet supported' : ''
  //   }
  //   return point
  // }
  // get sec1Compressed() {
  //   return this._sec1Compressed || (this._sec1Compressed =
  //     `${
  //       this.y % 2n === 1n ? '03' : '02'
  //     }${
  //       this.x.toString(16).padStart(64, '0')
  //     }`
  //   )
  // }
  // get sec1Uncompressed() {
  //   return this._sec1Uncompressed || (this._sec1Uncompressed =
  //     `04${
  //       this.x.toString(16).padStart(64, '0')
  //     }${
  //       this.y.toString(16).padStart(64, '0')
  //     }`
  //   )
  // }

  equals(p: ModPoint): boolean {
    return this._x.eq(p.x) &&
           this._y.eq(p.y) &&
           this._curve.equals(p.curve);
  }

  toJSON(radix?: number) {
    radix = radix | 16;
    return { x: this.x.toString(radix), y: this.y.toString(radix) };
  }
  toString(radix?: number) {
    radix = radix | 16;
    return JSON.stringify(this.toJSON(radix));
  }
}
