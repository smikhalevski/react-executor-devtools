import type { Executor, ExecutorPlugin } from 'react-executor';
import { describeValue, inspect } from './inspect';
import type { ContentMessage, Inspection, PanelMessage, Stats, SuperficialInfo } from './types';
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

window.addEventListener('message', event => {
  if (event.data?.source === 'react_executor_devtools') {
    receiveMessage(event.data);
  }
});

function sendMessage(message: ContentMessage): void {
  (message as any).source = 'react_executor_devtools';
  window.postMessage(message, '*');
}

function receiveMessage(message: PanelMessage): void {
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

      for (const index of path) {
        inspection = inspection.children![index];
      }

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
    if (!contentState.isConnected) {
      return;
    }

    switch (event.type) {
      case 'fulfilled':
      case 'rejected':
      case 'cleared':
      case 'pending':
      case 'aborted':
      case 'invalidated':
      case 'activated':
      case 'deactivated':
        if (contentState.executorInfos.has(id)) {
          sendMessage({ type: 'stats_changed', payload: { id, stats: getStats(executor) } });
        }
        break;

      case 'plugin_configured':
        plugins[event.payload.type] = event.payload.options;
        break;

      case 'attached':
        contentState.executorInfos.set(id, { executor, plugins });
        sendMessage({ type: 'executor_attached', payload: getSuperficialInfo(id, executor) });
        break;

      case 'detached':
        contentState.executorInfos.delete(id);

        if (contentState.inspectableInfo?.id === id) {
          contentState.inspectableInfo = null;
        }
        sendMessage({ type: 'executor_detached', payload: { id } });
        break;
    }

    if (contentState.inspectableInfo?.id !== id) {
      return;
    }

    switch (event.type) {
      case 'fulfilled':
        sendMessage({ type: 'value_changed', payload: { id, inspection: inspect(executor.value) } });
        break;

      case 'rejected':
        sendMessage({ type: 'reason_changed', payload: { id, inspection: inspect(executor.reason) } });
        break;

      case 'cleared':
        sendMessage({ type: 'value_changed', payload: { id, inspection: inspect(executor.value) } });
        sendMessage({ type: 'reason_changed', payload: { id, inspection: inspect(executor.reason) } });
        break;

      case 'plugin_configured':
        sendMessage({ type: 'plugins_changed', payload: { id, inspection: inspect(plugins) } });
        break;

      case 'annotated':
        // sendMessage({ type: 'annotations_changed', payload: { id, inspection: inspect(executor.annotations) } });
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
    keyInspection: inspect(executor.key),
    valueInspection: inspect(executor.value),
    reasonInspection: inspect(executor.reason),
    annotationsInspection: inspect({}),
    // annotationsInspection: inspect(executor.annotations),
    pluginsInspection: inspect(plugins),
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