import { MESSAGE_SOURCE_CONTENT, MESSAGE_SOURCE_PANEL } from './constants';

window.addEventListener('message', event => {
  if (chrome.runtime.id !== undefined && event.data?.source === MESSAGE_SOURCE_CONTENT) {
    chrome.runtime.sendMessage(event.data).catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id && message.source === MESSAGE_SOURCE_PANEL) {
    window.postMessage(message, '*');
  }
});
