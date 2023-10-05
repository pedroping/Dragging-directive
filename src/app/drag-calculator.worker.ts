/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  console.log(data)
  postMessage('Hello de volta caraio')
});
