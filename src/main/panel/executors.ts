import { type Executor, ExecutorManager, useExecutorSubscription } from 'react-executor';
import detachDeactivated from 'react-executor/plugin/detachDeactivated';
import type { InspectionPart, Inspection, SuperficialInfo } from '../types';

export const executorManager = new ExecutorManager();

export const inspectedIdExecutor = executorManager.getOrCreate<string | null>('inspected_id', null);

export const idsExecutor = executorManager.getOrCreate<Array<{ origin: string; id: string }>>('ids', []);

export function getOrCreateSuperficialInfoExecutor(
  id: string,
  initialValue?: SuperficialInfo
): Executor<SuperficialInfo> {
  return executorManager.getOrCreate(`superficial_info_${id}`, initialValue, [detachDeactivated(0)]);
}

export function getOrCreatePartInspectionExecutor(id: string, part: InspectionPart): Executor<Inspection | null> {
  return executorManager.getOrCreate<Inspection | null>(`inspection_${id}_${part}`, null, [detachDeactivated(0)]);
}

export function useInspectedId(): string | null {
  useExecutorSubscription(inspectedIdExecutor);
  return inspectedIdExecutor.get();
}

export function useIds(): Array<{ origin: string; id: string }> {
  useExecutorSubscription(idsExecutor);
  return idsExecutor.get();
}

export function useSuperficialInfo(id: string): SuperficialInfo {
  const executor = getOrCreateSuperficialInfoExecutor(id);
  useExecutorSubscription(executor);
  return executor.get();
}

export function usePartInspection(id: string, part: InspectionPart): Inspection | null {
  const executor = getOrCreatePartInspectionExecutor(id, part);
  useExecutorSubscription(executor);
  return executor.get();
}
