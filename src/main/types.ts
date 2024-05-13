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
  | { type: 'executor'; id: string }
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
  /**
   * The unique ID of the frame where the executor was created.
   */
  originId: string;
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

export type PanelMessage =
  | { type: 'panel_opened'; originId: string | undefined }
  | { type: 'panel_closed' }
  | { type: 'start_inspection'; id: string }
  | { type: 'retry_executor'; id: string }
  | { type: 'invalidate_executor'; id: string }
  | { type: 'abort_executor'; id: string }
  | { type: 'inspect_children'; id: string; part: ExecutorPart; path: number[] }
  | { type: 'go_to_part_definition'; id: string; part: ExecutorPart; path: number[] };

export type ContentMessage =
  | { type: 'content_opened'; originId: string }
  | { type: 'content_closed'; originId: string }
  | { type: 'executor_attached'; id: string; details: ExecutorDetails }
  | { type: 'executor_detached'; id: string }
  | { type: 'executor_state_changed'; id: string; stats: ExecutorStats }
  | { type: 'executor_patched'; id: string; patch: ExecutorPatch }
  | { type: 'open_sources_tab'; url: string };
