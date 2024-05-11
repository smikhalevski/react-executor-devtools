import 'react';
import type { ExecutorPlugin } from 'react-executor';

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
  }
}
