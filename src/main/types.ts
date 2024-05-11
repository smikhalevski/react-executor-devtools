export const INSPECTED_VALUE = Symbol('inspectedValue');

/**
 * The result of the value inspection.
 */
export interface Inspection {
  [INSPECTED_VALUE]: unknown;

  /**
   * The preview of the inspected value.
   */
  valueDescription: string;

  /**
   * The description of the inspected key under which the inspected value is stored in the parent object.
   */
  keyDescription?: string;

  /**
   * `true` if the inspected object has children, or `false` or `undefined` otherwise.
   */
  hasChildren?: boolean;

  /**
   * The array of child property inspections, or `undefined` if there are no children, or they weren't inspected.
   */
  children?: Inspection[];

  annotations?: { [key: string]: any };
}

export interface Stats {
  settledAt: number;
  invalidatedAt: number;
  isFulfilled: boolean;
  isPending: boolean;
  isActive: boolean;
  hasTask: boolean;
}

export interface SuperficialInfo {
  /**
   * The executor UUID.
   */
  id: string;
  origin: string;
  keyDescription: string;
  stats: Stats;
}

export type InspectionPart = 'key' | 'value' | 'reason' | 'task' | 'annotations' | 'plugins';

export type PanelMessage =
  | { type: 'devtools_panel_opened' }
  | { type: 'devtools_panel_opened_for_origin'; payload: { origin: string } }
  | { type: 'devtools_panel_closed' }
  | { type: 'retry_executor'; payload: { id: string } }
  | { type: 'invalidate_executor'; payload: { id: string } }
  | { type: 'abort_executor'; payload: { id: string } }
  | { type: 'inspection_started'; payload: { id: string } }
  | { type: 'go_to_definition'; payload: { id: string; part: InspectionPart; path: number[] } }
  | { type: 'inspection_expanded'; payload: { id: string; part: InspectionPart; path: number[] } };

export type ContentMessage =
  | { type: 'devtools_content_opened'; payload: { origin: string } }
  | { type: 'devtools_content_closed'; payload: { origin: string } }
  | { type: 'adopt_existing_executors'; payload: SuperficialInfo[] }
  | { type: 'executor_attached'; payload: SuperficialInfo }
  | { type: 'executor_detached'; payload: { id: string } }
  | { type: 'stats_changed'; payload: { id: string; stats: Stats } }
  | { type: 'key_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'value_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'reason_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'task_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'plugins_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'annotations_changed'; payload: { id: string; inspection: Inspection } }
  | { type: 'go_to_definition_source'; payload: { url: string } };
