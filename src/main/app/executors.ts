import { type Executor, ExecutorManager, useExecutorSubscription } from 'react-executor';
import detachDeactivated from 'react-executor/plugin/detachDeactivated';
import type { ExecutorDetails, ExecutorPart, Inspection } from '../types';

interface Inspector {
  executorId: string;
}

interface ListItem {
  executorId: string;
  documentId: string;

  /**
   * String that is used for list filtering.
   */
  term: string;
}

export const executorManager = new ExecutorManager();

export const listExecutor = executorManager.getOrCreate<ListItem[]>('list', []);

export const inspectorExecutor = executorManager.getOrCreate<Inspector | null>('inspector', null);

export function getDetailsExecutor(executorId: string): Executor<ExecutorDetails> {
  return executorManager.getOrCreate(`details_${executorId}`);
}

export function getPartInspectionExecutor(executorId: string, part: ExecutorPart): Executor<Inspection | null> {
  return executorManager.getOrCreate<Inspection | null>(`inspection_${executorId}_${part}`, null, [
    detachDeactivated(0),
  ]);
}

export function useInspector(): Inspector | null {
  useExecutorSubscription(inspectorExecutor);
  return inspectorExecutor.get();
}

export function useList(): ListItem[] {
  useExecutorSubscription(listExecutor);
  return listExecutor.get();
}

export function useExecutorDetails(executorId: string): ExecutorDetails {
  const executor = getDetailsExecutor(executorId);
  useExecutorSubscription(executor);
  return executor.get();
}

export function usePartInspection(executorId: string, part: ExecutorPart): Inspection | null {
  const executor = getPartInspectionExecutor(executorId, part);
  useExecutorSubscription(executor);
  return executor.get();
}
