import { createContext, useContext } from 'react';
import type { InspectionPart } from '../types';

export interface ContentClient {
  startInspection(id: string): void;

  goToDefinition(id: string, part: InspectionPart, path: number[]): void;

  retryExecutor(id: string): void;

  invalidateExecutor(id: string): void;

  abortExecutor(id: string): void;

  expandInspection(id: string, part: InspectionPart, path: number[]): void;
}

const ContentClientContext = createContext<ContentClient | null>(null);

export const ContentClientProvider = ContentClientContext.Provider;

export function useContentClient(): ContentClient {
  const contentClient = useContext(ContentClientContext);

  if (contentClient === null) {
    throw new Error('ContentClientProvider expected');
  }
  return contentClient;
}
