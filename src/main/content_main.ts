import type { Executor, ExecutorPlugin } from 'react-executor';
import type { PanelServer } from './panel';
import { createWindowRPCClient, createWindowRPCServer } from './rpc';
import type { ExecutorSnapshot } from './types';

const server = createWindowRPCServer('react_executor_devtools_content', {
  getExecutors(): ExecutorSnapshot[] {
    return Array.from(executors).map(([executorIndex, executor]) => ({
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
    }));
  },
});

export type ContentServer = typeof server;

const panelClient = createWindowRPCClient<PanelServer>('react_executor_devtools_panel');

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

  panelClient.createExecutor.put(executorIndex, executor.key);

  executor.subscribe(event => {
    panelClient.addEvent.put(executorIndex, {
      type: event.type,
      payload: event.payload,
    });

    if (executorVersion >= event.version) {
      return;
    }

    panelClient.updateState.put(executorIndex, {
      isFulfilled: executor.isFulfilled,
      isRejected: executor.isRejected,
      isInvalidated: executor.isInvalidated,
      value: executor.value,
      reason: executor.reason,
      timestamp: executor.timestamp,
    });
  });
};

window.__REACT_EXECUTOR_DEVTOOLS__ = { plugin };
