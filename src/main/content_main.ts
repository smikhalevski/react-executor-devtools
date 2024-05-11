import type { Executor, ExecutorPlugin } from 'react-executor';
import { inspect, InspectOptions } from './inspect';
import {
  ContentMessage,
  ExecutorPart,
  ExecutorPatch,
  ExecutorPlugins,
  INSPECTED_VALUE,
  Inspection,
  PanelMessage,
} from './types';
import {
  getExecutorDetails,
  getExecutorPartInspections,
  getExecutorStats,
  getInspectionChild,
  log,
  nextUID,
} from './utils';

interface ContentState {
  readonly originId: string;
  readonly executors: Map<string, { executor: Executor; plugins: ExecutorPlugins }>;
  isConnected: boolean;
  inspectedId: string | null;
  inspections: Record<ExecutorPart, Inspection> | null;
}

const contentState: ContentState = {
  originId: nextUID(),
  executors: new Map(),
  isConnected: false,
  inspectedId: null,
  inspections: null,
};

const inspectOptions: InspectOptions = {
  preprocessor(inspection) {
    const value = inspection[INSPECTED_VALUE];

    if (typeof value === 'function') {
      inspection.location = { type: 'sourceCode' };
      return;
    }

    if (value === null || typeof value !== 'object') {
      return;
    }

    // Lookup a matching executor
    for (const entry of contentState.executors) {
      if (entry[1].executor === value) {
        inspection.location = { type: 'executor', id: entry[0] };
        break;
      }
    }
  },
};

window.addEventListener('message', event => {
  if (event.data?.source === 'react_executor_devtools_panel') {
    receiveMessage(event.data);
  }
});

window.addEventListener('beforeunload', () => {
  if (contentState.isConnected) {
    sendMessage({ type: 'content_closed', originId: contentState.originId });
  }
});

function sendMessage(message: ContentMessage): void {
  (message as any).source = 'react_executor_devtools_content';

  log('content_main', message);
  window.postMessage(message, '*');
}

function receiveMessage(message: PanelMessage): void {
  log('panel', message);

  switch (message.type) {
    case 'panel_opened':
      contentState.isConnected = true;

      for (const entry of contentState.executors) {
        const details = getExecutorDetails(contentState.originId, entry[1].executor);

        sendMessage({ type: 'executor_attached', id: entry[0], details });
      }
      break;

    case 'panel_closed':
      contentState.isConnected = false;
      contentState.inspectedId = contentState.inspections = null;
      break;

    case 'start_inspection': {
      const entry = contentState.executors.get(message.id);

      if (entry !== undefined) {
        contentState.inspectedId = message.id;
        contentState.inspections = getExecutorPartInspections(entry.executor, entry.plugins, inspectOptions);

        sendMessage({ type: 'executor_patched', id: message.id, patch: contentState.inspections });
      }
      break;
    }

    case 'go_to_part_definition': {
      if (contentState.inspectedId !== message.id || contentState.inspections === null) {
        break;
      }

      const child = getInspectionChild(contentState.inspections[message.part], message.path, inspectOptions);

      if (child !== undefined) {
        window.__REACT_EXECUTOR_DEVTOOLS__.inspectedValue = child[INSPECTED_VALUE];

        sendMessage({ type: 'go_to_inspected_value', url: window.location.href });
      }
      break;
    }

    case 'inspect_children': {
      if (contentState.inspectedId !== message.id || contentState.inspections === null) {
        break;
      }

      const inspection = contentState.inspections[message.part];
      const child = getInspectionChild(inspection, message.path, inspectOptions);

      if (child !== undefined && child.hasChildren && child.children === undefined) {
        child.children = inspect(child[INSPECTED_VALUE], 1, inspectOptions).children;

        sendMessage({ type: 'executor_patched', id: message.id, patch: { [message.part]: inspection } });
      }
      break;
    }

    case 'retry_executor':
      contentState.executors.get(message.id)?.executor.retry();
      break;

    case 'invalidate_executor':
      contentState.executors.get(message.id)?.executor.invalidate();
      break;

    case 'abort_executor':
      contentState.executors.get(message.id)?.executor.abort();
      break;
  }
}

const devtools: ExecutorPlugin = executor => {
  const id = nextUID();

  const plugins: ExecutorPlugins = {};

  executor.subscribe(event => {
    switch (event.type) {
      case 'fulfilled':
      case 'rejected':
      case 'cleared':
      case 'pending':
      case 'aborted':
      case 'invalidated':
      case 'activated':
      case 'deactivated':
        if (contentState.isConnected && contentState.executors.has(id)) {
          sendMessage({ type: 'executor_state_changed', id, stats: getExecutorStats(executor) });
        }
        break;

      case 'plugin_configured':
        plugins[event.payload.type] = event.payload.options;
        break;

      case 'attached':
        contentState.executors.set(id, { executor, plugins });

        if (contentState.isConnected) {
          sendMessage({ type: 'executor_attached', id, details: getExecutorDetails(contentState.originId, executor) });
        }
        break;

      case 'detached':
        contentState.executors.delete(id);

        if (contentState.inspectedId === id) {
          contentState.inspectedId = contentState.inspections = null;
        }
        if (contentState.isConnected) {
          sendMessage({ type: 'executor_detached', id });
        }
        break;
    }

    const { inspections } = contentState;

    if (!contentState.isConnected || contentState.inspectedId !== id || inspections === null) {
      return;
    }

    const patch: ExecutorPatch = {};

    switch (event.type) {
      case 'pending':
        patch.task = inspections.task = inspect(executor.task, 0, inspectOptions);
        break;

      case 'fulfilled':
        patch.value = inspections.value = inspect(executor.value, 1, inspectOptions);
        break;

      case 'rejected':
        patch.reason = inspections.reason = inspect(executor.reason, 0, inspectOptions);
        break;

      case 'cleared':
        patch.value = inspections.value = inspect(executor.value, 0, inspectOptions);
        patch.reason = inspections.reason = inspect(executor.reason, 0, inspectOptions);
        break;

      case 'plugin_configured':
        patch.plugins = inspections.plugins = inspect(plugins, 1, inspectOptions);
        break;

      case 'annotated':
        patch.annotations = inspections.annotations = inspect(executor.annotations, 1, inspectOptions);
        break;

      default:
        return;
    }

    sendMessage({ type: 'executor_patched', id, patch });
  });
};

window.__REACT_EXECUTOR_DEVTOOLS__ = { plugin: devtools };

sendMessage({ type: 'content_opened' });
