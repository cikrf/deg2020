/* tslint:disable */
import * as crypto from 'gost-crypto';
import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';
import { CryptUtils } from './utils';
import { ModPoint } from './ec-math/modpoint';
import { ModCurve } from './ec-math/curve';
import { forkJoin, from, Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

/**
 * Алгоритм вычисления хеша
 */
export enum GOST_R_34_11 {
    LENGTH_256 = 256,
    LENGTH_512 = 512
}

/**
 * Алгоритм электронной цифровой подписи
 */
export enum GOST_R_34_10 {
    OTHER = 0,
    LENGTH_256 = 256,
    LENGTH_512 = 512,
}

/**
 * Эллиптические кривые, используемые в ГОСТ 34.10-2012
 */
export enum GOST_CURVE_34_10_2012 {
    /** id-GostR3410-2001-TestParamSet */
    S_256_TEST = 'S-256-TEST',
    /** id-GostR3410-2001-CryptoPro-A-ParamSet */
    S_256_A = 'S-256-A',
    /** id-GostR3410-2001-CryptoPro-B-ParamSet */
    S_256_B = 'S-256-B',
    /** id-GostR3410-2001-CryptoPro-C-ParamSet */
    S_256_C = 'S-256-C',
    /** secp256r1 (SignalCom) */
    P_256 = 'P-256',
    /** id-GostR3410-2001-CryptoPro-XchA-ParamSet */
    X_256_A = 'X-256-A',
    /** id-GostR3410-2001-CryptoPro-XchB-ParamSet */
    X_256_B = 'X-256-B',
    /** id-tc26-gost-3410-12-512-paramSetTest */
    T_512_TEST = 'T-512-TEST',
    /** id_tc26_gost_3410_12_256_paramSetA */
    T_256_A = 'T-256-A',
    /** id-tc26-gost-3410-12-512-paramSetA */
    T_512_A = 'T-512-A',
    /** id-tc26-gost-3410-12-512-paramSetA */
    T_512_B = 'T-512-B'
}

export class KeyPair {
    constructor(
        private _privateKey: BigInteger,
        private _publicKey: BigInteger
    ) {
    }

    get privateKey() {
        return this._privateKey;
    }

    get publicKey() {
        return this._publicKey;
    }
}

export class EcKeyPair extends KeyPair {
    constructor(
        privateKey: BigInteger,
        publicKey: BigInteger,
        private _publicPoint: ModPoint
    ) {
        super(privateKey, publicKey);
    }

    get publicPoint() {
        return this._publicPoint;
    }

    toJSON(radix?: number) {
        radix = radix | 16;
        return {
            privateKey: this.privateKey.toString(radix),
            publicKey: this.publicKey.toString(radix),
            publicPoint: this._publicPoint.toJSON(radix)
        };
    }

    toString(radix?: number) {
        radix = radix | 16;
        return JSON.stringify(this.toJSON(radix));
    }
}

export class Gost {

    /**
     * Вычисление хэша по алгоритму Стрибог.
     * Данные приводятся к строке, а затем в массив байтов,
     * от которого вычисляется хэш.
     *
     * @param type тип хэша определяет его длину
     * @param data данные, по которым вычисляется хэш.
     * @param year
     */
    static async hashNew(type: GOST_R_34_11, data: string, year: string = '12'): Promise<string> {
        const algorithmName = `GOST R 34.11-${type}-${year}`;
        const uint8array = crypto.coding.Hex.decode(data);

        const hashBytes = await crypto.subtle.digest(algorithmName, uint8array).catch((error) => {
            console.log('Can\'t calculate GOST 34.11 hash.');
            console.log(error.message);
        });

        if (!hashBytes) {
            return '';
        }

        return [...new Uint8Array (hashBytes)].reverse()
          .map (b => b.toString (16).padStart (2, '0'))
          .join ('');
    }

    /**
     * Вычисление хэша по алгоритму Стрибог.
     * Данные приводятся к строке, а затем в массив байтов,
     * от которого вычисляется хэш.
     *
     * @param type тип хэша определяет его длину
     * @param data данные, по которым вычисляется хэш.
     * @param year
     */
    static async hash(type: GOST_R_34_11, data: string, year: string = '12'): Promise<string> {
        const algorithmName = `GOST R 34.11-${type}-${year}`;
        const uint8array = new TextEncoder().encode(data);

        const hashBytes = await crypto.subtle.digest(algorithmName, uint8array).catch((error) => {
            console.log('Can\'t calculate GOST 34.11 hash.');
            console.log(error.message);
        });

        if (!hashBytes) {
            return '';
        }

        // return crypto.coding.Hex.encode(hashBytes);
        return [...new Uint8Array (hashBytes)]
            .map (b => b.toString (16).padStart (2, '0'))
            .join (''); //  CryptUtils.byteArrayToHexString(hashBytes);
    }

    static getCurveByName(name: string): ModCurve {
        const ecp = ECGostParams[name];
        return new ModCurve(bigInt(ecp.a), bigInt(ecp.b), bigInt(ecp.p), bigInt(ecp.x), bigInt(ecp.y));
    }

    /**
     * Генерация открытого ключа по заданной кривой и закрытому ключу
     *
     * @param algorithmType алгоритм ЭЦП
     * @param privateKey закрытый ключ
     * @param namedCurve кривая из списка ГОСТ 34.10-2012
     */
    static async generatePublicKey(algorithmType: GOST_R_34_10, privateKey: BigInteger, namedCurve: GOST_CURVE_34_10_2012): Promise<EcKeyPair> {
        const algorithmName = 'GOST R 34.10' + (algorithmType == GOST_R_34_10.OTHER ? '' : '-' + algorithmType.toString()) + '-12';
        if (algorithmType == GOST_R_34_10.OTHER) {
            throw new Error('Manual elliptic curve parameters set is not supported yet.');
        }
        const algorithm = {
            name: algorithmName,
            ukm: CryptUtils.bigIntTobyteArray(privateKey),
            namedCurve: namedCurve.toString()
        };

        return await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']).then(async function(keyPair) {
            // Store key in secluded place
            const privateKey: BigInteger = await crypto.subtle.exportKey('raw', keyPair.privateKey).then(function(result) {
                return CryptUtils.byteArrayToBigInt(result);
            });
            // Provide the public key to recepient
            const publicKey: BigInteger = await crypto.subtle.exportKey('raw', keyPair.publicKey).then(function(result) {
                return CryptUtils.byteArrayToBigInt(result);
            });
            // const curve = Gost.getAlgorithmCurve(algorithm);
            const curve = Gost.getCurveByName(namedCurve);
            const publicKeyPoint = Gost.publicKeyToPoint(publicKey, algorithmType, curve);
            const publicPoint = new ModPoint(publicKeyPoint.x, publicKeyPoint.y, curve);
            return new EcKeyPair(privateKey, publicKey, publicPoint);
        });
    }

    /**
     * Генерация открытого ключа по заданной кривой и закрытому ключу
     *
     * @param algorithmType алгоритм ЭЦП
     * @param privateKey закрытый ключ
     * @param namedCurve кривая из списка ГОСТ 34.10-2012
     */
    static generatePublicKey$(algorithmType: GOST_R_34_10, privateKey: BigInteger, namedCurve: GOST_CURVE_34_10_2012): Observable<EcKeyPair> {
        const algorithmName = 'GOST R 34.10' + (algorithmType == GOST_R_34_10.OTHER ? '' : '-' + algorithmType.toString()) + '-12';
        if (algorithmType == GOST_R_34_10.OTHER) {
            throw new Error('Manual elliptic curve parameters set is not supported yet.');
        }
        const algorithm = {
            name: algorithmName,
            ukm: CryptUtils.bigIntTobyteArray(privateKey),
            namedCurve: namedCurve.toString()
        };

        return from(crypto.subtle.generateKey(algorithm, true, ['sign', 'verify'])).pipe(
            flatMap((keyPair: CryptoKeyPair) => forkJoin(
                from(crypto.subtle.exportKey('raw', keyPair.privateKey)).pipe(map(result => CryptUtils.byteArrayToBigInt(result))),
                from(crypto.subtle.exportKey('raw', keyPair.publicKey)).pipe(map(result => CryptUtils.byteArrayToBigInt(result)))
            )),
            map(([_, publicKey]) => {
                // const curve = Gost.getAlgorithmCurve(algorithm);
                const curve = Gost.getCurveByName(namedCurve);
                const publicKeyPoint = Gost.publicKeyToPoint(publicKey, algorithmType, curve);
                const publicPoint = new ModPoint(publicKeyPoint.x, publicKeyPoint.y, curve);
                return new EcKeyPair(privateKey, publicKey, publicPoint);
            })
        );
    }

    /**
     * Выделить из открытого ключа точку эллиптической кривой
     *
     * @param publicKey _
     * @param curveType _
     * @param curve _
     */
    static publicKeyToPoint(publicKey: BigInteger, curveType: GOST_R_34_10, curve: ModCurve): ModPoint {
        const mask = bigInt.one.shiftLeft(curveType).subtract(1);
        const x = publicKey.and(mask);
        const y = publicKey.shiftRight(curveType);
        return new ModPoint(x, y, curve);
    }
}

