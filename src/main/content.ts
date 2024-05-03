import { subscribe } from './content_messaging';
import type { DevtoolsExecutor } from './types';
import { updateExecutorCache } from './updateExecutorCache';

const executorsCache = new Map<number, DevtoolsExecutor>();

subscribe(event => {
  chrome.runtime.sendMessage(event);
  updateExecutorCache(executorsCache, event);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log(message);

  if (message === 'get_executors') {
    sendResponse(Array.from(executorsCache.values()));
  }
});
