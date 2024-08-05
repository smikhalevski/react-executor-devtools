import 'react';
import type { Executor, ExecutorPlugin } from 'react-executor';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

declare global {
  interface Window {
    __REACT_EXECUTOR_DEVTOOLS__: {
      plugin: ExecutorPlugin;

      /**
       * Used to open sources tab in devtools and reveal the location of the inspected value.
       */
      inspectedValue?: unknown;
    };

    /**
     * The executor that is being debugged. Populated when `'debug_executor'` command is sent by the devtools panel.
     */
    $executor?: Executor;
  }
}
