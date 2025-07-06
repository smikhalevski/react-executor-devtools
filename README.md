# react-executor-devtools

Devtools browser extension for [React Executor](https://github.com/smikhalevski/react-executor).

[Install the extension](https://chromewebstore.google.com/detail/react-executor-devtools/achlflelpafnlpepfpfhildkahbfhgjc)
from the Chrome Web Store and try it live with
[the example project](https://stackblitz.com/edit/react-executor-todo-app?file=README.md).

<br/>

<p align="center">
<img alt="React Executor Devtools Screenshot" src="./assets/screenshot.png" width="640"/>
</p>

## Running the extension locally

To build the extension locally and add it to the browser: 

1. Clone this repository.
2. Install dependencies and build sources: 

```shell
npm ci
npm run build
```

3. Load the created `./build` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
4. Navigate to a webpage and open the devtools window.
5. Navigate to the new devtools panel named "Executors".

For development purposes, you can start the extension as a standalone app that uses a mocked data:

```shell
npm start
```
