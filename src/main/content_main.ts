import type { Executor, ExecutorPlugin } from 'react-executor';
import { MESSAGE_SOURCE_CONTENT, MESSAGE_SOURCE_PANEL } from './constants';
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

/**
 * The state of the content script.
 */
interface ContentState {
  /**
   * The unique ID of this content script.
   */
  readonly originId: string;

  /**
   * Executors managed by the content script.
   */
  readonly executorInfos: Map<string, ExecutorInfo>;

  /**
   * `true` if the devtools panel is opened.
   */
  isPanelOpened: boolean;

  /**
   * The ID of the executor opened in the devtools panel inspector.
   */
  inspectedId: string | null;

  /**
   * Inspections rendered for the executor that is opened in the devtools panel inspector.
   */
  inspections: Record<ExecutorPart, Inspection> | null;
}

interface ExecutorInfo {
  executor: Executor;

  /**
   * Map from a plugin type to corresponding options.
   */
  plugins: ExecutorPlugins;
}

const contentState: ContentState = {
  originId: nextUID(),
  executorInfos: new Map(),
  isPanelOpened: false,
  inspectedId: null,
  inspections: null,
};

const inspectOptions: InspectOptions = {
  preprocessor(inspection) {
    const value = inspection[INSPECTED_VALUE];

    if (typeof value === 'function') {
      // Functions can be revealed in the sources tab
      inspection.location = { type: 'sourcesTab' };
      return;
    }

    if (value === null || typeof value !== 'object') {
      // Ignore primitives
      return;
    }

    // Look up an existing executor
    for (const [id, executorInfo] of contentState.executorInfos) {
      if (executorInfo.executor === value) {
        inspection.location = { type: 'executor', id };
        break;
      }
    }
  },
};

window.addEventListener('message', event => {
  if (event.data?.source === MESSAGE_SOURCE_PANEL) {
    receiveMessage(event.data);
  }
});

window.addEventListener('beforeunload', () => {
  if (contentState.isPanelOpened) {
    sendMessage({ type: 'content_closed', originId: contentState.originId });
  }
});

function sendMessage(message: ContentMessage): void {
  (message as any).source = MESSAGE_SOURCE_CONTENT;

  log('content_main', message);
  window.postMessage(message, '*');
}

function receiveMessage(message: PanelMessage): void {
  log('panel', message);

  switch (message.type) {
    case 'panel_opened':
      if (message.originId !== undefined && message.originId !== contentState.originId) {
        // Ignore if panel is opened for another content script
        break;
      }

      contentState.isPanelOpened = true;

      for (const [id, executorInfo] of contentState.executorInfos) {
        const details = getExecutorDetails(contentState.originId, executorInfo.executor);

        sendMessage({ type: 'executor_attached', id, details });
      }
      break;

    case 'panel_closed':
      contentState.isPanelOpened = false;
      contentState.inspectedId = contentState.inspections = null;
      break;

    case 'start_inspection': {
      const executorInfo = contentState.executorInfos.get(message.id);

      if (executorInfo !== undefined) {
        contentState.inspectedId = message.id;
        contentState.inspections = getExecutorPartInspections(
          executorInfo.executor,
          executorInfo.plugins,
          inspectOptions
        );

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

        sendMessage({ type: 'open_sources_tab', url: window.location.href });
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
      contentState.executorInfos.get(message.id)?.executor.retry();
      break;

    case 'invalidate_executor':
      contentState.executorInfos.get(message.id)?.executor.invalidate();
      break;

    case 'abort_executor':
      contentState.executorInfos.get(message.id)?.executor.abort();
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
        if (contentState.isPanelOpened && contentState.executorInfos.has(id)) {
          sendMessage({ type: 'executor_state_changed', id, stats: getExecutorStats(executor) });
        }
        break;

      case 'plugin_configured':
        plugins[event.payload.type] = event.payload.options;
        break;

      case 'attached':
        contentState.executorInfos.set(id, { executor, plugins });

        if (contentState.isPanelOpened) {
          sendMessage({ type: 'executor_attached', id, details: getExecutorDetails(contentState.originId, executor) });
        }
        break;

      case 'detached':
        contentState.executorInfos.delete(id);

        if (contentState.inspectedId === id) {
          contentState.inspectedId = contentState.inspections = null;
        }
        if (contentState.isPanelOpened) {
          sendMessage({ type: 'executor_detached', id });
        }
        break;
    }

    const { inspections } = contentState;

    if (!contentState.isPanelOpened || contentState.inspectedId !== id || inspections === null) {
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

sendMessage({ type: 'content_opened', originId: contentState.originId });
