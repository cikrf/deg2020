import * as bigInt_ from 'big-integer';
import { BigInteger } from 'big-integer';
import { Random } from './random';
import { Gost, GOST_R_34_11 } from './gost';
import { CryptUtils } from './utils';

const bigInt = bigInt_;

export class ElGamal {
    static getRandomInteger(params: ElgamParams, oneTimePad?: BigInteger): BigInteger {
        let min = CryptUtils.getCloseMin(params.q, bigInt.one);
        return Random.getSecureRandom(min, params.q.subtract(bigInt.one), oneTimePad);
    }

    static encrypt(pk: PublicKey, plaintext: Plaintext, r: BigInteger): Ciphertext {
        if (plaintext.M.equals(bigInt.zero))
            throw new Error("Can't encrypt 0 with El Gamal");

        if (!r)
            r = ElGamal.getRandomInteger(pk.params);

        let alpha = pk.params.g.modPow(r, pk.params.p);
        let beta = (pk.y.modPow(r, pk.params.p)).multiply(plaintext.M).mod(pk.params.p);

        return new Ciphertext(alpha, beta, pk);
    };
}

export class Plaintext {
    /**
     *
     * @param _M шифруемое сообщение
     * @param _pk открытый ключ шифрования
     * @param _encode
     */
    constructor(
        private _M: BigInteger,
        private _pk: PublicKey,
        private _encode?: boolean
    ) {
        if (this._M == null || this._pk == null) {
            throw new Error('Message and public key in Plaintext cannot be null.');
        }
        if (this._encode) {
            // need to encode the message given that p = 2q+1
            let y = this._M.add(bigInt.one);
            let test = y.modPow(_pk.params.q, _pk.params.p);
            if (test.equals(bigInt.one)) {
                this._M = y;
            } else {
                this._M = y.negate().mod(_pk.params.p);
            }
        }
    }

    get M() { return this._M; }

