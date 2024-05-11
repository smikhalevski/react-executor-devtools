import { type Executor, ExecutorManager, useExecutorSubscription } from 'react-executor';
import detachDeactivated from 'react-executor/plugin/detachDeactivated';
import type { ExecutorDetails, ExecutorPart, Inspection } from '../types';

interface Inspector {
  id: string;
}

interface ListItem {
  id: string;
  originId: string;
}

export const executorManager = new ExecutorManager();

export const listExecutor = executorManager.getOrCreate<ListItem[]>('list', []);

export const inspectorExecutor = executorManager.getOrCreate<Inspector | null>('inspector', null);

export function getDetailsExecutor(id: string): Executor<ExecutorDetails> {
  return executorManager.getOrCreate('details' + id, undefined, [detachDeactivated(0)]);
}

export function getPartInspectionExecutor(id: string, part: ExecutorPart): Executor<Inspection | null> {
  return executorManager.getOrCreate<Inspection | null>('inspection' + id + part, null, [detachDeactivated(0)]);
}

export function useInspector(): Inspector | null {
  useExecutorSubscription(inspectorExecutor);
  return inspectorExecutor.get();
}

export function useList(): ListItem[] {
  useExecutorSubscription(listExecutor);
  return listExecutor.get();
}

export function useDetails(id: string): ExecutorDetails {
  const executor = getDetailsExecutor(id);
  useExecutorSubscription(executor);
  return executor.get();
}

export function usePartInspection(id: string, part: ExecutorPart): Inspection | null {
  const executor = getPartInspectionExecutor(id, part);
  useExecutorSubscription(executor);
  return executor.get();
}
