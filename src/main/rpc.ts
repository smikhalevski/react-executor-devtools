export type RequestHandler<Request, Response> = (request: Request, sendResponse: (response: Response) => void) => void;

export interface RPC {
  sendRequest<Request, Response>(request: Request): Promise<Response>;

  sendVoidRequest<Request>(request: Request): void;

  addRequestHandler<Request, Response>(handler: RequestHandler<Request, Response>): () => void;
}

const MESSAGE_SOURCE = 'react_executor_devtools';

const enum MessageType {
  REQUEST,
  VOID_REQUEST,
  RESPONSE,
}

function noop() {}

interface Serializer {
  stringify(value: unknown): string;

  parse(serializedValue: string): any;
}

const serializer: Serializer = JSON;

type RPCMessage = [source: string, type: MessageType, requestId: number, data: string];

function isRPCMessage(message: unknown): message is RPCMessage {
  return Array.isArray(message) && message[0] === MESSAGE_SOURCE;
}

export function startRPCRelay(): void {
  const clientResolvers = new Map<number, (message: RPCMessage) => void>();
  const serverResolvers = new Map<number, (message: RPCMessage) => void>();

  window.addEventListener('message', event => {
    if (event.source !== window || !isRPCMessage(event.data)) {
      return;
    }

    const [, type, requestId] = event.data;

    if (type === MessageType.REQUEST) {
      clientResolvers.set(requestId, message => {
        clientResolvers.delete(requestId);
        window.postMessage(message);
      });
      chrome.runtime.sendMessage(event.data);
    }

    if (type === MessageType.RESPONSE) {
      serverResolvers.get(requestId)?.(event.data);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponseMessage) => {
    if (sender.id !== chrome.runtime.id || !isRPCMessage(message)) {
      return;
    }
    const [, type, requestId] = message;

    if (type === MessageType.REQUEST) {
      serverResolvers.set(requestId, message => {
        serverResolvers.delete(requestId);
        sendResponseMessage(message);
      });
      window.postMessage(message);
    }

    if (type === MessageType.RESPONSE) {
      clientResolvers.get(requestId)?.(message);
    }
  });
}

export function createClientRPC(): RPC {
  let requestCount = 0;

  const responseResolvers = new Map<number, (response: unknown) => void>();

  const requestHandlers: RequestHandler<any, any>[] = [];

  window.addEventListener('message', event => {
    if (event.source !== window || !isRPCMessage(event.data)) {
      return;
    }

    const [, type, requestId, data] = event.data;

    if (type === MessageType.RESPONSE) {
      responseResolvers.get(type)?.(serializer.parse(data));
      return;
    }

    let isResponseSent = false;

    const sendResponse =
      type === MessageType.VOID_REQUEST
        ? noop
        : (response: unknown) => {
            if (isResponseSent) {
              throw new Error('Response already sent');
            }
            isResponseSent = true;
            window.postMessage([MESSAGE_SOURCE, MessageType.RESPONSE, requestId, serializer.stringify(response)], '*');
          };

    const request = serializer.parse(data);

    for (const requestHandler of requestHandlers) {
      try {
        requestHandler(request, sendResponse);
      } catch (error) {
        // Trigger unhandled exception
        setTimeout(() => {
          throw error;
        }, 0);
      }
    }
  });

  return {
    sendRequest(request) {
      return new Promise<any>(resolve => {
        const requestId = requestCount++;

        responseResolvers.set(requestId, response => {
          responseResolvers.delete(requestId);
          resolve(response);
        });
        window.postMessage([MESSAGE_SOURCE, MessageType.REQUEST, requestId, serializer.stringify(request)], '*');
      });
    },

    sendVoidRequest(request) {
      window.postMessage([MESSAGE_SOURCE, MessageType.VOID_REQUEST, 0, serializer.stringify(request)], '*');
    },

    addRequestHandler(handler) {
      requestHandlers.push(handler);

      return () => {
        requestHandlers.splice(requestHandlers.indexOf(handler), 1);
      };
    },
  };
}

export function createServerRPC(): RPC {
  let requestCount = 0;

  return {
    sendRequest(request) {
      const message: RPCMessage = [MESSAGE_SOURCE, MessageType.REQUEST, requestCount++, serializer.stringify(request)];

      return chrome.tabs
        .sendMessage<RPCMessage, RPCMessage>(chrome.devtools.inspectedWindow.tabId, message)
        .then(message => serializer.parse(message[3]));
    },

    sendVoidRequest(request) {
      const message: RPCMessage = [MESSAGE_SOURCE, MessageType.REQUEST, requestCount++, serializer.stringify(request)];

      chrome.tabs.sendMessage<RPCMessage>(chrome.devtools.inspectedWindow.tabId, message);
    },

    addRequestHandler(handler) {
      const messageListener = (
        message: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponseMessage: (message?: unknown) => void
      ) => {
        if (sender.id !== chrome.runtime.id || !isRPCMessage(message)) {
          return;
        }

        handler(serializer.parse(message[3]), response => {
          sendResponseMessage([MESSAGE_SOURCE, MessageType.RESPONSE, message[2], serializer.stringify(response)]);
        });
      };

      chrome.runtime.onMessage.addListener(messageListener);

      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    },
  };
}
