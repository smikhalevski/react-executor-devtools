import type { DevtoolsEvent } from './types';

const DEVTOOLS_SOURCE = 'react_executor_devtools';

export function publish<T extends DevtoolsEvent['type']>(
  type: T,
  payload: (DevtoolsEvent & { type: T })['payload']
): void {
  window.postMessage({ source: DEVTOOLS_SOURCE, type, payload }, '*');
}

export function subscribe(listener: (event: DevtoolsEvent) => void): void {
  window.addEventListener('message', event => {
    const message = event.data;

    if (message !== null && message !== undefined && message.source === DEVTOOLS_SOURCE) {
      listener(message);
    }
  });
}
