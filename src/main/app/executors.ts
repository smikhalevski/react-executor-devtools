import { type Executor, ExecutorManager, useExecutorSubscription } from 'react-executor';
import detachDeactivated from 'react-executor/plugin/detachDeactivated';
import synchronizeStorage from 'react-executor/plugin/synchronizeStorage';
import type { ExecutorDetails, ExecutorPart, Inspection } from '../types';

interface Inspector {
  /**
   * The ID of currently inspected executor.
   */
  executorId: string;
}

interface ListItem {
  executorId: string;

  /**
   * The ID of the document from which the executor originates.
   */
  documentId: string;

  /**
   * The value that is searched when the list is filtered.
   */
  searchableString: string;
}

export const executorManager = new ExecutorManager();

export const layoutRatioExecutor = executorManager.getOrCreate('layout_ratio', { horizontal: '40%', vertical: '50%' }, [
  synchronizeStorage(localStorage, { storageKey: 'layout_ratio' }),
]);

export const listExecutor = executorManager.getOrCreate<ListItem[]>('list', []);

export const inspectorExecutor = executorManager.getOrCreate<Inspector>('inspector');

export function getDetailsExecutor(executorId: string): Executor<ExecutorDetails> {
  return executorManager.getOrCreate(`details_${executorId}`);
}

export function getPartInspectionExecutor(executorId: string, part: ExecutorPart): Executor<Inspection> {
  return executorManager.getOrCreate(`inspection_${executorId}_${part}`, undefined, [detachDeactivated(0)]);
}

export function useInspector(): Inspector | undefined {
  useExecutorSubscription(inspectorExecutor);
  return inspectorExecutor.value;
}

export function useList(): ListItem[] {
  useExecutorSubscription(listExecutor);
  return listExecutor.get();
}

export function useDetails(executorId: string): ExecutorDetails {
  const executor = getDetailsExecutor(executorId);
  useExecutorSubscription(executor);
  return executor.get();
}

export function usePartInspection(executorId: string, part: ExecutorPart): Inspection | undefined {
  const executor = getPartInspectionExecutor(executorId, part);
  useExecutorSubscription(executor);
  return executor.value;
}
