import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import { MESSAGE_SOURCE_PANEL } from '../constants';
import type { ContentMessage, ExecutorPart, PanelMessage } from '../types';
import { log } from '../utils';
import { App } from './App';
import {
  executorManager,
  getDetailsExecutor,
  getPartInspectionExecutor,
  inspectorExecutor,
  listExecutor,
} from './executors';
import { type ContentClient, ContentClientProvider } from './useContentClient';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id && sender.tab?.id === chrome.devtools.inspectedWindow.tabId) {
    receiveMessage(message);
  }
});

window.addEventListener('beforeunload', () => {
  sendMessage({ type: 'panel_closed' });
});

function sendMessage(message: PanelMessage): void {
  if (chrome.runtime.id !== undefined) {
    (message as any).source = MESSAGE_SOURCE_PANEL;

    log('panel', message);
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
  }
}

function receiveMessage(message: ContentMessage): void {
  log('content_main', message);

  switch (message.type) {
    case 'content_opened':
      sendMessage({ type: 'panel_opened', originId: message.originId });
      break;

    case 'content_closed': {
      const inspector = inspectorExecutor.get();
      const list = listExecutor.get().filter(item => item.originId !== message.originId);

      if (inspector !== null && list.every(item => item.id !== inspector.id)) {
        // Inspected executor was detached
        inspectorExecutor.resolve(null);
      }

      listExecutor.resolve(list);
      break;
    }

    case 'executor_attached': {
      const list = listExecutor.get();

      if (list.some(item => item.id === message.id)) {
        // Executor already exists
        break;
      }

      list.push({ id: message.id, originId: message.details.originId });
      listExecutor.resolve(list);

      getDetailsExecutor(message.id).resolve(message.details);
      break;
    }

    case 'executor_detached': {
      const list = listExecutor.get();
      const index = list.findIndex(item => item.id === message.id);

      if (inspectorExecutor.value?.id === message.id) {
        inspectorExecutor.resolve(null);
      }
      if (index !== -1) {
        list.splice(index, 1);
        listExecutor.resolve(list);
      }
      break;
    }

    case 'executor_state_changed': {
      const detailsExecutor = getDetailsExecutor(message.id);
      const details = detailsExecutor.get();

      Object.assign(details.stats, message.stats);

      detailsExecutor.resolve(details);
      break;
    }

    case 'executor_patched': {
      if (inspectorExecutor.value?.id !== message.id) {
        break;
      }
      for (const part in message.patch) {
        const inspection = message.patch[part as ExecutorPart];

        if (inspection !== undefined) {
          getPartInspectionExecutor(message.id, part as ExecutorPart).resolve(inspection);
        }
      }
      break;
    }

    case 'open_sources_tab':
      chrome.devtools.inspectedWindow.eval(
        `
        if (__REACT_EXECUTOR_DEVTOOLS__.inspectedValue !== undefined) {
          inspect(__REACT_EXECUTOR_DEVTOOLS__.inspectedValue);
          __REACT_EXECUTOR_DEVTOOLS__.inspectedValue = undefined;
        }
      `,
        { frameURL: message.url }
      );
      break;
  }
}

const contentClient: ContentClient = {
  startInspection(id) {
    inspectorExecutor.resolve({ id });

    sendMessage({ type: 'start_inspection', id });
  },

  goToDefinition(id, part, path) {
    sendMessage({ type: 'go_to_part_definition', id, part, path });
  },

  retryExecutor(id) {
    sendMessage({ type: 'retry_executor', id });
  },

  invalidateExecutor(id) {
    sendMessage({ type: 'invalidate_executor', id });
  },

  abortExecutor(id) {
    sendMessage({ type: 'abort_executor', id });
  },

  inspectChildren(id, part, path) {
    sendMessage({ type: 'inspect_children', id, part, path });
  },
};

sendMessage({ type: 'panel_opened', originId: undefined });

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);