    getPlaintext() {
        let y: BigInteger;

        // if M < q
        if (this._M.compareTo(this._pk.params.q) < 0) {
            y = this._M;
        } else {
            y = this._M.negate().mod(this._pk.params.p);
        }

        return y.subtract(bigInt.one);
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            M: this._M.toString(radix),
            pk: this._pk.toJSON(radix),
            encode: this._encode
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

export class Ciphertext {
    constructor(
        private _alpha: BigInteger,
        private _beta: BigInteger,
        private _pk: PublicKey
    ) { }

    get alpha() { return this._alpha; }
    get beta() { return this._beta; }
    get pk() { return this._pk; }

    /**
     * Гомоморфная сумма шифротекстов по alpha и beta
     *
     * @param other другой шифротекст
     * @returns новый шифротекст
     */
    multiply(other: Ciphertext): Ciphertext {
        if (!this._pk.equals(other.pk)) {
            throw new Error("Can't multiply ciphertext due to pupblic keys mismatch.");
        }

        return new Ciphertext(
            this._alpha.multiply(other.alpha).mod(this._pk.params.p),
            this._beta.multiply(other.beta).mod(this._pk.params.p),
            this.pk
        );
    }

    decrypt(listOfDecFactors: BigInteger[]): Plaintext {
        let runningDecryption = this.beta;
        for (let decFactor of listOfDecFactors) {
            runningDecryption = decFactor.modInv(this._pk.params.p).multiply(runningDecryption).mod(this._pk.params.p);
        }

        return new Plaintext(runningDecryption, this._pk, false);
    }

    generateProof<T extends ChallengeGenerator>(plaintext: Plaintext, randomness: BigInteger, challengeGenerator: T) {
        // DH tuple to prove is
        // g, y, alpha, beta/m
        // with dlog randomness
        var proof = Proof.generate(this._pk, randomness, challengeGenerator);

        return proof;
    }

    simulateProof(plaintext: Plaintext, challenge?: BigInteger) {
        // compute beta/plaintext, the completion of the DH tuple
        let betaOverPlaintext = this._beta.multiply(plaintext.M.modInv(this.pk.params.p)).mod(this.pk.params.p);

        // the DH tuple we are simulating here is
        // g, y, alpha, beta/m
        return Proof.simulate(this.pk, this.alpha, betaOverPlaintext, challenge);
    }

    verifyProof(plaintext: Plaintext, proof: Proof, challengeGenerator?: ChallengeGenerator) {
        // DH tuple to verify is
        // g, y, alpha, beta/m
        let betaOverM = this._beta.multiply(plaintext.M.modInv(this.pk.params.p)).mod(this.pk.params.p);

        return proof.verify(this.pk.params.g, this.pk.y, this.alpha, betaOverM, this.pk.params.p, this.pk.params.q, challengeGenerator);
    }

    async generateDisjunctiveProof<T extends ChallengeGenerator>(listOfPlaintexts: Plaintext[],
        realIndex: number, randomness: BigInteger, challengeGenerator: T): Promise<DisjunctiveProof> {
        // go through all plaintexts and simulate the ones that must be simulated.
        // note how the interface is as such so that the result does not reveal which is the real proof.
        let self = this;

        let proofs: Proof[] = listOfPlaintexts.map((plaintext, p_num) => {
            if (p_num == realIndex) {
                // no real proof yet
                return null;
            } else {
                // simulate!
                return self.simulateProof(plaintext);
            }
        });

        const realChallengeGenerator: ChallengeGenerator = <ChallengeGenerator>{
            generate: async (commitments, pk) => {
                // now we generate the challenge for the real proof by first determining
                // the challenge for the whole disjunctive proof.

                // set up the partial real proof so we're ready to get the hash;
                proofs[realIndex] = new Proof(commitments[0]);

                // get the commitments in a list and generate the whole disjunctive challenge
                let commitmentsList = proofs.map(function (proof) {
                    return proof.commitment;
                });

                let disjunctive_challenge: BigInteger = await challengeGenerator.generate(commitmentsList, pk);

                // now we must subtract all of the other challenges from this challenge.
                let real_challenge = disjunctive_challenge;
                proofs.forEach(function (proof, proof_num) {
                    if (proof_num != realIndex)
                        real_challenge = real_challenge.add(proof.challenge.negate());
                });

                // make sure we mod q, the exponent modulus
                real_challenge = real_challenge.mod(self.pk.params.q);
                return real_challenge;
            }
        };
        // do the real proof
        let real_proof = await this.generateProof(listOfPlaintexts[realIndex], randomness, realChallengeGenerator);

        // set the real proof
        proofs[realIndex] = real_proof;
        return new DisjunctiveProof(proofs);
    }

    async verifyDisjunctiveProof(listOfPlaintexts: Plaintext[], disjProof: DisjunctiveProof, challengeGenerator: ChallengeGenerator, q: BigInteger): Promise<boolean> {
        let result = true;
        let proofs = disjProof.proofs;

        // for loop because we want to bail out of the inner loop
        // if we fail one of the verifications.
        for (let i = 0; i < listOfPlaintexts.length; i++) {
            if (!this.verifyProof(listOfPlaintexts[i], proofs[i]))
                return false;
        }

        // check the overall challenge

        // first the one expected from the proofs
        let commitments = proofs.map((proof) => proof.commitment);
        let expectedChallenge = await challengeGenerator.generate(commitments, q);

        // then the one that is the sum of the previous one.
        let sum = bigInt.zero;
        for (let proof of proofs) {
            sum = sum.add(proof.challenge).mod(this.pk.params.q);
        }

        return expectedChallenge.equals(sum);
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            alpha: this._alpha.toString(radix),
            beta: this._beta.toString(radix)//,
            //pk: this._pk.toJSON(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Параметры шифрования Эль-Гамаля
 */
export class ElgamParams {

    /**
     *
     * @param _p модуль группы
     * @param _g генератор группы
     * @param _q порядок циклической группы (делитель модуля, p = 2*q + 1 )
     */
    constructor(
        private _p: BigInteger,
        private _g: BigInteger,
        private _q?: BigInteger
    ) {
        if (_q == null) {
            this._q = _p.subtract(bigInt.one).divide(bigInt(2));
        }
     }

    /** @returns модуль группы */
    get p() { return this._p; }
    /** @returns генератор группы */
    get g() { return this._g; }
    /** @returns порядок циклической группы (делитель модуля, p = 2*q + 1 ) */
    get q() { return this._q; }

    static generatePublicKey(egParams: ElgamParams, x: BigInteger): PublicKey {
        let y = egParams.g.modPow(x, egParams.p);
        let pk = new PublicKey(egParams, y);
        return pk;
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            p: this._p.toString(radix),
            g: this._g.toString(radix),
            q: this._q.toString(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
    equals(other: ElgamParams): boolean {
        return this._g.equals(other.g) && this._p.equals(other.p) && this._q.equals(other.q);
    }
}

export class PrivateKey {
    /**
     *
     * @param _x закрытый ключ
     * @param _pk открытый ключ
     */
    constructor(
        private _x: BigInteger,
        private _pk: PublicKey
    ) { }

    get x() { return this._x; }
    get pk() { return this._pk; }

    /**
     * Создание экземпляра класса закрытого ключа с генерацией открытого.
     *
     * @param x закрытый ключ
     * @param params параметры шифрования
     */
    public static getInstance(x: BigInteger, params: ElgamParams) {
        //Закрытый ключ должен быть меньше (q-1)
        if (x.geq(params.q.subtract(bigInt.one))) {
            const xMax = params.q.subtract(bigInt.one).toString(16);
            throw new Error("Private key must be lesser than (q-1) (" + xMax + ").");
        }
        const y = params.g.modPow(x, params.p);
        const pk = new PublicKey(params, y);
        return new PrivateKey(x, pk);
    }

    // a decryption factor is *not yet* mod-inverted, because it needs to be part of the proof.
    decryptionFactor(ciphertext: Ciphertext) {
        let decryption_factor = ciphertext.alpha.modPow(this._x, this._pk.params.p);
        return decryption_factor;
    }

    decrypt(ciphertext: Ciphertext, decryptionFactor: BigInteger) {
        if (!decryptionFactor)
            decryptionFactor = this.decryptionFactor(ciphertext);

        // use the ciphertext's built-in decryption given a list of decryption factors.
        return ciphertext.decrypt([decryptionFactor]);
    }

    async decryptAndProve(ciphertext: Ciphertext, challengeGenerator: ChallengeGenerator): Promise<PlaintextAndProof> {
        let decFactorAndProof = await this.decryptionFactorAndProof(ciphertext, challengeGenerator);

        // decrypt, but using the already computed decryption factor
        let plaintext = this.decrypt(ciphertext, decFactorAndProof.decryptionFactor);

        return new PlaintextAndProof(plaintext, decFactorAndProof.decryptionProof);
    }

    async decryptionFactorAndProof(ciphertext: Ciphertext, challengeGenerator: ChallengeGenerator): Promise<DecryptionFactorAndProof> {
        let decryptionFactor = this.decryptionFactor(ciphertext);

        // the DH tuple we need to prove, given the secret key x, is:
        // g, alpha, y, beta/m
        let publicKey = new PublicKey(this._pk.params, ciphertext.alpha);
        var proof = await Proof.generate(publicKey, this._x, challengeGenerator);

        return new DecryptionFactorAndProof(decryptionFactor, proof);
    }

    // generate a proof of knowledge of the secret exponent x
    proveKnowledge(challenge_generator) {
        // generate random w
        let w = ElGamal.getRandomInteger(this._pk.params);

        // compute s = g^w for random w.
        let s = this._pk.params.g.modPow(w, this._pk.params.p);

        // get challenge
        let challenge = challenge_generator(s);

        // compute response = w +  x * challenge
        let response = w.add(this._x.multiply(challenge).mod(this._pk.params.q));

        return new DLogProof(s, challenge, response);
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            pk: this._pk.toJSON(radix),
            x: this._x.toString(radix)
        };
    }

    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

export class PublicKey {
    /**
     *
     * @param _params параметры шифрования
     * @param _y открытый ключ
     */
    constructor(
        private _params: ElgamParams,
        private _y: BigInteger
    ) { }

    get params() { return this._params }
    get y() { return this._y; }

    equals(other: PublicKey): boolean {
        return this._params.equals(other.params) && this._y.equals(other.y);
    }

    async verifyKnowledgeOfSecretKey(proof: Proof, challengeGenerator: ChallengeGenerator, q: BigInteger): Promise<boolean> {
        if (challengeGenerator != null) {
            let challenge: BigInteger = await challengeGenerator.generate([proof.commitment], q);
            return proof.challenge.equals(challenge);
        }

        throw new Error('Not implemented yet');
        // verify that g^response = s * y^challenge
        // var check = this.params.g.modPow(proof.response, this.params.m)
        //     .equals(this.y.modPow(proof.challenge, this.params.m).multiply(proof.commitment).mod(this.params.m));

        //return check;
    }

    verifyDecryptionFactor(ciphertext, decryption_factor, decryption_proof, challenge_generator): boolean {
        throw new Error('Not implemented yet');
        //return decryption_proof.verify(this.g, ciphertext.alpha, this.y, decryption_factor, this.p, this.q, challenge_generator);
    }

    static fromJSONObject(config) {
        if (config.p == null || config.g == null || config.q == null) {
            throw new Error('Not enough ElGamal params');
        }
        let params = new ElgamParams(bigInt(config.p), bigInt(config.g), bigInt(config.q));
        return new PublicKey(params, bigInt(config.y));
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            params: this._params.toJSON(radix),
            y: this._y.toString(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

export interface ChallengeGenerator {
    generate(commitments: Commitment[], q: BigInteger): Promise<BigInteger>;
}

/**
 * Обязательство. Фактически является ЭЦП по используемой схеме шифрования.
 * Подходит как для Эль-Гамаля, так и для эллиптических кривых.
 */
export class Commitment {
    /**
     *
     * @param _A раскрывающий множитель
     * @param _B шифр
     */
    constructor(
        private _A: BigInteger,
        private _B: BigInteger
    ) { }

    get A() { return this._A; }
    get B() { return this._B; }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            a: this._A.toString(radix),
            b: this._B.toString(radix)
        };
    }

    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Доказательство с нулевым знанием
 */
export class Proof {
    /**
     *
     * @param _commitment обязательство, по которому формируется доказательство
     * @param _challenge вызов
     * @param _response ответ
     */
    constructor(
        private _commitment: Commitment,
        private _challenge?: BigInteger,
        private _response?: BigInteger
    ) { }

    get commitment() { return this._commitment; }
    get challenge() { return this._challenge; }
    get response() { return this._response; }

    // a generic way to prove that four values are a DH tuple.
    // a DH tuple is g,h,G,H where G = g^x and H=h^x
    // challenge generator takes a commitment, whose subvalues are A and B
    // all modulo p, with group order q, which we provide just in case.
    // as it turns out, G and H are not necessary to generate this proof, given that they're implied by x.
    static async generate<T extends ChallengeGenerator>(pk: PublicKey, x: BigInteger, challengeGenerator: T): Promise<Proof> {
        let little_g = pk.params.g;
        let little_h = pk.y;
        let p = pk.params.p;
        let q = pk.params.q;
        // generate random w
        var w = ElGamal.getRandomInteger(pk.params);

        // compute A=little_g^w, B=little_h^w
        let A = little_g.modPow(w, p);
        let B = little_h.modPow(w, p);
        let commitment = new Commitment(A, B);

        // Get the challenge from the callback that generates it
        let challenge = await challengeGenerator.generate([commitment], q);

        // Compute response = w + x * challenge
        let response = w.add(x.multiply(challenge).mod(q));

        return new Proof(commitment, challenge, response);
    }

    // simulate a a DH-tuple proof, with a potentially assigned challenge (but can be null)
    static simulate(pk: PublicKey, big_g: BigInteger, big_h: BigInteger, challenge: BigInteger) {
        let little_g = pk.params.g;
        let little_h = pk.y;
        let p = pk.params.p;
        let q = pk.params.q;
        // generate a random challenge if not provided
        if (challenge == null) {
            challenge = ElGamal.getRandomInteger(pk.params);
        }

        // random response, does not even need to depend on the challenge
        let response = ElGamal.getRandomInteger(pk.params);

        // now we compute A and B
        // A = little_g ^ w, and at verification time, g^response = G^challenge * A, so A = (G^challenge)^-1 * g^response
        let A = big_g.modPow(challenge, p).modInv(p).multiply(little_g.modPow(response, p)).mod(p);

        // B = little_h ^ w, and at verification time, h^response = H^challenge * B, so B = (H^challenge)^-1 * h^response
        let B = big_h.modPow(challenge, p).modInv(p).multiply(little_h.modPow(response, p)).mod(p);
        let commitment = new Commitment(A, B);
        return new Proof(commitment, challenge, response);
    }

    async verify(little_g: BigInteger, little_h: BigInteger,
        big_g: BigInteger, big_h: BigInteger,
        p: BigInteger, q: BigInteger, challenge_generator: ChallengeGenerator): Promise<boolean> {
        // check that little_g^response = A * big_g^challenge
        let first_check = little_g.modPow(this.response, p).equals(big_g.modPow(this.challenge, p).multiply(this.commitment.A).mod(p));

        // check that little_h^response = B * big_h^challenge
        let second_check = little_h.modPow(this.response, p).equals(big_h.modPow(this.challenge, p).multiply(this.commitment.B).mod(p));

        let third_check = true;

        if (challenge_generator) {
            third_check = this.challenge.equals(await challenge_generator.generate([this.commitment], q));
        }

        return (first_check && second_check && third_check);
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            commitment: this._commitment.toJSON(radix),
            challenge: this._challenge.toString(radix),
            response: this._response.toString(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Дизъюнктивное доказательство Чаума-Педерсена
 */
export class DisjunctiveProof {
    constructor(
        private _proofs: Proof[]
    ) { }

    get proofs() { return this._proofs; }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            proofs: this._proofs.map(p => p.toJSON(radix))
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Доказательство знания дискретного логарифма (закрытого ключа)
 */
export class DLogProof {
    constructor(
        private _commitment: BigInteger,
        private _challenge: BigInteger,
        private _response: BigInteger
    ) { }

    get commitment() { return this._commitment; }
    get challenge() { return this._challenge; }
    get response() { return this._response; }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            commitment: this._commitment.toString(radix),
            challenge: this._challenge.toString(radix),
            response: this._response.toString(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Раскрывающий множитель с доказательством
 */
export class DecryptionFactorAndProof {
    /**
     *
     * @param _decryptionFactor раскрывающий множитель
     * @param _decryptionProof доказательство с нулевым знанием
     */
    constructor(
        private _decryptionFactor: BigInteger,
        private _decryptionProof: Proof
    ) { }

    get decryptionFactor() { return this._decryptionFactor; }
    get decryptionProof() { return this._decryptionProof; }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            decryptionFactor: this._decryptionFactor.toString(radix),
            decryptionProof: this._decryptionProof.toJSON(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

/**
 * Чистый текст с доказательством
 */
export class PlaintextAndProof {
    /**
     *
     * @param _plaintext чистый текст
     * @param _proof доказательство с нулевым знанием
     */
    constructor(
        private _plaintext: Plaintext,
        private _proof: Proof
    ) { }

    get plaintext() { return this._plaintext; }
    get proof() { return this._proof; }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            plaintext: this._plaintext.toJSON(radix),
            proof: this._proof.toJSON(radix)
        };
    }
    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix))
    }
}

export class DisjunctiveChallengeGenerator implements ChallengeGenerator {
    generate(commitments: Commitment[], q: BigInteger): Promise<BigInteger> {
        let stringsToHash = [];

        // go through all proofs and append the commitments
        for (let commitment of commitments) {
            stringsToHash.push(commitment.A.toString());
            stringsToHash.push(commitment.B.toString());
        }

        return new Promise<BigInteger>((resolve, reject) => {
            Gost.hash(GOST_R_34_11.LENGTH_256, stringsToHash.join(",")).then(hash => {
                resolve(bigInt(hash, 16).mod(q));
            }).catch(err => {
                reject(err.message);
            });
        });
    }
}

export class FiatShamirChallengeGenerator implements ChallengeGenerator {
    generate(commitments: Commitment[], q: BigInteger): Promise<BigInteger> {
        return new DisjunctiveChallengeGenerator().generate(commitments, q);
    }
}
