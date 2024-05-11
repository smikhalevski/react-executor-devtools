import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import type { ContentMessage, PanelMessage } from '../types';
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
  if (sender.id === chrome.runtime.id && sender.tab?.id === chrome.devtools.inspectedWindow.tabId) {
    receiveMessage(message);
  }
});

window.addEventListener('beforeunload', () => {
  sendMessage({ type: 'devtools_panel_closed' });
});

function sendMessage(message: PanelMessage): void {
  (message as any).source = 'react_executor_devtools_panel';
  console.log('panel/sendMessage', message);

  if (chrome.runtime.id !== undefined) {
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
  }
}

function receiveMessage(message: ContentMessage): void {
  console.log('panel/receiveMessage', message);
  switch (message.type) {
    case 'adopt_existing_executors': {
      const ids = idsExecutor.get();

      for (const superficialInfo of message.payload) {
        if (idsExecutor.get().find(x => x.id === superficialInfo.id)) {
          continue;
        }
        ids.push({ origin: superficialInfo.origin, id: superficialInfo.id });
        getOrCreateSuperficialInfoExecutor(superficialInfo.id).resolve(superficialInfo);
      }

      idsExecutor.resolve(ids);
      break;
    }

    case 'executor_attached':
      if (idsExecutor.get().find(x => x.id === message.payload.id)) {
        break;
      }
      idsExecutor.resolve(idsExecutor.get().concat({ origin: message.payload.origin, id: message.payload.id }));
      getOrCreateSuperficialInfoExecutor(message.payload.id).resolve(message.payload);
      break;

    case 'executor_detached':
      const ids = idsExecutor.get();
      const index = ids.findIndex(x => x.id === message.payload.id);

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
    case 'task_changed':
    case 'plugins_changed':
    case 'annotations_changed':
      if (inspectedIdExecutor.value !== message.payload.id) {
        break;
      }
      const partForEventType = {
        key_changed: 'key',
        value_changed: 'value',
        reason_changed: 'reason',
        task_changed: 'task',
        plugins_changed: 'plugins',
        annotations_changed: 'annotations',
      } as const;

      getOrCreatePartInspectionExecutor(message.payload.id, partForEventType[message.type]).resolve(
        message.payload.inspection
      );
      break;

    case 'go_to_definition_source':
      chrome.devtools.inspectedWindow.eval(
        `
        if (__REACT_EXECUTOR_DEVTOOLS__.inspectedValue !== undefined) {
          inspect(__REACT_EXECUTOR_DEVTOOLS__.inspectedValue);
          __REACT_EXECUTOR_DEVTOOLS__.inspectedValue = undefined;
        }
      `,
        { frameURL: message.payload.url }
      );
      break;

    case 'devtools_content_opened':
      sendMessage({ type: 'devtools_panel_opened_for_origin', payload: { origin: message.payload.origin } });
      break;

    case 'devtools_content_closed': {
      const ids = idsExecutor.get().filter(x => x.origin !== message.payload.origin);

      if (
        inspectedIdExecutor.value !== null &&
        inspectedIdExecutor.value !== undefined &&
        ids.every(x => x.id !== inspectedIdExecutor.value)
      ) {
        inspectedIdExecutor.resolve(null);
      }

      idsExecutor.resolve(ids);
      break;
    }
  }
}

const contentClient: ContentClient = {
  startInspection(id) {
    inspectedIdExecutor.resolve(id);
    sendMessage({ type: 'inspection_started', payload: { id } });
  },
  goToDefinition(id, part, path) {
    sendMessage({ type: 'go_to_definition', payload: { id, part, path } });
  },
  retryExecutor(id) {
    sendMessage({ type: 'retry_executor', payload: { id } });
  },
  invalidateExecutor(id) {
    sendMessage({ type: 'invalidate_executor', payload: { id } });
  },
  abortExecutor(id) {
    sendMessage({ type: 'abort_executor', payload: { id } });
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
