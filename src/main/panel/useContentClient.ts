import { createContext, useContext } from 'react';
import type { InspectablePart } from '../content/types';

export interface ContentClient {
  startInspection(id: string): void;

  retryExecutor(id: string): void;

  invalidateExecutor(id: string): void;

  expandInspection(id: string, part: InspectablePart, path: number[]): void;
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
