import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManager, useExecutorSubscription } from 'react-executor';
import type { ContentServer } from './content_main';
import { createChromeRPCClient, createChromeRPCServer } from './rpc';
import type { ExecutorEventSnapshot, ExecutorSnapshot, ExecutorSnapshotState } from './types';

const executorManager = new ExecutorManager();

const snapshotsExecutor = executorManager.getOrCreate<Map<number, ExecutorSnapshot>>('snapshots', new Map());

const server = createChromeRPCServer('react_executor_devtools_panel', {
  createExecutor(executorIndex: number, executorKey: unknown) {
    snapshotsExecutor.resolve(
      snapshotsExecutor.get().set(executorIndex, {
        key: executorKey,
        index: executorIndex,
        state: {
          isFulfilled: false,
          isRejected: false,
          isInvalidated: false,
          value: undefined,
          reason: undefined,
          timestamp: 0,
        },
        events: [],
      })
    );
  },

  addEvent(executorIndex: number, eventSnapshot: ExecutorEventSnapshot) {
    const snapshots = snapshotsExecutor.get();
    snapshots.get(executorIndex)!.events.push(eventSnapshot);
    snapshotsExecutor.resolve(snapshots);
  },

  updateState(executorIndex: number, state: ExecutorSnapshotState) {
    const snapshots = snapshotsExecutor.get();
    snapshots.get(executorIndex)!.state = state;
    snapshotsExecutor.resolve(snapshots);
  },
});

export type PanelServer = typeof server;

const contentClient = createChromeRPCClient<ContentServer>('react_executor_devtools_content');

contentClient.getExecutors.get().then(snapshots => {
  snapshotsExecutor.resolve(new Map(snapshots.map(snapshot => [snapshot.index, snapshot])));
});

const root = ReactDOM.createRoot(document.body.appendChild(document.createElement('div')));

root.render(<App />);

function App() {
  useExecutorSubscription(snapshotsExecutor);

  return <pre>{JSON.stringify(Array.from(snapshotsExecutor.get().values()), null, 2)}</pre>;
}
