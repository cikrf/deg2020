export function yandexMetrika(num: number): void {
  if (!num) {
    return;
  }
  const script = document.createElement('script');
  script.textContent = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${num}, "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
        });`;
  script.type = 'text/javascript';
  script.async = false;
  script.charset = 'utf-8';

  const noscript = document.createElement('noscript');
  noscript.textContent = `<div><img src="https://mc.yandex.ru/watch/${num}" style="position:absolute; left:-9999px;" alt="" /></div>`;
  document.head.appendChild(script);
  document.head.appendChild(noscript);
}
