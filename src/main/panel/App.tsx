import React from 'react';
import { type Executor, type ExecutorManager, useExecutorManager, useExecutorSubscription } from 'react-executor';
import type { Inspection } from '../inspect';
import { InspectionView } from './InspectionView';

export interface Preview {
  executorIndex: number;
  keyInspection: Inspection;
}

export function getOrCreatePreviewsExecutor(manager: ExecutorManager): Executor<Preview[]> {
  return manager.getOrCreate('previews');
}

export const App = () => {
  return <PreviewsView />;
};

export const PreviewsView = () => {
  const previewsExecutor = getOrCreatePreviewsExecutor(useExecutorManager());

  useExecutorSubscription(previewsExecutor);

  if (!previewsExecutor.isFulfilled) {
    return 'Loading';
  }

  return previewsExecutor.get().map((preview, index) => (
    <PreviewView
      preview={preview}
      key={index}
    />
  ));
};

export interface PreviewViewProps {
  preview: Preview;
}

export const PreviewView = ({ preview }: PreviewViewProps) => {
  return (
    <div>
      <InspectionView
        inspection={preview.keyInspection}
        qualifier={{ type: 'key', executorIndex: preview.executorIndex }}
        path={[]}
      />
    </div>
  );
};
