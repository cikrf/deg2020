export function getAllUrlParams(url: string = ''): any {

  let queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  const obj = {};
  if (queryString) {
    queryString = queryString.split('#')[0];
    const arr = queryString.split('&');
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i].split('=');
      let paramNum;
      let paramName = a[0].replace(/\[\d*\]/, (v: string) => {
        paramNum = v.slice(1, -1);
        return '';
      });
      let paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
      paramName = paramName.toLowerCase();
      paramValue = (paramValue as any).toLowerCase();
      if (obj[paramName]) {
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        if (typeof paramNum === 'undefined') {
          obj[paramName].push(paramValue);
        } else {
          obj[paramName][paramNum] = paramValue;
        }
      } else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}
