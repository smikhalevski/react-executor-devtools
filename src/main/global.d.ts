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
      inspectedValue?: unknown;
    };
  }
}
