import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, mergeMap, pluck } from 'rxjs/operators';
import { encrypt } from '../utils/rxjs-operators/encrypt';
import { Md5 } from 'ts-md5';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';
import { ApiResponseElectionDto, CandidateDto, ElectionDto } from '@shared/models/portal.models';

@Injectable()
export class VotingService {

  constructor(
    private http: HttpClient,
    private esia: EsiaAuthService,
  ) {
  }

  checkAuthentication(electionId: string): Observable<any> {
    return this.http.get('/api/public/verification', {
      params: {
        electionId
      },
      headers: {
        'Esia-Auth-Token': this.esia.token, // todo подумать
      },
    });
  }

  isBallotIssued(electionId: string): Observable<boolean> {
    return this.http.get<{ data: boolean }>('/api/public/elections/ballot/' + electionId + '/issued', {
      headers: {
        Authorization: `Bearer ${this.esia.token}`, // todo подумать
        // 'Esia-Auth-Token': this.esia.token, // todo подумать
      },
    }).pipe(
      pluck('data'),
      map(y => !!y),
    );
  }

  getElection(id: string): Observable<ElectionDto> {
    return this.http.get<ApiResponseElectionDto>('/api/public/elections/' + id + '/model', {
      headers: {
        // 'Esia-Auth-Token': this.esia.token, // todo подумать
      },
    }).pipe(
      pluck('data'),
    );
  }

  getVoteData(id: string, message: string, passphrase: string): Observable<{
    blindSign: string,
    contractId: string,
    mainKey: [string, string],
  }> {
    return this.http.get('/api/public/elections/' + id, {
      params: {
        message,
        passphrase,
      },
      headers: {
        'Esia-Auth-Token': this.esia.token, // todo подумать
      },
    }).pipe(
      pluck('data'),
    );
  }

  vote(vote: ElectionDto & any, idCandidate: any): Observable<any> {
    return of(JSON.stringify({
      id: vote.id,
      candidates: vote.candidates.map((i: CandidateDto) => {
        return {
          id: i.id,
          externalId: i.externalId,
          isVote: i.isVote,
        };
      })
    })).pipe(
      encrypt(vote.publicKey),
      map(({encoded, key, iv}: any) => {
        return {
          hash: Md5.hashStr(vote.token, false),
          id: vote.id.toString(),
          vote: encoded, // to json + encrypted with voting public key,
          key,
          iv,
        };
      }), mergeMap((box: any) => this.http.post('/api/ballot-box/vote', box).pipe(map((t: any) => t.data))));
  }

  getPassphrase(id: string): Observable<any> {
    return this.http.get(`/api/public/elections/${id}/passphrase`).pipe(
      pluck('data', 'passphrase'),
    );
  }
}
