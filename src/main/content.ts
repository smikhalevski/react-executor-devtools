import { noop } from './utils';

window.addEventListener('message', event => {
  if (chrome.runtime.id !== undefined && event.data?.source === 'react_executor_devtools_content') {
    chrome.runtime.sendMessage(event.data).catch(noop);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id && message.source === 'react_executor_devtools_panel') {
    window.postMessage(message, '*');
  }
});
