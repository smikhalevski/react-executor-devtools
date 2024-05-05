export interface RPCServer<Tag extends string, Methods extends { [method: string]: (...params: any[]) => any }> {
  readonly tag: Tag;
  readonly methods: Methods;
}

export type RPCClient<Methods> = {
  [K in keyof Methods]: Methods[K] extends (...params: infer Params) => infer Result
    ? undefined | void extends Result
      ? { put(...params: Params): void }
      : { get(...params: Params): Promise<Awaited<Result>> }
    : never;
};

export interface RPCRequest {
  tag: string;
  id?: number;
  method: string;
  params: any[];
}

export interface RPCResponse {
  tag: string;
  id: number;
  result: any;
}

export function isRPCRequest(message: unknown): message is RPCRequest {
  return message !== null && typeof message === 'object' && 'method' in message;
}

export function isRPCResponse(message: unknown): message is RPCResponse {
  return message !== null && typeof message === 'object' && 'id' in message && !('method' in message);
}

export interface RPCDispatcher {
  put(request: RPCRequest): void;

  get(request: RPCRequest): Promise<RPCResponse>;
}

export function createRPCClient<Server extends RPCServer<any, any>>(
  tag: Server['tag'],
  dispatcher: RPCDispatcher
): RPCClient<Server['methods']> {
  return new Proxy<any>(
    {},
    {
      get(client, method) {
        if (typeof method !== 'string') {
          return undefined;
        }

        return (client[method] ||= {
          put(...params: any[]) {
            dispatcher.put({ tag, method, params });
          },

          get(...params: any[]) {
            return dispatcher.get({ tag, id: 0, method, params }).then(response => response.result);
          },
        });
      },
    }
  );
}

export function createWindowRPCServer<
  Tag extends string,
  Methods extends { [method: string]: (...params: any[]) => any },
>(tag: Tag, methods: Methods): RPCServer<Tag, Methods> {
  window.addEventListener('message', event => {
    const request = event.data;

    if (isRPCRequest(request) && request.tag === tag) {
      const result = methods[request.method](...request.params);

      if (request.id !== undefined) {
        Promise.resolve(result).then(result => {
          window.postMessage({ tag, id: request.id, result }, '*');
        });
      }
    }
  });

  return { tag, methods };
}

export function createWindowRPCClient<Server extends RPCServer<any, any>>(
  tag: Server['tag']
): RPCClient<Server['methods']> {
  return createRPCClient(tag, {
    put(request) {
      window.postMessage(request, '*');
    },

    get(request) {
      return new Promise(resolve => {
        const messageListener = (event: MessageEvent) => {
          const response = event.data;

          if (isRPCResponse(response) && response.tag === tag && response.id === request.id) {
            window.removeEventListener('message', messageListener);
            resolve(response);
          }
        };
        window.addEventListener('message', messageListener);
        window.postMessage(request, '*');
      });
    },
  });
}

export function createChromeRPCServer<
  Tag extends string,
  Methods extends { [method: string]: (...params: any[]) => any },
>(tag: Tag, methods: Methods): RPCServer<Tag, Methods> {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (sender.id === chrome.runtime.id && isRPCRequest(request) && request.tag === tag) {
      const result = methods[request.method](...request.params);

      if (request.id !== undefined) {
        Promise.resolve(result).then(result => {
          sendResponse({ tag, id: request.id, result });
        });
        return true;
      }
    }
  });

  return { tag, methods };
}

export function createChromeRPCClient<Server extends RPCServer<any, any>>(
  tag: Server['tag']
): RPCClient<Server['methods']> {
  return createRPCClient(tag, {
    put(request) {
      chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, request);
    },

    get(request) {
      return chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, request);
    },
  });
}

export function relayRPC(): void {
  window.addEventListener('message', event => {
    const request = event.data;

    if (isRPCRequest(request)) {
      chrome.runtime.sendMessage(request).then(response => {
        if (response !== undefined) {
          window.postMessage(response, '*');
        }
      });
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !isRPCRequest(request)) {
      return;
    }

    if (request.id === undefined) {
      window.postMessage(request, '*');
    }

    const messageListener = (event: MessageEvent) => {
      const response = event.data;

      if (isRPCResponse(response) && response.id === request.id) {
        window.removeEventListener('message', messageListener);
        sendResponse(response);
      }
    };

    window.addEventListener('message', messageListener);
    window.postMessage(request, '*');
    return true;
  });
}
