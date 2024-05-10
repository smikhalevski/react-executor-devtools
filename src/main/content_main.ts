import type { Executor, ExecutorPlugin } from 'react-executor';
import { describeValue, inspect, type InspectOptions } from './inspect';
import {
  type ContentMessage,
  INSPECTED_VALUE,
  type Inspection,
  type PanelMessage,
  type Stats,
  type SuperficialInfo,
} from './types';
import { uuid } from './uuid';

interface InspectableInfo {
  id: string;
  keyInspection: Inspection;
  valueInspection: Inspection;
  reasonInspection: Inspection;
  annotationsInspection: Inspection;
  pluginsInspection: Inspection;
}

interface ContentState {
  isConnected: boolean;
  inspectableInfo: InspectableInfo | null;
  executorInfos: Map<string, { executor: Executor; plugins: { [key: string]: unknown } }>;
}

const contentState: ContentState = {
  isConnected: false,
  inspectableInfo: null,
  executorInfos: new Map(),
};

const inspectOptions: InspectOptions = {
  preprocessor: inspection => {
    const ex = inspection[INSPECTED_VALUE];

    const x = Array.from(contentState.executorInfos.values()).find(x => x.executor === ex);

    if (x !== undefined) {
      inspection.annotations = { isExecutor: true };
    }
  },
};

window.addEventListener('message', event => {
  if (event.data?.source === 'react_executor_devtools_panel') {
    receiveMessage(event.data);
  }
});

function sendMessage(message: ContentMessage): void {
  (message as any).source = 'react_executor_devtools_content';
  console.log('content_main/sendMessage', message);
  window.postMessage(message, '*');
}

function receiveMessage(message: PanelMessage): void {
  console.log('content_main/receiveMessage', message);

  switch (message.type) {
    case 'devtools_panel_opened':
      contentState.isConnected = true;

      sendMessage({
        type: 'hello',
        payload: Array.from(contentState.executorInfos).map(entry => getSuperficialInfo(entry[0], entry[1].executor)),
      });
      break;

    case 'devtools_panel_closed':
      contentState.isConnected = false;
      contentState.inspectableInfo = null;
      break;

    case 'inspection_started': {
      const { id } = message.payload;
      const executorInfo = contentState.executorInfos.get(id);

      if (executorInfo === undefined) {
        break;
      }

      const inspectableInfo = getInspectableInfo(id, executorInfo.executor, executorInfo.plugins);

      contentState.inspectableInfo = inspectableInfo;

      sendMessage({ type: 'key_changed', payload: { id, inspection: inspectableInfo.keyInspection } });
      sendMessage({ type: 'value_changed', payload: { id, inspection: inspectableInfo.valueInspection } });
      sendMessage({ type: 'reason_changed', payload: { id, inspection: inspectableInfo.reasonInspection } });
      sendMessage({ type: 'plugins_changed', payload: { id, inspection: inspectableInfo.pluginsInspection } });
      sendMessage({
        type: 'annotations_changed',
        payload: { id, inspection: inspectableInfo.annotationsInspection },
      });
      break;
    }

    case 'inspection_expanded': {
      const { inspectableInfo } = contentState;
      const { part, path } = message.payload;

      if (inspectableInfo?.id !== message.payload.id) {
        break;
      }

      let inspection;

      switch (part) {
        case 'key':
          inspection = inspectableInfo.keyInspection;
          break;

        case 'value':
          inspection = inspectableInfo.valueInspection;
          break;

        case 'reason':
          inspection = inspectableInfo.reasonInspection;
          break;

        case 'annotations':
          inspection = inspectableInfo.annotationsInspection;
          break;

        case 'plugins':
          inspection = inspectableInfo.pluginsInspection;
          break;
      }

      let childInspection = inspection;
      for (const index of path) {
        childInspection = childInspection.children![index];
      }

      childInspection.children = inspect(childInspection[INSPECTED_VALUE], 1, inspectOptions).children;

      sendMessage({ type: `${part}_changed`, payload: { id: inspectableInfo.id, inspection } });
      break;
    }

    case 'retry_executor':
      contentState.executorInfos.get(message.payload.id)?.executor.retry();
      break;

    case 'invalidate_executor':
      contentState.executorInfos.get(message.payload.id)?.executor.invalidate();
      break;
  }
}

const plugin: ExecutorPlugin = executor => {
  const id = uuid();

  const plugins: { [key: string]: unknown } = {};

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
        if (contentState.executorInfos.has(id) && contentState.isConnected) {
          sendMessage({ type: 'stats_changed', payload: { id, stats: getStats(executor) } });
        }
        break;

      case 'plugin_configured':
        plugins[event.payload.type] = event.payload.options;
        break;

      case 'attached':
        contentState.executorInfos.set(id, { executor, plugins });

        if (contentState.isConnected) {
          sendMessage({ type: 'executor_attached', payload: getSuperficialInfo(id, executor) });
        }
        break;

      case 'detached':
        contentState.executorInfos.delete(id);

        if (contentState.inspectableInfo?.id === id) {
          contentState.inspectableInfo = null;
        }
        if (contentState.isConnected) {
          sendMessage({ type: 'executor_detached', payload: { id } });
        }
        break;
    }

    if (!contentState.isConnected || contentState.inspectableInfo?.id !== id) {
      return;
    }

    switch (event.type) {
      case 'fulfilled':
        sendMessage({ type: 'value_changed', payload: { id, inspection: inspect(executor.value, 1, inspectOptions) } });
        break;

      case 'rejected':
        sendMessage({
          type: 'reason_changed',
          payload: { id, inspection: inspect(executor.reason, 1, inspectOptions) },
        });
        break;

      case 'cleared':
        sendMessage({ type: 'value_changed', payload: { id, inspection: inspect(executor.value, 1, inspectOptions) } });
        sendMessage({
          type: 'reason_changed',
          payload: { id, inspection: inspect(executor.reason, 1, inspectOptions) },
        });
        break;

      case 'plugin_configured':
        sendMessage({ type: 'plugins_changed', payload: { id, inspection: inspect(plugins, 1, inspectOptions) } });
        break;

      case 'annotated':
        // sendMessage({ type: 'annotations_changed', payload: { id, inspection: inspect(executor.annotations, 1, inspectOptions) } });
        break;
    }
  });
};

(window as any).__REACT_EXECUTOR_DEVTOOLS__ = { plugin };

function getSuperficialInfo(id: string, executor: Executor): SuperficialInfo {
  return {
    id,
    origin: window.location.origin,
    keyDescription: describeValue(executor.key, 3),
    stats: getStats(executor),
  };
}

function getInspectableInfo(id: string, executor: Executor, plugins: { [key: string]: unknown }): InspectableInfo {
  return {
    id,
    keyInspection: inspect(executor.key, 1, inspectOptions),
    valueInspection: inspect(executor.value, 1, inspectOptions),
    reasonInspection: inspect(executor.reason, 1, inspectOptions),
    annotationsInspection: inspect({}, 1, inspectOptions),
    // annotationsInspection: inspect(executor.annotations, 1, inspectOptions),
    pluginsInspection: inspect(plugins, 1, inspectOptions),
  };
}

function getStats(executor: Executor): Stats {
  return {
    settledAt: executor.settledAt,
    invalidatedAt: executor.invalidatedAt,
    isFulfilled: executor.isFulfilled,
    isPending: executor.isPending,
    isActive: executor.isActive,
  };
}
