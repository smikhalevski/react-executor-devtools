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
import { getExecutorDetails, getExecutorPartInspections, getExecutorStats, getInspectionChild, nextUID } from './utils';

/**
 * The state of the content script.
 */
interface ContentState {
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
  inspectedExecutorId: string | null;

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
  executorInfos: new Map(),
  isPanelOpened: false,
  inspectedExecutorId: null,
  inspections: null,
};

const inspectOptions: InspectOptions = {
  preprocessor: inspection => {
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
    for (const [executorId, executorInfo] of contentState.executorInfos) {
      if (executorInfo.executor === value) {
        inspection.location = { type: 'executor', executorId };
        break;
      }
    }
  },
};

window.addEventListener('message', (event: MessageEvent<PanelMessage>) => {
  if (event.data?.source === MESSAGE_SOURCE_PANEL) {
    receivePanelMessage(event.data);
  }
});

function sendContentMessage(message: ContentMessage): void {
  message.source = MESSAGE_SOURCE_CONTENT;
  window.postMessage(message, window.location.origin);
}

function receivePanelMessage(message: PanelMessage): void {
  switch (message.type) {
    case 'panel_opened':
      if (contentState.isPanelOpened) {
        break;
      }

      contentState.isPanelOpened = true;

      for (const [executorId, executorInfo] of contentState.executorInfos) {
        const details = getExecutorDetails(executorInfo.executor);

        sendContentMessage({ type: 'executor_attached', executorId, details });
      }
      break;

    case 'panel_closed':
      contentState.isPanelOpened = false;
      contentState.inspectedExecutorId = contentState.inspections = null;
      break;

    case 'start_inspection': {
      const executorInfo = contentState.executorInfos.get(message.executorId);

      if (executorInfo !== undefined) {
        contentState.inspectedExecutorId = message.executorId;
        contentState.inspections = getExecutorPartInspections(
          executorInfo.executor,
          executorInfo.plugins,
          inspectOptions
        );

        sendContentMessage({
          type: 'executor_patched',
          executorId: message.executorId,
          patch: contentState.inspections,
        });
      }
      break;
    }

    case 'go_to_part_definition': {
      if (contentState.inspectedExecutorId !== message.executorId || contentState.inspections === null) {
        break;
      }

      const child = getInspectionChild(contentState.inspections[message.part], message.path, inspectOptions);

      if (child !== undefined) {
        window.__REACT_EXECUTOR_DEVTOOLS__.inspectedValue = child[INSPECTED_VALUE];

        sendContentMessage({ type: 'open_sources_tab' });
      }
      break;
    }

    case 'debug_executor': {
      const executorInfo = contentState.executorInfos.get(message.executorId);

      if (executorInfo === undefined) {
        break;
      }

      const executor = executorInfo.executor;

      window.$executor = executor;

      const labelStyle = 'display: block; padding-top: 8px; font-weight: bold';
      const statusStyle =
        'display: block; color: ' + (executor.settledAt === 0 ? '#aaa' : executor.isFulfilled ? 'green' : 'red');

      console.log(
        '%cKey\n%o\n' +
          '%cStatus\n%c\u25cf%c %s\n' +
          '%cValue\n%o\n' +
          '%cReason\n%o\n' +
          '%cTask\n%o\n' +
          '%cPlugins\n%o\n' +
          '%cAnnotations\n%o\n' +
          '%cUse %c$executor%c to access the executor instance from the console.',
        'font-weight: bold',
        executor.key,
        labelStyle,
        statusStyle,
        '',
        executor.settledAt === 0 ? 'Unsettled' : executor.isFulfilled ? 'Fulfilled' : 'Rejected',
        labelStyle,
        executor.value,
        labelStyle,
        executor.reason,
        labelStyle,
        executor.task,
        labelStyle,
        executorInfo.plugins,
        labelStyle,
        executor.annotations,
        // Hint
        'display: block; padding-top: 16px; color: #aaa',
        'display: inline-block; padding: 2px 6px; white-space: nowrap; border-radius: 4px; border: 1px solid #aaa; color: #aaa',
        'color:#aaa'
      );
      break;
    }

    case 'inspect_children': {
      if (contentState.inspectedExecutorId !== message.executorId || contentState.inspections === null) {
        break;
      }

      const inspection = contentState.inspections[message.part];
      const child = getInspectionChild(inspection, message.path, inspectOptions);

      if (child !== undefined && child.hasChildren && child.children === undefined) {
        child.children = inspect(child[INSPECTED_VALUE], 1, inspectOptions).children;

        sendContentMessage({
          type: 'executor_patched',
          executorId: message.executorId,
          patch: { [message.part]: inspection },
        });
      }
      break;
    }

    case 'retry_executor':
      contentState.executorInfos.get(message.executorId)?.executor.retry();
      break;

    case 'invalidate_executor':
      contentState.executorInfos.get(message.executorId)?.executor.invalidate();
      break;

    case 'abort_executor':
      contentState.executorInfos.get(message.executorId)?.executor.abort();
      break;
  }
}

const devtools: ExecutorPlugin = executor => {
  const executorId = nextUID();

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
        if (contentState.isPanelOpened && contentState.executorInfos.has(executorId)) {
          sendContentMessage({ type: 'executor_state_changed', executorId, stats: getExecutorStats(executor) });
        }
        break;

      case 'plugin_configured':
        plugins[event.payload.type] = event.payload.options;
        break;

      case 'attached':
        contentState.executorInfos.set(executorId, { executor, plugins });

        if (contentState.isPanelOpened) {
          sendContentMessage({ type: 'executor_attached', executorId, details: getExecutorDetails(executor) });
        }
        break;

      case 'detached':
        contentState.executorInfos.delete(executorId);

        if (contentState.inspectedExecutorId === executorId) {
          contentState.inspectedExecutorId = contentState.inspections = null;
        }
        if (contentState.isPanelOpened) {
          sendContentMessage({ type: 'executor_detached', executorId });
        }
        break;
    }

    const { inspections } = contentState;

    if (!contentState.isPanelOpened || contentState.inspectedExecutorId !== executorId || inspections === null) {
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

    sendContentMessage({ type: 'executor_patched', executorId, patch });
  });
};

window.__REACT_EXECUTOR_DEVTOOLS__ = { plugin: devtools };

sendContentMessage({ type: 'content_opened' });
