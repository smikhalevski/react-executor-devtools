export const INSPECTED_VALUE = Symbol('inspectedValue');

/**
 * The result of the value inspection.
 */
export interface Inspection {
  /**
   * The original inspected value.
   *
   * **Note:** Available only in the content script.
   */
  [INSPECTED_VALUE]: unknown;

  /**
   * The preview of the inspected value.
   */
  valuePreview: string;

  /**
   * The preview of the inspected key under which the inspected value is stored in the parent object.
   */
  keyPreview?: string;

  /**
   * `true` if the inspected object has children, or `false` or `undefined` otherwise.
   */
  hasChildren?: boolean;

  /**
   * The array of child property inspections, or `undefined` if there are no children, or they weren't inspected.
   */
  children?: Inspection[];

  /**
   * The location of the inspected value to which user can navigate.
   */
  location?: Location;
}

/**
 * The location of the inspected value to which user can navigate from the inspection.
 */
export type Location =
  | { type: 'executor'; executorId: string }
  // The inspected value can be located in source code through the 'go_to_part_definition' event
  | { type: 'sourcesTab' };

export interface ExecutorStats {
  settledAt: number;
  invalidatedAt: number;
  isFulfilled: boolean;
  isPending: boolean;
  isActive: boolean;

  /**
   * `true` if the executor has a non-`null` task, or `false` otherwise.
   */
  hasTask: boolean;
}

export interface ExecutorDetails {
  keyPreview: string;
  stats: ExecutorStats;
}

/**
 * The part of the executor that is separately updated in the inspector view.
 */
export type ExecutorPart = 'key' | 'value' | 'reason' | 'task' | 'annotations' | 'plugins';

export type ExecutorPatch = Partial<Record<ExecutorPart, Inspection>>;

/**
 * Map from the plugin type to options.
 */
export type ExecutorPlugins = { [key: string]: unknown };

/**
 * panel -> content, content_main
 */
export type PanelMessage =
  | { source?: string; type: 'panel_opened' }
  | { source?: string; type: 'panel_closed' }
  | { source?: string; type: 'start_inspection'; executorId: string }
  | { source?: string; type: 'retry_executor'; executorId: string }
  | { source?: string; type: 'invalidate_executor'; executorId: string }
  | { source?: string; type: 'abort_executor'; executorId: string }
  | { source?: string; type: 'inspect_children'; executorId: string; part: ExecutorPart; path: number[] }
  | { source?: string; type: 'go_to_part_definition'; executorId: string; part: ExecutorPart; path: number[] };

/**
 * content, content_main -> panel
 */
export type ContentMessage =
  | { source?: string; type: 'content_opened' }
  | { source?: string; type: 'content_closed' }
  | { source?: string; type: 'executor_attached'; executorId: string; details: ExecutorDetails }
  | { source?: string; type: 'executor_detached'; executorId: string }
  | { source?: string; type: 'executor_state_changed'; executorId: string; stats: ExecutorStats }
  | { source?: string; type: 'executor_patched'; executorId: string; patch: ExecutorPatch }
  | { source?: string; type: 'open_sources_tab'; url: string };
