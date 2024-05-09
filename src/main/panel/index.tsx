import './panel.module.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import { describeValue } from '../content/inspect';
import type { SuperficialInfo } from '../content/types';
import { uuid } from '../content/uuid';
import { App } from './App';
import { executorManager, getOrCreateSuperficialInfoExecutor, idsExecutor, inspectedIdExecutor } from './executors';
import { type ContentClient, ContentClientProvider } from './useContentClient';

const superficialInfoMocks: SuperficialInfo[] = [
  {
    id: uuid(),
    keyDescription: describeValue(['user', 1]),
    origin: window.location.origin,
    stats: {
      settledAt: 0,
      invalidatedAt: 0,
      isFulfilled: false,
      isPending: false,
      isActive: false,
    },
  },
  {
    id: uuid(),
    keyDescription: describeValue(['user', 2]),
    origin: window.location.origin,
    stats: {
      settledAt: 0,
      invalidatedAt: 0,
      isFulfilled: false,
      isPending: false,
      isActive: false,
    },
  },
];

const ids = [];
for (const superficialInfo of superficialInfoMocks) {
  ids.push(superficialInfo.id);
  getOrCreateSuperficialInfoExecutor(superficialInfo.id, superficialInfo);
}

idsExecutor.resolve(ids);

const contentClient: ContentClient = {
  startInspection(id) {
    inspectedIdExecutor.resolve(id);
  },
  retryExecutor(id) {},
  invalidateExecutor(id) {},
  expandInspection(id, part, path) {},
};

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);
