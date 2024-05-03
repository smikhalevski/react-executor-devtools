import type { DevtoolsEvent, DevtoolsExecutor } from './types';

export function updateExecutorCache(executorsCache: Map<number, DevtoolsExecutor>, event: DevtoolsEvent): void {
  switch (event.type) {
    case 'executor_created':
      executorsCache.set(event.payload.executorIndex, {
        key: event.payload.executorKey,
        index: event.payload.executorIndex,
        state: {
          isFulfilled: true,
          isRejected: true,
          isInvalidated: true,
          value: undefined,
          reason: undefined,
          timestamp: -1,
        },
        events: [],
      });
      break;

    case 'event_intercepted':
      executorsCache.get(event.payload.executorIndex)!.events.push(event.payload.event);
      break;

    case 'executor_state_changed':
      executorsCache.get(event.payload.executorIndex)!.state = event.payload.executorState;
      break;
  }
}
