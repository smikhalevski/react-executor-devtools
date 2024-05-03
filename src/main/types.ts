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

export type DevtoolsEvent = ExecutorCreatedEvent | ExecutorStateChangedEvent | EventInterceptedEvent;

export interface ExecutorCreatedEvent {
  type: 'executor_created';
  payload: {
    executorIndex: number;
    executorKey: unknown;
  };
}

export interface ExecutorStateChangedEvent {
  type: 'executor_state_changed';
  payload: {
    executorIndex: number;
    executorState: DevtoolsExecutorState;
  };
}

export interface EventInterceptedEvent {
  type: 'event_intercepted';
  payload: {
    executorIndex: number;
    event: {
      type: string;
      payload: unknown;
    };
  };
}
