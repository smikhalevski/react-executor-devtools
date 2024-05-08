import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExecutorManager, ExecutorManagerProvider } from 'react-executor';
import { inspect } from '../inspect';
import { APIProvider, createAPI } from './APIContext';
import { App, getOrCreateExecutorLineItemListExecutor } from './App';

const root = ReactDOM.createRoot(document.getElementById('container')!);

const executorManager = new ExecutorManager({
  plugins: [
    executor => {
      executor.subscribe(event => {
        // console.log(event.target.key, event.type);
      });
    },
  ],
});

const api = createAPI(executorManager);

const previewsExecutor = getOrCreateExecutorLineItemListExecutor(executorManager);

const qqq = new Map().set('aaa', 111).set('bbb', 222).set('ccc', { ddd: 333 }).set('eee', 444);

qqq.set('fff', qqq);

previewsExecutor.resolve([
  {
    executorIndex: 0,
    keyInspection: inspect(qqq, 0, { maxProperties: 3 }),
  },
  {
    executorIndex: 1,
    keyInspection: inspect(['user', 222]),
  },
  {
    executorIndex: 2,
    keyInspection: inspect(['user', 333]),
  },
]);

root.render(
  // <React.StrictMode>
  <ExecutorManagerProvider value={executorManager}>
    <APIProvider value={api}>
      <App />
    </APIProvider>
  </ExecutorManagerProvider>
  // </React.StrictMode>
);
