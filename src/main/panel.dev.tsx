import './app/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import { getValuePreview, inspect } from './inspect';
import { INSPECTED_VALUE } from './types';
import { getInspectionChild, nextUID } from './utils';
import { App } from './app/App';
import {
  executorManager,
  getDetailsExecutor,
  getPartInspectionExecutor,
  inspectorExecutor,
  listExecutor,
} from './app/executors';
import { type ContentClient, ContentClientProvider } from './app/useContentClient';

const userMock = {
  login: 'octocat',
  avatar_url: 'https://github.com/images/error/octocat_happy.gif',
  type: 'User',
  public_repos: 2,
  followers: 20,
  created_at: '2008-01-14T04:33:35Z',
  plan: {
    name: 'Medium',
    space: 400,
    private_repos: 20,
    collaborators: 0,
  },
};

interface ExecutorMock {
  key?: unknown;
  value?: unknown;
  reason?: unknown;
  settledAt?: number;
  invalidatedAt?: number;
  isFulfilled?: boolean;
  isPending?: boolean;
  isActive?: boolean;
  annotations?: unknown;
  plugins?: unknown;
}

const executorMocks: { [executorId: string]: ExecutorMock } = {
  [nextUID()]: {
    key: ['user', 1],
    value: userMock,
    settledAt: Date.now(),
    isFulfilled: true,
    isActive: true,
  },
  [nextUID()]: {
    key: ['user', 2],
    value: userMock,
    settledAt: Date.now(),
    invalidatedAt: Date.now(),
    isFulfilled: true,
    isActive: true,
  },
  [nextUID()]: {
    key: ['user', 3],
    value: userMock,
    settledAt: Date.now(),
    isFulfilled: true,
    isPending: true,
  },
  [nextUID()]: {
    key: ['user', 4],
    value: userMock,
    settledAt: Date.now(),
    invalidatedAt: Date.now(),
    isFulfilled: false,
    isPending: true,
    isActive: true,
  },
  [nextUID()]: {
    key: 'account',
    reason: new DOMException('Aborted', 'AbortError'),
    settledAt: Date.now(),
    isFulfilled: false,
  },
  [nextUID()]: {
    key: 'shoppingCart',
    reason: new DOMException('Aborted', 'AbortError'),
  },
  [nextUID()]: {
    key: 'order',
    reason: new DOMException('Aborted', 'AbortError'),
    isPending: true,
  },
};

const DOCUMENT_ID = nextUID();

for (const [executorId, executor] of Object.entries(executorMocks)) {
  getDetailsExecutor(executorId).resolve({
    keyPreview: getValuePreview(executor.key),
    stats: {
      settledAt: executor.settledAt || 0,
      invalidatedAt: executor.invalidatedAt || 0,
      isFulfilled: executor.isFulfilled || false,
      isPending: executor.isPending || false,
      isActive: executor.isActive || false,
      hasTask: false,
    },
  });
}

listExecutor.resolve(Object.keys(executorMocks).map(executorId => ({ executorId, documentId: DOCUMENT_ID })));

const contentClient: ContentClient = {
  startInspection(executorId) {
    inspectorExecutor.resolve({ executorId: executorId });

    getPartInspectionExecutor(executorId, 'key').resolve(inspect(executorMocks[executorId].key, 0));
    getPartInspectionExecutor(executorId, 'value').resolve(inspect(executorMocks[executorId].value, 0));
    getPartInspectionExecutor(executorId, 'reason').resolve(inspect(executorMocks[executorId].reason, 0));
    getPartInspectionExecutor(executorId, 'task').resolve(inspect(undefined, 0));
    getPartInspectionExecutor(executorId, 'plugins').resolve(inspect(executorMocks[executorId].plugins, 0));
    getPartInspectionExecutor(executorId, 'annotations').resolve(inspect(executorMocks[executorId].annotations, 0));
  },

  goToDefinition(executorId, path, part) {},

  retryExecutor(executorId) {},

  invalidateExecutor(executorId) {},

  abortExecutor(executorId) {},

  inspectChildren(executorId, part, path) {
    const inspectionExecutor = getPartInspectionExecutor(executorId, part);
    const inspection = inspectionExecutor.get();

    if (inspection === null) {
      return;
    }

    const child = getInspectionChild(inspection, path);

    if (child !== undefined) {
      child.children = inspect(child[INSPECTED_VALUE]).children;
    }
    inspectionExecutor.resolve(inspection);
  },
};

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);
