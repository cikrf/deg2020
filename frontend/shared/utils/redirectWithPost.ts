import { postWebviewMessage } from '@shared/utils/postWebviewMessage';

export function redirectWithPost(url: string, fieldName: string = 'json', data?: any): void {
  if (!postWebviewMessage('redirect', {url, fieldName, data})) {
    const form = document.createElement('form');
    // form.target = '_blank'; #todo изза всплывающих окон не работает, хром ругается
    form.style.display = 'none';
    const json = document.createElement('input');
    json.type = 'hidden';
    json.name = fieldName;
    json.value = data;
    form.method = 'post';
    form.action = url;
    form.appendChild(json);
    document.querySelector('body').appendChild(form);
    form.submit();
  }
}

