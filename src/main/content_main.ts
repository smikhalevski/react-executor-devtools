import type { Executor, ExecutorPlugin } from 'react-executor';
import { publish } from './content_messaging';

declare global {
  interface Window {
    __REACT_EXECUTOR_DEVTOOLS__?: Devtools;
  }
}

interface Devtools {
  plugin: ExecutorPlugin;
}

let executorCount = 0;

const executors = new Map<number, Executor>();

const plugin: ExecutorPlugin = executor => {
  const executorIndex = executorCount++;

  executors.set(executorIndex, executor);

  let executorVersion = -1;

  publish('executor_created', {
    executorIndex,
    executorKey: executor.key,
  });

  executor.subscribe(event => {
    publish('event_intercepted', {
      executorIndex,
      event: {
        type: event.type,
        payload: event.payload,
      },
    });

    if (executorVersion >= event.version) {
      return;
    }

    publish('executor_state_changed', {
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
