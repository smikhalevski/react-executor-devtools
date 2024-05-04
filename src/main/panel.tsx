import React, { useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import { createServerRPC } from './rpc';
import type { DevtoolsEvent, DevtoolsExecutor, GetExecutorsResponseEvent } from './types';

const rpc = createServerRPC();

const executorCache = new Map<number, DevtoolsExecutor>();

const root = ReactDOM.createRoot(document.body.appendChild(document.createElement('div')));

root.render(<App />);

function App() {
  const [, rerender] = useReducer(reduceCount, 0);

  useEffect(() => {
    rpc.sendRequest<DevtoolsEvent, GetExecutorsResponseEvent>({ type: 'get_executors' }).then(response => {
      for (const executor of response.executors) {
        executorCache.set(executor.index, executor);
      }
      rerender();

      rpc.addRequestHandler<DevtoolsEvent, DevtoolsEvent>(request => {
        updateExecutorCache(executorCache, request);
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

function updateExecutorCache(executorsCache: Map<number, DevtoolsExecutor>, event: DevtoolsEvent): void {
  switch (event.type) {
    case 'executor_created':
      executorsCache.set(event.executorIndex, {
        key: event.executorKey,
        index: event.executorIndex,
        state: {
          isFulfilled: true,
          isRejected: true,
          isInvalidated: true,
          value: undefined,
          reason: undefined,
          timestamp: -1,
        },
        events: [],
      });
      break;

    case 'event_intercepted':
      executorsCache.get(event.executorIndex)!.events.push(event.event);
      break;

    case 'executor_state_changed':
      executorsCache.get(event.executorIndex)!.state = event.executorState;
      break;
  }
}
