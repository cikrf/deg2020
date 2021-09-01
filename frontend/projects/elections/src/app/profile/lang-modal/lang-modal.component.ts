import { Component, EventEmitter, Input, Output } from '@angular/core';
import { pluck } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalService } from '@shared/modal-service/modal.service';

@Component({
  selector: 'app-lang-modal',
  templateUrl: './lang-modal.component.html',
  styleUrls: ['./lang-modal.component.scss'],
})
export class LangModalComponent {

  @Input() currentLang = 0;
  @Output() langChanged = new EventEmitter();
  langs$ = new BehaviorSubject([]);
  langForm: FormGroup;

  constructor(
    private modalService: ModalService,
    private http: HttpClient,
    private formBuilder: FormBuilder,
  ) {
    this.langForm = this.formBuilder.group({
      lang: this.currentLang,
    });
    this.http.get('/api/public/languages').pipe(
      pluck('data'),
    ).subscribe((items: any) => this.langs$.next(items));
  }

  close(): void {
    this.modalService.close();
  }

  changeLang(): void {
    const language = this.langs$.value.filter((lang: any) => {
      return lang.code.toString() === this.langForm.controls.lang.value;
    });
    if (!language.length) {
      this.close();
      return;
    }
    this.http.post('/api/public/settings', {
      language: language[0],
    }).subscribe(() => {
      this.langChanged.emit();
      this.close();
    });
  }

}
