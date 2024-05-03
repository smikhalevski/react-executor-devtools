import React, { useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import type { DevtoolsExecutor } from './types';
import { updateExecutorCache } from './updateExecutorCache';

const executorCache = new Map<number, DevtoolsExecutor>();

const root = ReactDOM.createRoot(document.body.appendChild(document.createElement('div')));

root.render(<App />);

function App() {
  const [, rerender] = useReducer(reduceCount, 0);

  useEffect(() => {
    chrome.tabs
      .sendMessage(chrome.devtools.inspectedWindow.tabId, 'get_executors')
      .then((executors: DevtoolsExecutor[]) => {
        for (const executor of executors) {
          executorCache.set(executor.index, executor);
        }
        rerender();

        chrome.runtime.onMessage.addListener(message => {
          updateExecutorCache(executorCache, message);
          rerender();
        });
      });
  }, []);

  return (
    <pre>
      {'TEST'}
      {JSON.stringify(Array.from(executorCache.values()), null, 2)}
    </pre>
  );
}

function reduceCount(count: number) {
  return count + 1;
}
