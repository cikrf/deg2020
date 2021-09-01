import { Inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { pluck, switchMap } from 'rxjs/operators';
import { EncryptedBulletin, Point } from '@vostokplatform/voting-encrypt/dist/interfaces';
import { Encrypt } from '@vostokplatform/voting-encrypt';
import { APP_IS_PLATFORM_BROWSER } from '@shared/providers/is-platform';
import { DOCKER_CALL_V2_TX_NAME } from '@vostokplatform/waves-api/raw/src/constants';
import { main } from '@angular/compiler-cli/src/main';

declare var WavesAPI;

const fetchInstance = (url, options: any = {}): any => {
  const headers = options.headers || {};
  return window.fetch(url, { ...options, headers: {...headers, 'x-api-key': 'vostok'} });
};

type VoteVariant = 1 | 0;
type Vote = Array<VoteVariant>;

type ContractParamType = 'string';
type ContractParamKey = keyof TransactionData;

type BlindSignatureData = string;

interface TransactionData {
  vote: Vote[];
  blindSignature: BlindSignatureData;
}

interface RequiredTransactionData {
  vote: EncryptedBulletin[];
  blindSig: BlindSignatureData;
  operation: 'vote';
}

interface ContractParam {
  type: ContractParamType;
  key: ContractParamKey;
  value: any;
}

type ContractParams = Array<ContractParam>;

interface Transaction {
  senderPublicKey: string;
  contractId: string;
  version: number;
  timestamp: number;
  params: ContractParams;
  fee: number;
  type: number;

  // todo следующие поля должны быть выпилены
  authorPublicKey: string;
  contractVersion: number;
}

type SignedTransaction = {proofs: string[]} & Transaction;

@Injectable()
export class BlockchainService {

  private readonly chainId: string = 'R';
  private readonly networkByte: number = this.chainId.charCodeAt(0);
  private readonly basePoint: Point = [
    '55066263022277343669578718895168534326250603453777594175500187360389116729240',
    '32670510020758816978083085130507043184471273380659243275938904335757337482424',
  ];
  private readonly q: string = '115792089237316195423570985008687907852837564279074904382605163141518161494337';
  private readonly pedersenBase: Point = [
    '31840000124805594708716908823730049919282872088758887139161784794466556143989',
    '34159713578909946807425318728956240239794987299568203108985430402093588737051',
  ];
  private readonly hashLength: string = '256';

  api = this.isBrowser ? WavesAPI.create({
    fetchInstance,
    initialConfiguration: {
      nodeAddress: '/blockchain-api-node/nodeAddress',
      matcherAddress: 'https://matcher.wavesplatform.com/matcher',
      minimumSeedLength: 25,
      // включаем гост криптографию
      crypto: 'gost',
      // байт сети - взяли из конфига ноды
      networkByte: this.networkByte,
    },
  // } as IWavesAPICtr) : null;
  } as any) : null;

  constructor(
    @Inject(APP_IS_PLATFORM_BROWSER) private isBrowser: boolean,
    private http: HttpClient,
  ) {
  }

  sign(transaction: Transaction, seed: {publicKey: string, privateKey: string}): Observable<SignedTransaction> {
    // @ts-ignore
    return from(this.api.API.Node.transactions.sign(DOCKER_CALL_V2_TX_NAME, transaction, seed));

    // const SignatureGenerator: ISignatureGeneratorConstructor = generate<IDOCKERCALL_V2_PROPS>([
    //   TRANSACTION_TYPE_NUMBER.DOCKER_CALL_V2,
    //   TRANSACTION_TYPE_VERSION.DOCKER_CALL_V2,
    //   new Base58('senderPublicKey'),
    //   new Base58WithLength('contractId'),
    //   new DockerCreateParamsEntries('params'),
    //   new Long('fee'),
    //   new Long('timestamp'),
    //   new Integer('contractVersion'),
    // ]);
    //
    // new SignatureGenerator(transaction).getSignature(seed.keyPair.privateKey, true).then((signature) => {
    //   console.log('mysign', signature);
    // });
    //
    // new SignatureGenerator(transaction).getSignature(seed.keyPair.privateKey, true).then((signature) => {
    //   console.log('mysign2', signature);
    // });
  }

  private encryptVote(vote: Array<Vote>, mainKey: {x: string, y: string}): EncryptedBulletin[] {
    const enc = new Encrypt({
      mainKey: [mainKey.x, mainKey.y],
      basePoint: this.basePoint,
      hashLength: this.hashLength,
      q: this.q,
      pedersenBase: this.pedersenBase,
    });
    return vote.map((v) => enc.makeEncryptedBulletin(v));
  }

  createTransaction(
    seed: {publicKey: string, privateKey: string},
    contractId: string,
    {vote, blindSignature}: TransactionData,
    mainKey: {x: string, y: string},
  ): Observable<SignedTransaction> {
    // todo некрасиво
    return this.http.get('/api/public/vote/time').pipe(
      pluck('data'),
      switchMap((time: number) => {
        const transaction: Transaction = {
          senderPublicKey: seed.publicKey,
          contractId,
          timestamp: time,
          params: this.convertObjectToContractParams({
            operation: 'vote',
            vote: this.encryptVote(vote, mainKey),
            blindSig: blindSignature,
          }),
          fee: 0,
          type: 104,
          version: 1, // 3,

          // todo лишние поля
          authorPublicKey: seed.publicKey,
          contractVersion: 1,
        };
        return this.sign(transaction, seed);
      }),
    );
  }

  private convertObjectToContractParams(input: RequiredTransactionData): ContractParams {
    return Object.entries(input).map(([key, value]) => {
      value = typeof value === 'string' ? value : JSON.stringify(value);
      return {
        key,
        value,
        type: 'string',
      } as ContractParam;
    });
  }

}
