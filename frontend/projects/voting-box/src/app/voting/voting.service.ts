import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';
import { ApiResponseElectionDto, ElectionDto } from '@shared/models/portal.models';

@Injectable()
export class VotingService {

  constructor(
    private http: HttpClient,
  ) {
  }

  vote(transaction: any): Observable<any> {
    return this.http.post('/api/public/vote', transaction);
  }

  canVote(electionId: string, senderPublicKey: string): Observable<{ data: boolean, error: { code: number, description: string } }> {
    return this.http.get<{ data: boolean, error: { code: number, description: string } }>('/api/public/vote/can-vote', {
      params: {
        electionId,
        senderPublicKey,
      },
    });
  }

  getElection(id: string, lang: string = '0'): Observable<ElectionDto> {
    return this.http.get<ApiResponseElectionDto>('/api/public/elections/' + id + '/model', {
      params: {
        languageCode: lang
      }
    }).pipe(
      pluck('data'),
    );
  }
}
