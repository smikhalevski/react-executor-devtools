import type { Executor, ExecutorPlugin } from 'react-executor';
import { createClientRPC } from './rpc';
import type { DevtoolsEvent } from './types';

declare global {
  interface Window {
    __REACT_EXECUTOR_DEVTOOLS__?: Devtools;
  }
}

interface Devtools {
  plugin: ExecutorPlugin;
}

const rpc = createClientRPC();

let executorCount = 0;

const executors = new Map<number, Executor>();

rpc.addRequestHandler<DevtoolsEvent, DevtoolsEvent>((request, sendResponse) => {
  if (request.type === 'get_executors') {
    sendResponse({
      type: 'get_executors_response',
      executors: Array.from(executors).map(([executorIndex, executor]) => ({
        key: executor.key,
        index: executorIndex,
        events: [],
        state: {
          isFulfilled: executor.isFulfilled,
          isRejected: executor.isRejected,
          isInvalidated: executor.isInvalidated,
          value: executor.value,
          reason: executor.reason,
          timestamp: executor.timestamp,
        },
      })),
    });
  }
});

const plugin: ExecutorPlugin = executor => {
  const executorIndex = executorCount++;

  executors.set(executorIndex, executor);

  let executorVersion = -1;

  rpc.sendVoidRequest<DevtoolsEvent>({
    type: 'executor_created',
    executorIndex,
    executorKey: executor.key,
  });

  executor.subscribe(event => {
    rpc.sendVoidRequest<DevtoolsEvent>({
      type: 'event_intercepted',
      executorIndex,
      event: {
        type: event.type,
        payload: event.payload,
      },
    });

    if (executorVersion >= event.version) {
      return;
    }

    rpc.sendVoidRequest<DevtoolsEvent>({
      type: 'executor_state_changed',
      executorIndex,
      executorState: {
        isFulfilled: executor.isFulfilled,
        isRejected: executor.isRejected,
        isInvalidated: executor.isInvalidated,
        value: executor.value,
        reason: executor.reason,
        timestamp: executor.timestamp,
      },
    });
  });
};

window.__REACT_EXECUTOR_DEVTOOLS__ = { plugin };
