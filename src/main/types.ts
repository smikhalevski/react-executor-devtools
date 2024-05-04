export interface DevtoolsExecutor {
  key: unknown;
  index: number;
  state: DevtoolsExecutorState;
  events: DevtoolsExecutorEvent[];
}

export interface DevtoolsExecutorState {
  isFulfilled: boolean;
  isRejected: boolean;
  isInvalidated: boolean;
  value: unknown;
  reason: unknown;
  timestamp: number;
}

export interface DevtoolsExecutorEvent {
  type: string;
  payload: unknown;
}

export type DevtoolsEvent =
  | { type: 'get_executors' }
  | GetExecutorsResponseEvent
  | ExecutorCreatedEvent
  | ExecutorStateChangedEvent
  | EventInterceptedEvent;

export interface GetExecutorsResponseEvent {
  type: 'get_executors_response';
  executors: DevtoolsExecutor[];
}

export interface ExecutorCreatedEvent {
  type: 'executor_created';
  executorIndex: number;
  executorKey: unknown;
}

export interface ExecutorStateChangedEvent {
  type: 'executor_state_changed';
  executorIndex: number;
  executorState: DevtoolsExecutorState;
}

export interface EventInterceptedEvent {
  type: 'event_intercepted';
  executorIndex: number;
  event: {
    type: string;
    payload: unknown;
  };
}
