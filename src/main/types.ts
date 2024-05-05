export interface ExecutorSnapshot {
  key: unknown;
  index: number;
  state: ExecutorSnapshotState;
  events: ExecutorEventSnapshot[];
}

export interface ExecutorSnapshotState {
  isFulfilled: boolean;
  isRejected: boolean;
  isInvalidated: boolean;
  value: unknown;
  reason: unknown;
  timestamp: number;
}

export interface ExecutorEventSnapshot {
  type: string;
  payload: unknown;
}
