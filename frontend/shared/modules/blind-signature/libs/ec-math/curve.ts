/* tslint:disable:typedef variable-name no-bitwise */
import { ModPoint } from './modpoint';
import * as bigInt_ from 'big-integer';
import { BigInteger } from 'big-integer';
import { ModSet } from './modset';

const bigInt = bigInt_;

export class ModCurve {
  private _modSet: ModSet;

  constructor(
    private _a: BigInteger,
    private _b: BigInteger,
    private _p: BigInteger,
    private _gx: BigInteger,
    private _gy: BigInteger
  ) {
    this._modSet = new ModSet(this._p);
  }

  get a() {
    return this._a;
  }

  get b() {
    return this._b;
  }

  get p() {
    return this._p;
  }

  get gx() {
    return this._gx;
  }

  get gy() {
    return this._gy;
  }

  get modSet() {
    return this._modSet;
  }

  get G() {
    return new ModPoint(this._gx, this._gy, this);
  }

  xToY(x: BigInteger, parity: boolean) {
    const y2 = this.modSet.add(this.modSet.power(x, bigInt(3)), this.b);
    const y = this.modSet.squareRoots(y2);
    if (parity === true) {
      return y[1];
    } else if (parity === false) {
      return y[0];
    }
    return y;
  }

  verify(point) {
    const verificationPoint = this.modSet.subtract(
      this.modSet.add(this.modSet.power(point.x, bigInt(3)), this.b),
      this.modSet.power(point.y, bigInt(2))
    );
    return verificationPoint.eq(bigInt.zero);
  }

  // inverse(p) {
  //   // a^p^n−2
  //   return this.multiply(this.multiply(p, this.p), this.n.minus(2))
  // }
  equals(c: ModCurve): boolean {
    return this._a.eq(c.a) &&
      this._b.eq(c.b) &&
      this._gx.equals(c.gx) &&
      this._gy.equals(c.gy) &&
      this._p.eq(c.p);
  }

  toJSON(radix?: number) {
    radix = radix | 16;
    return {
      a: this._a.toString(radix),
      b: this._b.toString(radix),
      p: this._p.toString(radix),
      gx: this._gx.toString(radix),
      gy: this._gy.toString(radix)
    };
  }

  toString(radix?: number) {
    radix = radix | 16;
    return JSON.stringify(this.toJSON(radix));
  }

}
