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

const plugins = [detachDeactivated(0)];

export function getDetailsExecutor(id: string): Executor<ExecutorDetails> {
  return executorManager.getOrCreate(`details_${id}`, undefined, plugins);
}

export function getPartInspectionExecutor(id: string, part: ExecutorPart): Executor<Inspection | null> {
  return executorManager.getOrCreate<Inspection | null>(`inspection_${id}_${part}`, null, plugins);
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
