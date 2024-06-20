import './app/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManagerProvider } from 'react-executor';
import { App } from './app/App';
import {
  executorManager,
  getDetailsExecutor,
  getPartInspectionExecutor,
  inspectorExecutor,
  listExecutor,
} from './app/executors';
import { ContentClient, ContentClientProvider } from './app/useContentClient';
import { ContentMessage, ExecutorPart, PanelMessage } from './types';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.documentId !== undefined && sender.tab?.id === chrome.devtools.inspectedWindow.tabId) {
    receiveContentMessage(message, sender.documentId);
  }
});

window.addEventListener('beforeunload', () => {
  sendMessage({ type: 'panel_closed' });
});

function sendMessage(message: PanelMessage): void {
  if (chrome.runtime.id !== undefined) {
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, message);
  }
}

function receiveContentMessage(message: ContentMessage, documentId: string): void {
  switch (message.type) {
    case 'content_opened':
      sendMessage({ type: 'panel_opened' });
      break;

    case 'content_closed': {
      const inspector = inspectorExecutor.value;
      const list = [];

      for (const item of listExecutor.get()) {
        if (item.documentId !== documentId) {
          list.push(item);
        } else {
          executorManager.detach(getDetailsExecutor(item.executorId).key);
        }
      }

      if (inspector !== undefined && list.every(item => item.executorId !== inspector.executorId)) {
        // Inspected executor was detached
        inspectorExecutor.clear();
      }

      listExecutor.resolve(list);
      break;
    }

    case 'executor_attached': {
      const list = listExecutor.get();

      if (list.some(item => item.executorId === message.executorId)) {
        // Executor already exists
        break;
      }

      list.push({
        executorId: message.executorId,
        documentId,
        searchableString: message.details.keyPreview.toLowerCase(),
      });

      listExecutor.resolve(list);

      getDetailsExecutor(message.executorId).resolve(message.details);
      break;
    }

    case 'executor_detached': {
      const list = listExecutor.get();
      const index = list.findIndex(item => item.executorId === message.executorId);

      if (inspectorExecutor.value?.executorId === message.executorId) {
        inspectorExecutor.clear();
      }
      if (index !== -1) {
        list.splice(index, 1);
        listExecutor.resolve(list);
        executorManager.detach(getDetailsExecutor(message.executorId).key);
      }
      break;
    }

    case 'executor_state_changed': {
      const detailsExecutor = getDetailsExecutor(message.executorId);
      const details = detailsExecutor.get();

      Object.assign(details.stats, message.stats);

      detailsExecutor.resolve(details);
      break;
    }

    case 'executor_patched': {
      if (inspectorExecutor.value?.executorId !== message.executorId) {
        break;
      }
      for (const part in message.patch) {
        const inspection = message.patch[part as ExecutorPart];

        if (inspection !== undefined) {
          getPartInspectionExecutor(message.executorId, part as ExecutorPart).resolve(inspection);
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
  startInspection(executorId) {
    inspectorExecutor.resolve({ executorId });

    sendMessage({ type: 'start_inspection', executorId });
  },

  goToDefinition(executorId, part, path) {
    sendMessage({ type: 'go_to_part_definition', executorId, part, path });
  },

  retryExecutor(executorId) {
    sendMessage({ type: 'retry_executor', executorId });
  },

  invalidateExecutor(executorId) {
    sendMessage({ type: 'invalidate_executor', executorId });
  },

  abortExecutor(executorId) {
    sendMessage({ type: 'abort_executor', executorId });
  },

  inspectChildren(executorId, part, path) {
    sendMessage({ type: 'inspect_children', executorId, part, path });
  },
};

sendMessage({ type: 'panel_opened' });

ReactDOM.createRoot(document.getElementById('container')!).render(
  <ExecutorManagerProvider value={executorManager}>
    <ContentClientProvider value={contentClient}>
      <App />
    </ContentClientProvider>
  </ExecutorManagerProvider>
);
