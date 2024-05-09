window.addEventListener('message', event => {
  if (event.data?.source === 'react_executor_devtools') {
    chrome.runtime.sendMessage(event.data);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id === chrome.runtime.id) {
    window.postMessage(message);
  }
});