// Predefined named curve collection
export const ECGostParams = {
    'S-256-TEST': {
        a: bigInt('7'),
        b: bigInt('5FBFF498AA938CE739B8E022FBAFEF40563F6E6A3472FC2A514C0CE9DAE23B7E', 16),
        p: bigInt('8000000000000000000000000000000000000000000000000000000000000431', 16),
        q: bigInt('8000000000000000000000000000000150FE8A1892976154C59CFC193ACCF5B3', 16),
        x: bigInt('2'),
        y: bigInt('8E2A8A0E65147D4BD6316030E16D19C85C97F0A9CA267122B96ABBCEA7E8FC8', 16),
    },
    'S-256-A': {
        a: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD94', 16),
        b: bigInt('166'),
        p: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD97', 16),
        q: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF6C611070995AD10045841B09B761B893', 16),
        x: bigInt('1'),
        y: bigInt('8D91E471E0989CDA27DF505A453F2B7635294F2DDF23E3B122ACC99C9E9F1E14', 16),
    },
    'S-256-B': {
        a: bigInt('8000000000000000000000000000000000000000000000000000000000000C96', 16),
        b: bigInt('3E1AF419A269A5F866A7D3C25C3DF80AE979259373FF2B182F49D4CE7E1BBC8B', 16),
        p: bigInt('8000000000000000000000000000000000000000000000000000000000000C99', 16),
        q: bigInt('800000000000000000000000000000015F700CFFF1A624E5E497161BCC8A198F', 16),
        x: bigInt('1'),
        y: bigInt('3FA8124359F96680B83D1C3EB2C070E5C545C9858D03ECFB744BF8D717717EFC', 16),
    },
    'S-256-C': {
        a: bigInt('9B9F605F5A858107AB1EC85E6B41C8AACF846E86789051D37998F7B9022D7598', 16),
        b: bigInt('32858'),
        p: bigInt('9B9F605F5A858107AB1EC85E6B41C8AACF846E86789051D37998F7B9022D759B', 16),
        q: bigInt('9B9F605F5A858107AB1EC85E6B41C8AA582CA3511EDDFB74F02F3A6598980BB9', 16),
        x: bigInt('0'),
        y: bigInt('41ECE55743711A8C3CBF3783CD08C0EE4D4DC440D4641A8F366E550DFDB3BB67', 16),
    },
    'P-256': {
        p: bigInt('FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF', 16),
        a: bigInt('FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC', 16),
        b: bigInt('5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B', 16),
        x: bigInt('6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296', 16),
        y: bigInt('4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5', 16),
        q: bigInt('FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551', 16),
    },
    'T-512-TEST': {
        a: bigInt('7'),
        b: bigInt('1CFF0806A31116DA29D8CFA54E57EB748BC5F377E49400FDD788B649ECA1AC4361834013B2AD7322480A89CA58E0CF74BC9E540C2ADD6897FAD0A3084F302ADC', 16),
        p: bigInt('4531ACD1FE0023C7550D267B6B2FEE80922B14B2FFB90F04D4EB7C09B5D2D15DF1D852741AF4704A0458047E80E4546D35B8336FAC224DD81664BBF528BE6373', 16),
        q: bigInt('4531ACD1FE0023C7550D267B6B2FEE80922B14B2FFB90F04D4EB7C09B5D2D15DA82F2D7ECB1DBAC719905C5EECC423F1D86E25EDBE23C595D644AAF187E6E6DF', 16),
        x: bigInt('24D19CC64572EE30F396BF6EBBFD7A6C5213B3B3D7057CC825F91093A68CD762FD60611262CD838DC6B60AA7EEE804E28BC849977FAC33B4B530F1B120248A9A', 16),
        y: bigInt('2BB312A43BD2CE6E0D020613C857ACDDCFBF061E91E5F2C3F32447C259F39B2C83AB156D77F1496BF7EB3351E1EE4E43DC1A18B91B24640B6DBB92CB1ADD371E', 16),
    },
    'T-512-A': {
        p: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDC7', 16),
        a: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDC4', 16),
        b: bigInt('E8C2505DEDFC86DDC1BD0B2B6667F1DA34B82574761CB0E879BD081CFD0B6265EE3CB090F30D27614CB4574010DA90DD862EF9D4EBEE4761503190785A71C760', 16),
        q: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF27E69532F48D89116FF22B8D4E0560609B4B38ABFAD2B85DCACDB1411F10B275', 16),
        x: bigInt('3'),
        y: bigInt('7503CFE87A836AE3A61B8816E25450E6CE5E1C93ACF1ABC1778064FDCBEFA921DF1626BE4FD036E93D75E6A50E3A41E98028FE5FC235F5B889A589CB5215F2A4', 16),
    },
    'T-256-A': {
        p: bigInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD97', 16),
        a: bigInt('C2173F1513981673AF4892C23035A27CE25E2013BF95AA33B22C656F277E7335', 16),
        b: bigInt('295F9BAE7428ED9CCC20E7C359A9D41A22FCCD9108E17BF7BA9337A6F8AE9513', 16),
        q: bigInt('400000000000000000000000000000000FD8CDDFC87B6635C115AF556C360C67', 16),
        x: bigInt('91E38443A5E82C0D880923425712B2BB658B9196932E02C78B2582FE742DAA28', 16),
        y: bigInt('32879423AB1A0375895786C4BB46E9565FDE0B5344766740AF268ADB32322E5C', 16),
    },
    'X-256-A': {
        p: bigInt('115792089237316195423570985008687907853269984665640564039457584007913129639319'),
        a: bigInt('115792089237316195423570985008687907853269984665640564039457584007913129639316'),
        b: bigInt('166'),
        q: bigInt('115792089237316195423570985008687907853073762908499243225378155805079068850323'),
        x: bigInt('1'),
        y: bigInt('64033881142927202683649881450433473985931760268884941288852745803908878638612'),
    },
    'T-512-B': {
        p: bigInt('8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006F', 16),
        a: bigInt('8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006C', 16),
        b: bigInt('687D1B459DC841457E3E06CF6F5E2517B97C7D614AF138BCBF85DC806C4B289F3E965D2DB1416D217F8B276FAD1AB69C50F78BEE1FA3106EFB8CCBC7C5140116', 16),
        q: bigInt('800000000000000000000000000000000000000000000000000000000000000149A1EC142565A545ACFDB77BD9D40CFA8B996712101BEA0EC6346C54374F25BD', 16),
        x: bigInt('2'),
        y: bigInt('1A8F7EDA389B094C2C071E3647A8940F3C123B697578C213BE6DD9E6C8EC7335DCB228FD1EDF4A39152CBCAAF8C0398828041055F94CEEEC7E21340780FE41BD', 16),
    },
};
// Перетирает адекватные алгоритмы
// ECGostParams['X-256-A'] = ECGostParams['S-256-A'];
// ECGostParams['X-256-B'] = ECGostParams['S-256-C'];
// ECGostParams['T-256-TEST'] = ECGostParams['S-256-TEST'];
// ECGostParams['T-256-A'] = ECGostParams['S-256-A'];
// ECGostParams['T-256-B'] = ECGostParams['S-256-B'];
// ECGostParams['T-256-C'] = ECGostParams['S-256-C'];


