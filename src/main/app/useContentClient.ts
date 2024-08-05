import { createContext, useContext } from 'react';
import type { ExecutorPart } from '../types';

/**
 * The client that abstracts the app from the underlying messaging mechanism.
 */
export interface ContentClient {
  /**
   * Notify that the executor was selected to be inspected and part inspections must be provided.
   *
   * @param executorId The ID of the inspected executor.
   */
  startInspection(executorId: string): void;

  /**
   * Open the definition of the inspected value, that is stored in the particular part of the executor at given path
   * inside the inspection.
   *
   * @param executorId The ID of the inspected executor.
   * @param part The executor part where the inspected value is stored.
   * @param path The path inside the inspection.
   */
  goToDefinition(executorId: string, part: ExecutorPart, path: number[]): void;

  /**
   * Start the executor debugging.
   *
   * @param executorId The ID of the inspected executor.
   */
  debugExecutor(executorId: string): void;

  /**
   * Retry the executor.
   *
   * @param executorId The ID of the executor.
   */
  retryExecutor(executorId: string): void;

  /**
   * Invalidate the executor.
   *
   * @param executorId The ID of the executor.
   */
  invalidateExecutor(executorId: string): void;

  /**
   * Abort the executor.
   *
   * @param executorId The ID of the executor.
   */
  abortExecutor(executorId: string): void;

  /**
   * Notify that properties of the value in the particular executor part at given index must be inspected.
   *
   * @param executorId The ID of the inspected executor.
   * @param part The executor part where the inspected value is stored.
   * @param path The path inside the inspection.
   */
  inspectChildren(executorId: string, part: ExecutorPart, path: number[]): void;
}

const ContentClientContext = createContext<ContentClient | null>(null);

export const ContentClientProvider = ContentClientContext.Provider;

/**
 * Returns the current content client.
 */
export function useContentClient(): ContentClient {
  const contentClient = useContext(ContentClientContext);

  if (contentClient === null) {
    throw new Error('ContentClientProvider expected');
  }
  return contentClient;
}
