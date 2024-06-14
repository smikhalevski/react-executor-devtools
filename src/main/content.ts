import { MESSAGE_SOURCE_CONTENT, MESSAGE_SOURCE_PANEL } from './constants';
import type { ContentMessage } from './types';
import { noop } from './utils';

window.addEventListener('message', handleMessage);

// https://developer.chrome.com/docs/web-platform/deprecating-unload
// https://developer.chrome.com/docs/web-platform/page-lifecycle-api#overview_of_page_lifecycle_states_and_events
window.addEventListener('pagehide', handleUnload);

chrome.runtime.onMessage.addListener(message => {
  message.source = MESSAGE_SOURCE_PANEL;
  window.postMessage(message, window.location.origin);
});

function handleMessage(event: MessageEvent<ContentMessage>): void {
  if (chrome.runtime.id !== undefined && event.data?.source === MESSAGE_SOURCE_CONTENT) {
    sendContentMessage(event.data);
  }
}

function handleUnload(): void {
  sendContentMessage({ type: 'content_closed' });
  window.removeEventListener('message', handleMessage);
}

function sendContentMessage(message: ContentMessage): void {
  chrome.runtime.sendMessage(message).catch(noop);
}
