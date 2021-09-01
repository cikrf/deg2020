import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, filter, first, flatMap, map, mergeMap, switchMap, tap, } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

@Injectable()
export class AuthService {
  // tslint:disable-next-line:variable-name
  token = localStorage.getItem('token');
  user$ = new BehaviorSubject<User>(null);

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
  }

  getUserInfo(): Observable<User> {
    if (!this.token) {
      return of(null);
    }

    return this.http.get('/api/auth/realms/deg-arm/protocol/openid-connect/userinfo').pipe(
      // tap(console.log),
      map((me: any) => {
        return {
          // ...this.token,
          ...me,
        };
      }),
      tap(data => {
        Object.assign(data, this.getDecodedAccessToken(this.token));
        this.user$.next(data);
        console.log(data);
      })
    );
    // .subscribe((data: string) => {
    //   if (data) {
    //     localStorage.setItem('token', data);
    //   } else {
    //     localStorage.removeItem('token');
    //   }
    // });
  }

  login(
    username: string,
    password: string,
  ): Observable<any> {
    // const body = new URLSearchParams();
    // body.set('client_id', 'deg-client');
    // body.set('grant_type', 'password');
    // body.set('scope', 'openid');
    // body.set('username', username);
    // body.set('password', password);
    const body = `client_id=deg-client&grant_type=password&scope=openid&username=${username}&password=${password}`;
    const headers = new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded'});
    return this.http.post<any>('/api/auth/realms/deg-arm/protocol/openid-connect/token',
      body,
      {headers}
    ).pipe(
      // pluck('data', 'token'),
      tap((data: any) => {
        console.log(data);
        this.token = data.access_token;
        localStorage.setItem('token', this.token);
      }),
      switchMap((data) => this.getUserInfo()),
      // TODO раскоментить
      mergeMap(() => this.user$.pipe(
        filter((u: any) => !!u),
        first(),
        flatMap(() => this.redirectIfNeed()),
        catchError((err: any) => {
          console.error('auth err', err);
          return throwError(err);
        }),
        )
      ),
      catchError((err: any) => {
        console.error('auth err', err);
        return throwError(err);
      }),
    );
  }

  private redirectIfNeed(): any {
    const url = this.activatedRoute.snapshot.queryParamMap.get('redirectUrl');
    if (url) {
      // Получаем путь
      const redirectUrl = url.split('?')[0];

      if (!url.split('?')[1]) {
        return this.router.navigate([redirectUrl]);
      }

      const params = {};
      // Получаем строку с параметрами
      url
        .split('?')[1]
        // Преобразуем строку в массив из строк с параметрами
        .split('&')
        // Берем ключи и значения и заполняем пустой объект
        .map((elem) => {
          params[elem.split('=')[0]] = elem.split('=')[1];
        });
      return this.router.navigate([redirectUrl], {queryParams: params});
    } else {
      return this.router.navigate(['']);
    }
  }

  logout(currentUrl?: string): Promise<boolean> {
    this.token = null;
    this.user$.next(null);
    localStorage.removeItem('token');

    // Урл на котором находимся сейчас
    if (!currentUrl) {
      currentUrl = this.router.url;
    }

    // Если мы уже находимся на странице логина, никуда не редиректим
    if (currentUrl.slice(0, 6) === '/login') {
      return;
    }

    // Если мы не в руте, сохраняем редирект на текущую страницу.
    if (currentUrl && currentUrl !== '/') {
      return this.router.navigate(['/', 'login'], {queryParams: {redirectUrl: currentUrl}});
    } else {
      // Если мы в руте, сохраняем редирект на рут.
      return this.router.navigate(['/', 'login']);
    }
  }

  /**
   * Загрузка списков избирателей
   */
  public canElectionsVotersUpload(): boolean {
    return this.hasPermission('ELECTIONS_VOTERS_UPLOAD');
  }

  /**
   * Загрузка ключей шифрования и расшифрования
   */
  public canElectionsKeysUpload(): boolean {
    return this.hasPermission('ELECTIONS_KEYS_UPLOAD');
  }

  /**
   * Подготовка АРМ к проведению голосования
   */
  public canElectionsPrepare(): boolean {
    return this.hasPermission('ELECTIONS_PREPARE');
  }

  /**
   * Получение данных об итогах голосования
   */
  public canElectionsResultView(): boolean {
    return this.hasPermission('ELECTIONS_RESULT_VIEW');
  }

  /**
   * Расшифрование бюллетеней и подсчет итогов голосования
   */
  public canElectionsResultCalculate(): boolean {
    return this.hasPermission('ELECTIONS_RESULT_CALCULATE');
  }

  /**
   * Формирование и выгрузка списка участников ДЭГ
   */
  public canVotersDownload(): boolean {
    return this.hasPermission('VOTERS_DOWNLOAD');
  }

  /**
   * Исключение избирателя из списка
   */
  public canVotersDelete(): boolean {
    return this.hasPermission('VOTERS_DELETE');
  }

  /**
   * Запуск и остановка голосования
   */
  public canElectionsStartStop(): boolean {
    return this.hasPermission('ELECTIONS_START_STOP');
  }

  /**
   * Изменение бюллетеня
   */
  public canBallotsChange(): boolean {
    return this.hasPermission('BALLOTS_CHANGE');
  }

  /**
   * Просмотр списка избирателей
   */
  public canShowVoters(): boolean {
    return this.hasPermission('VOTERS_VIEW');
  }

  /**
   * Просмотр голосований
   */
  public canShowElections(): boolean {
    return this.hasPermission('ELECTIONS_VIEW');
  }

  public hasPermissions(permissions: string[]): boolean {
    // return true;
    return this.user$.value?.realm_access.roles.some(r => permissions.some(p => p === r));
  }

  public hasPermission(permission: string): boolean {
    // return true;
    return this.user$.value?.realm_access.roles.some(r => r === permission);
  }

  private getDecodedAccessToken(token: string): any {
    try {
      return jwt_decode(token);
    } catch (error) {
      return null;
    }
  }

  accessDenied(): Promise<boolean> {
    return this.router.navigate(['/access-denied']);
  }
}

interface User {
  acr: string;
  'allowed-origins': string[];
  aud: string;
  azp: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  preferred_username: string;
  realm_access: {
    roles: string[];
  };
  resource_access: { [key: string]: { roles: string[] } };
  scope: string;
  session_state: string;
  sub: string;
  typ: string;
}
