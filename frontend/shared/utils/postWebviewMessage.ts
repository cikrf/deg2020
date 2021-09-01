// @ts-nocheck

export function postWebviewMessage(event: string, data: any = null): boolean {
  const json = {event, data};
  if (window.Android && window.Android.postWebviewMessage) {
    window.Android.postWebviewMessage(JSON.stringify(json));
    return true;
  } else if ((window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.postWebviewMessage)) {
    window.webkit.messageHandlers.postWebviewMessage.postMessage(json);
    return true;
  }
  return false;
}
