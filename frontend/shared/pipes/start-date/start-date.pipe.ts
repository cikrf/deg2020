import { Pipe, PipeTransform } from '@angular/core';
import { parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';

@Pipe({
  name: 'startDate'
})
export class StartDatePipe implements PipeTransform {
  transform(date: any, formatting: string): any {
    if (date) {
      return format(parseISO(date), formatting, {locale: ru});
    }
  }
}
