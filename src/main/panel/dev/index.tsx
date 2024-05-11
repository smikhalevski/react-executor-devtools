import '../index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import { describeValue, inspect } from '../../inspect';
import { INSPECTED_VALUE } from '../../types';
import { uuid } from '../../uuid';
import { App } from '../App';
import {
  executorManager,
  getOrCreatePartInspectionExecutor,
  getOrCreateSuperficialInfoExecutor,
  idsExecutor,
  inspectedIdExecutor,
} from '../executors';
import { userMock } from './mocks';
import { type ContentClient, ContentClientProvider } from '../useContentClient';

interface ExecutorMock {
  key?: unknown;
  value?: unknown;
  reason?: unknown;
  plugins?: unknown;
  annotations?: unknown;
  settledAt?: number;
  invalidatedAt?: number;
  isFulfilled?: boolean;
  isPending?: boolean;
  isActive?: boolean;
}

const executorMocks: { [id: string]: ExecutorMock } = {
  [uuid()]: {
    key: ['user', 1],
    value: userMock,
    isFulfilled: true,
    isActive: true,
    settledAt: Date.now(),
  },
  [uuid()]: {
    key: ['user', 1],
    value: userMock,
    isFulfilled: true,
    isActive: true,
    invalidatedAt: Date.now(),
    settledAt: Date.now(),
  },
  [uuid()]: {
    key: ['user', 1],
    value: userMock,
    isFulfilled: true,
    settledAt: Date.now(),
    isPending: true,
  },
  [uuid()]: {
    key: ['user', 2],
    value: userMock,
    isFulfilled: false,
    isActive: true,
    settledAt: Date.now(),
    invalidatedAt: Date.now(),
    isPending: true,
  },
  [uuid()]: {
    key: 'account',
    reason: new DOMException('Aborted', 'AbortError'),
    isFulfilled: false,
    settledAt: Date.now(),
  },
  [uuid()]: {
    key: 'account',
    reason: new DOMException('Aborted', 'AbortError'),
  },
  [uuid()]: {
    key: 'account',
    reason: new DOMException('Aborted', 'AbortError'),
    isPending: true,
  },
};

for (const [id, executor] of Object.entries(executorMocks)) {
  getOrCreateSuperficialInfoExecutor(id, {
    id,
    keyDescription: describeValue(executor.key),
    origin: window.location.origin,
    stats: {
      settledAt: executor.settledAt || 0,
      invalidatedAt: executor.invalidatedAt || 0,
      isFulfilled: executor.isFulfilled || false,
      isPending: executor.isPending || false,
      isActive: executor.isActive || false,
    },
  });
}

idsExecutor.resolve(Object.keys(executorMocks));

const contentClient: ContentClient = {
  startInspection(id) {
    inspectedIdExecutor.resolve(id);

    getOrCreatePartInspectionExecutor(id, 'key').resolve(inspect(executorMocks[id].key));
    getOrCreatePartInspectionExecutor(id, 'value').resolve(inspect(executorMocks[id].value));
    getOrCreatePartInspectionExecutor(id, 'reason').resolve(inspect(executorMocks[id].reason));
    getOrCreatePartInspectionExecutor(id, 'plugins').resolve(inspect(executorMocks[id].plugins));
    getOrCreatePartInspectionExecutor(id, 'annotations').resolve(inspect(executorMocks[id].annotations));
  },

  goToDefinition(definition) {},

  retryExecutor(id) {},

  invalidateExecutor(id) {},

  expandInspection(id, part, path) {
    const inspectionExecutor = getOrCreatePartInspectionExecutor(id, part);

    let inspection = inspectionExecutor.get();
    if (inspection === null) {
      return;
    }
    for (const index of path) {
      inspection = inspection.children![index];
    }

    inspection.children = inspect(inspection[INSPECTED_VALUE]).children;

    inspectionExecutor.resolve(inspectionExecutor.get());
  },
};

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);
