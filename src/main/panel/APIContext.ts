import { createContext, useContext } from 'react';
import type { ExecutorManager } from 'react-executor';
import { inspect, SOURCE_OBJECT } from '../inspect';
import { getOrCreatePreviewsExecutor } from './App';
import type { Qualifier } from './InspectionView';

export function createAPI(executorManager: ExecutorManager) {
  return {
    async getKeyInspectionAt(qualifier: Qualifier, path: number[]) {
      // RPC latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      const previewsExecutor = getOrCreatePreviewsExecutor(executorManager);

      const executor = previewsExecutor.get().find(preview => preview.executorIndex === qualifier.executorIndex);

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