export const GostParams = {
    'S-TEST': {
        modulusLength: 512, // bit length of p (512 or 1024 bits)
        p: bigInt('EE8172AE8996608FB69359B89EB82A69854510E2977A4D63BC97322CE5DC3386EA0A12B343E9190F23177539845839786BB0C345D165976EF2195EC9B1C379E3', 16),
        q: bigInt('98915E7EC8265EDFCDA31E88F24809DDB064BDC7285DD50D7289F0AC6F49DD2D', 16),
        a: bigInt('9e96031500c8774a869582d4afde2127afad2538b4b6270a6f7c8837b50d50f206755984a49e509304d648be2ab5aab18ebe2cd46ac3d8495b142aa6ce23e21c', 16),
    },
    'S-A': {
        modulusLength: 1024,
        p: bigInt('B4E25EFB018E3C8B87505E2A67553C5EDC56C2914B7E4F89D23F03F03377E70A2903489DD60E78418D3D851EDB5317C4871E40B04228C3B7902963C4B7D85D52B9AA88F2AFDBEB28DA8869D6DF846A1D98924E925561BD69300B9DDD05D247B5922D967CBB02671881C57D10E5EF72D3E6DAD4223DC82AA1F7D0294651A480DF', 16),
        q: bigInt('972432A437178B30BD96195B773789AB2FFF15594B176DD175B63256EE5AF2CF', 16),
        a: bigInt('8FD36731237654BBE41F5F1F8453E71CA414FFC22C25D915309E5D2E62A2A26C7111F3FC79568DAFA028042FE1A52A0489805C0DE9A1A469C844C7CABBEE625C3078888C1D85EEA883F1AD5BC4E6776E8E1A0750912DF64F79956499F1E182475B0B60E2632ADCD8CF94E9C54FD1F3B109D81F00BF2AB8CB862ADF7D40B9369A', 16),
    },
    'S-B': {
        modulusLength: 1024,
        p: bigInt('C6971FC57524B30C9018C5E621DE15499736854F56A6F8AEE65A7A404632B1BCF0349FFCAFCB0A103177971FC1612ADCDB8C8CC938C70225C8FD12AFF01B1D064E0AD6FDE6AB9159166CB9F2FC171D92F0CC7B6A6B2CD7FA342ACBE2C9315A42D576B1ECCE77A963157F3D0BD96A8EB0B0F3502AD238101B05116334F1E5B7AB', 16),
        q: bigInt('B09D634C10899CD7D4C3A7657403E05810B07C61A688BAB2C37F475E308B0607', 16),
        a: bigInt('3D26B467D94A3FFC9D71BF8DB8934084137264F3C2E9EB16DCA214B8BC7C872485336744934FD2EF5943F9ED0B745B90AA3EC8D70CDC91682478B664A2E1F8FB56CEF2972FEE7EDB084AF746419B854FAD02CC3E3646FF2E1A18DD4BEB3C44F7F2745588029649674546CC9187C207FB8F2CECE8E2293F68395C4704AF04BAB5', 16),
    },
    'S-C': {
        modulusLength: 1024,
        p: bigInt('9D88E6D7FE3313BD2E745C7CDD2AB9EE4AF3C8899E847DE74A33783EA68BC30588BA1F738C6AAF8AB350531F1854C3837CC3C860FFD7E2E106C3F63B3D8A4C034CE73942A6C3D585B599CF695ED7A3C4A93B2B947B7157BB1A1C043AB41EC8566C6145E938A611906DE0D32E562494569D7E999A0DDA5C879BDD91FE124DF1E9', 16),
        q: bigInt('FADD197ABD19A1B4653EECF7ECA4D6A22B1F7F893B641F901641FBB555354FAF', 16),
        a: bigInt('7447ED7156310599070B12609947A5C8C8A8625CF1CF252B407B331F93D639DDD1BA392656DECA992DD035354329A1E95A6E32D6F47882D960B8F10ACAFF796D13CD9611F853DAB6D2623483E46788708493937A1A29442598AEC2E0742022563440FE9C18740ECE6765AC05FAF024A64B026E7E408840819E962E7E5F401AE3', 16),
    },
    'S-D': {
        modulusLength: 1024,
        p: bigInt('80F102D32B0FD167D069C27A307ADAD2C466091904DBAA55D5B8CC7026F2F7A1919B890CB652C40E054E1E9306735B43D7B279EDDF9102001CD9E1A831FE8A163EED89AB07CF2ABE8242AC9DEDDDBF98D62CDDD1EA4F5F15D3A42A6677BDD293B24260C0F27C0F1D15948614D567B66FA902BAA11A69AE3BCEADBB83E399C9B5', 16),
        q: bigInt('F0F544C418AAC234F683F033511B65C21651A6078BDA2D69BB9F732867502149', 16),
        a: bigInt('6BCC0B4FADB3889C1E06ADD23CC09B8AB6ECDEDF73F04632595EE4250005D6AF5F5ADE44CB1E26E6263C672347CFA26F9E9393681E6B759733784CDE5DBD9A14A39369DFD99FA85CC0D10241C4010343F34A91393A706CF12677CBFA1F578D6B6CFBE8A1242CFCC94B3B653A476E145E3862C18CC3FED8257CFEF74CDB205BF1', 16),
    },
    'X-A': {
        modulusLength: 1024,
        p: bigInt('CA3B3F2EEE9FD46317D49595A9E7518E6C63D8F4EB4D22D10D28AF0B8839F079F8289E603B03530784B9BB5A1E76859E4850C670C7B71C0DF84CA3E0D6C177FE9F78A9D8433230A883CD82A2B2B5C7A3306980278570CDB79BF01074A69C9623348824B0C53791D53C6A78CAB69E1CFB28368611A397F50F541E16DB348DBE5F', 16),
        q: bigInt('CAE4D85F80C147704B0CA48E85FB00A9057AA4ACC44668E17F1996D7152690D9', 16),
        a: bigInt('BE27D652F2F1E339DA734211B85B06AE4DE236AA8FBEEB3F1ADCC52CD43853777E834A6A518138678A8ADBD3A55C70A7EAB1BA7A0719548677AAF4E609FFB47F6B9D7E45B0D06D83D7ADC53310ABD85783E7317F7EC73268B6A9C08D260B85D8485696CA39C17B17F044D1E050489036ABD381C5E6BF82BA352A1AFF136601AF', 16),
    },
    'X-B': {
        modulusLength: 1024,
        p: bigInt('9286DBDA91ECCFC3060AA5598318E2A639F5BA90A4CA656157B2673FB191CD0589EE05F4CEF1BD13508408271458C30851CE7A4EF534742BFB11F4743C8F787B11193BA304C0E6BCA25701BF88AF1CB9B8FD4711D89F88E32B37D95316541BF1E5DBB4989B3DF13659B88C0F97A3C1087B9F2D5317D557DCD4AFC6D0A754E279', 16),
        q: bigInt('C966E9B3B8B7CDD82FF0F83AF87036C38F42238EC50A876CD390E43D67B6013F', 16),
        a: bigInt('7E9C3096676F51E3B2F9884CF0AC2156779496F410E049CED7E53D8B7B5B366B1A6008E5196605A55E89C3190DABF80B9F1163C979FCD18328DAE5E9048811B370107BB7715F82091BB9DE0E33EE2FED6255474F8769FCE5EAFAEEF1CB5A32E0D5C6C2F0FC0B3447072947F5B4C387666993A333FC06568E534AD56D2338D729', 16),
    },
    'X-C': {
        modulusLength: 1024,
        p: bigInt('B194036ACE14139D36D64295AE6C50FC4B7D65D8B340711366CA93F383653908EE637BE428051D86612670AD7B402C09B820FA77D9DA29C8111A8496DA6C261A53ED252E4D8A69A20376E6ADDB3BDCD331749A491A184B8FDA6D84C31CF05F9119B5ED35246EA4562D85928BA1136A8D0E5A7E5C764BA8902029A1336C631A1D', 16),
        q: bigInt('96120477DF0F3896628E6F4A88D83C93204C210FF262BCCB7DAE450355125259', 16),
        a: bigInt('3F1817052BAA7598FE3E4F4FC5C5F616E122CFF9EBD89EF81DC7CE8BF56CC64B43586C80F1C4F56DD5718FDD76300BE336784259CA25AADE5A483F64C02A20CF4A10F9C189C433DEFE31D263E6C9764660A731ECCAECB74C8279303731E8CF69205BC73E5A70BDF93E5BB681DAB4EEB9C733CAAB2F673C475E0ECA921D29782E', 16),
    },
};
