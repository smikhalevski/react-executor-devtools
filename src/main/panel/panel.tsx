import './panel.module.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import type { ContentMessage, PanelMessage } from '../content/types';
import { App } from './App';
import {
  executorManager,
  getOrCreatePartInspectionExecutor,
  getOrCreateSuperficialInfoExecutor,
  idsExecutor,
  inspectedIdExecutor,
} from './executors';
import { type ContentClient, ContentClientProvider } from './useContentClient';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id) {
    receiveMessage(message);
  }
});

window.addEventListener('beforeunload', () => {
  sendMessage({ type: 'devtools_panel_closed' });
});

function sendMessage(message: PanelMessage): void {
  chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
}

function receiveMessage(message: ContentMessage): void {
  switch (message.type) {
    case 'hello':
      for (const superficialInfo of message.payload) {
        getOrCreateSuperficialInfoExecutor(superficialInfo.id, superficialInfo);
      }
      break;

    case 'executor_attached':
      if (idsExecutor.get().includes(message.payload.id)) {
        break;
      }
      idsExecutor.resolve(idsExecutor.get().concat(message.payload.id));
      getOrCreateSuperficialInfoExecutor(message.payload.id, message.payload);
      break;

    case 'executor_detached':
      const ids = idsExecutor.get();
      const index = ids.indexOf(message.payload.id);

      if (inspectedIdExecutor.value === message.payload.id) {
        inspectedIdExecutor.resolve(null);
      }
      if (index !== -1) {
        ids.splice(index, 1);
        idsExecutor.resolve(ids);
      }
      break;

    case 'stats_changed':
      const superficialInfoExecutor = getOrCreateSuperficialInfoExecutor(message.payload.id);
      Object.assign(superficialInfoExecutor.value!.stats, message.payload.stats);
      superficialInfoExecutor.resolve(superficialInfoExecutor.value!);
      break;

    case 'key_changed':
    case 'value_changed':
    case 'reason_changed':
    case 'plugins_changed':
    case 'annotations_changed':
      if (inspectedIdExecutor.value !== message.payload.id) {
        break;
      }
      const part = {
        key_changed: 'key',
        value_changed: 'value',
        reason_changed: 'reason',
        plugins_changed: 'plugins',
        annotations_changed: 'annotations',
      } as const;

      getOrCreatePartInspectionExecutor(message.payload.id, part[message.type]).resolve(message.payload.inspection);
      break;
  }
}

const contentClient: ContentClient = {
  startInspection(id) {
    inspectedIdExecutor.resolve(id);
    sendMessage({ type: 'inspection_started', payload: { id } });
  },
  retryExecutor(id) {
    sendMessage({ type: 'retry_executor', payload: { id } });
  },
  invalidateExecutor(id) {
    sendMessage({ type: 'invalidate_executor', payload: { id } });
  },
  expandInspection(id, part, path) {
    sendMessage({ type: 'inspection_expanded', payload: { id, part, path } });
  },
};

sendMessage({ type: 'devtools_panel_opened' });

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);