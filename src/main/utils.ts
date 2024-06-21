import type { Executor } from 'react-executor';
import { getValuePreview, inspect, InspectOptions } from './inspect';
import { ExecutorDetails, ExecutorPart, ExecutorPlugins, ExecutorStats, INSPECTED_VALUE, Inspection } from './types';

export function noop(): void {}

/**
 * Returns a unique ID that can be shared between the content script and the panel script.
 */
export function nextUID(): string {
  return Date.now().toString(16) + ((Math.random() * 0x7fffffff) | 0).toString(16).padStart(8, '0');
}

/**
 * Returns the child inspection at path, or `undefined` if there are no children. Missing children are inspected along
 * the path.
 *
 * @param inspection The inspection to retrieve children from.
 * @param path The array of indices of retrieved child inspections.
 * @param options Additional options.
 */
export function getInspectionChild(
  inspection: Inspection,
  path: number[],
  options?: InspectOptions
): Inspection | undefined {
  for (let i = 0; i < path.length; ++i) {
    if (
      !inspection.hasChildren ||
      (inspection.children === undefined &&
        (inspection.children = inspect(inspection[INSPECTED_VALUE], 1, options).children) === undefined)
    ) {
      inspection.hasChildren = false;
      return;
    }
    if (path[i] >= inspection.children.length) {
      return;
    }
    inspection = inspection.children[path[i]];
  }
  return inspection;
}

export function getExecutorDetails(executor: Executor): ExecutorDetails {
  return {
    keyPreview: getValuePreview(executor.key, 2),
    stats: getExecutorStats(executor),
  };
}

export function getExecutorPartInspections(
  executor: Executor,
  plugins: ExecutorPlugins | undefined,
  options: InspectOptions
): Record<ExecutorPart, Inspection> {
  return {
    key: inspect(executor.key, 0, options),
    value: inspect(executor.value, 1, options),
    reason: inspect(executor.reason, 0, options),
    task: inspect(executor.task, 0, options),
    annotations: inspect(executor.annotations, 1, options),
    plugins: inspect(plugins, 1, options),
  };
}

export function getExecutorStats(executor: Executor): ExecutorStats {
  return {
    settledAt: executor.settledAt,
    invalidatedAt: executor.invalidatedAt,
    isFulfilled: executor.isFulfilled,
    isPending: executor.isPending,
    isActive: executor.isActive,
    hasTask: executor.task !== null,
  };
}

export function die(message?: string): never {
  throw new Error(message);
}
