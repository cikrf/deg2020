import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'authImage'
})
export class AuthImagePipe implements PipeTransform {

  constructor(
    private http: HttpClient,
    private domSanitizer: DomSanitizer
  ) {
  }

  async transform(src: string): Promise<string> {
    try {
      const imageBlob = await this.http.get(src, { responseType: 'blob'}).toPromise();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = (event: ProgressEvent): any => {
          resolve(this.domSanitizer.bypassSecurityTrustUrl(String(reader.result)) as string);
        };
        reader.readAsDataURL(imageBlob);
      });
    } catch {
      return 'assets/fallback.png';
    }
  }
}
