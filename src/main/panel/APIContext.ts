import { createContext, useContext } from 'react';
import type { ExecutorManager } from 'react-executor';
import { inspect, SOURCE_OBJECT } from '../inspect';
import { getOrCreateExecutorLineItemListExecutor } from './App';

export function createAPI(executorManager: ExecutorManager) {
  return {
    async getInspectionAt(type: 'key' | 'value' | 'reason', executorIndex: number, path: number[]) {
      // RPC latency
      await new Promise(resolve => setTimeout(resolve, 200));

      const previewsExecutor = getOrCreateExecutorLineItemListExecutor(executorManager);

      const executor = previewsExecutor.get().find(preview => preview.executorIndex === executorIndex);

      let inspection = executor!.keyInspection;

      for (const index of path) {
        inspection = inspection.children![index];
      }

      inspection.children = inspect(inspection[SOURCE_OBJECT], 1).children;

      previewsExecutor.resolve(previewsExecutor.get());
    },
  };
}

const APIContext = createContext<ReturnType<typeof createAPI> | null>(null);

export const APIProvider = APIContext.Provider;

export function useAPI(): ReturnType<typeof createAPI> {
  const api = useContext(APIContext);

  if (api === null) {
    throw new Error('API expected');
  }
  return api;
}
