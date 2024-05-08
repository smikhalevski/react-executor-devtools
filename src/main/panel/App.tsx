import React from 'react';
import { type Executor, type ExecutorManager, useExecutorManager, useExecutorSubscription } from 'react-executor';
import type { Inspection } from '../inspect';
import { useAPI } from './APIContext';
import { Layout } from './components/Layout';
import { InspectionView } from './components/InspectionView';
import './normalize.module.css';
import './root.module.css';

export interface ExecutorLineItem {
  executorIndex: number;
  keyInspection: Inspection;
}

export function getOrCreateExecutorLineItemListExecutor(manager: ExecutorManager): Executor<ExecutorLineItem[]> {
  return manager.getOrCreate('executor-line-item-list');
}

export const App = () => {
  return (
    <Layout
      executorsChildren={<ExecutorLineItemListView />}
      inspectedExecutorChildren={
        <div>
          <div>Key</div>
          <div>Status</div>
          <div>Value</div>
          <div>Reason</div>
          <div>Plugins</div>
          <div>Annotations</div>
        </div>
      }
    />
  );
};

const ExecutorLineItemListView = () => {
  const executorLineItemListExecutor = getOrCreateExecutorLineItemListExecutor(useExecutorManager());

  useExecutorSubscription(executorLineItemListExecutor);

  if (!executorLineItemListExecutor.isFulfilled) {
    return 'Loading';
  }

  return executorLineItemListExecutor.get().map((preview, index) => (
    <ExecutorLineItemView
      executorLineItem={preview}
      key={index}
    />
  ));
};

interface ExecutorLineItemViewProps {
  executorLineItem: ExecutorLineItem;
}

const ExecutorLineItemView = ({ executorLineItem }: ExecutorLineItemViewProps) => {
  const api = useAPI();

  return (
    <div>
      <InspectionView
        inspection={executorLineItem.keyInspection}
        path={[]}
        onInspectionRequested={path => {
          api.getInspectionAt('key', executorLineItem.executorIndex, path);
        }}
      />
    </div>
  );
};
