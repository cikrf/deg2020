// import * as gostEngine from 'gost-crypto/lib/gostEngine';
// import * as crypto from 'gost-crypto';

let gostEngine = {} as any;
let crypto = {} as any;

export function normalizeCommonJSImport<T>(
  importPromise: Promise<T>,
): Promise<T> {
  // CommonJS's `module.exports` is wrapped as `default` in ESModule.
  return importPromise.then((m: any) => (m.default || m) as T);
}

export function initGhost(): Promise<void> {
  return normalizeCommonJSImport(
    import(/* webpackChunkName: "chart" */ 'gost-crypto'),
  ).then(result => {
    crypto = result;
    return normalizeCommonJSImport(
      import(/* webpackChunkName: "chart" */ 'gost-crypto/lib/gostEngine'),
    );
  }).then(result => {
    gostEngine = result;
  });
}

export function destroyGhost(): void {
  // @ts-ignore
  crypto = {};
  // @ts-ignore
  gostEngine = {};
}

export function generateKey(ukm: Uint8Array): any {
  const algoritmKey = {
    keySize: 32,
    length: 256,
    mode: 'SIGN',
    name: 'GOST R 34.10',
    procreator: 'CP',
    version: 2012,
  };
  const algorithmGostSign = {
    name: 'GOST R 34.10',
    version: 2012,
    mode: 'SIGN',
    length: 256,
    procreator: 'CP',
    keySize: 32,
    namedCurve: 'S-256-A',
    hash:
      {
        name: 'GOST R 34.11',
        version: 2012,
        mode: 'HASH',
        length: 256,
        procreator: 'CP',
        keySize: 32
      },
    id: 'id-tc26-gost3410-12-256'
  };
  const GostSign = gostEngine.getGostSign({...algorithmGostSign, ukm});
  const keys = GostSign.generateKey();
  const privateKeyObject = convertKey(algoritmKey, false, null, keys.privateKey, 'private');
  const publicKeyObject = convertKey(algoritmKey, false, null, keys.publicKey, 'public');
  return {
    publicKey: exportKey('raw', publicKeyObject),
    privateKey: exportKey('raw', privateKeyObject)
  };
}

export function exportKey(format: string, key: any): ArrayBuffer {
  let encodeKey = null;
  switch (format) {
    case 'spki':
      encodeKey = crypto.asn1.GostSubjectPublicKeyInfo.encode(key);
      break;
    case 'pkcs8':
      encodeKey = crypto.asn1.GostPrivateKeyInfo.encode(key);
      break;
    case 'raw':
      encodeKey = key.buffer;
      break;
  }
  if (encodeKey) {
    return encodeKey;
  } else {
    throw new Error('Key format not supported');
  }
}

export function convertKey(algorithm: any, extractable: boolean, keyUsages: [string] | null, keyData: ArrayBuffer, keyType: string): any {
  return {
    type: keyType || (algorithm.name === 'GOST R 34.10' ? 'private' : 'secret'),
    extractable: extractable || 'false',
    algorithm,
    usages: keyUsages || [],
    buffer: keyData
  };
}

export function intToBytes(x: any): any {
  const bytes = [];
  let i = 8;
  do {
    // tslint:disable-next-line:no-bitwise
    bytes[--i] = x & (255);
    // tslint:disable-next-line:no-bitwise
    x = x >> 8;
  } while (i);
  return bytes;
}

export function concatUint8Arrays(...args: any[]): Uint8Array {
  for (let i = 0; i < arguments.length; i++) {
    args[i] = arguments[i];
  }
  if (args.length < 2) {
    throw new Error('Two or more Uint8Array are expected');
  }
  if (!(args.every((arg) => arg instanceof Uint8Array))) {
    throw new Error('One of arguments is not a Uint8Array');
  }
  const count = args.length;
  const sumLength = args.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(sumLength);
  let curLength = 0;
  for (let j = 0; j < count; j++) {
    result.set(args[j], curLength);
    if (j !== count - 1) {
      curLength += args[j].length;
    }
  }
  return result;
}

export function buildSeedHash(seedBytes: Uint8Array): Uint8Array {
  const nonce = new Uint8Array(intToBytes(0));
  const seedBytesWithNonce = concatUint8Arrays(nonce, seedBytes);
  return streebog256(seedBytesWithNonce);
}

export function streebog256(data: Uint8Array | string): Uint8Array {
  const digest = gostEngine.getGostDigest({name: 'GOST R 34.11'});
  return new Uint8Array(digest.digest(data));
}

