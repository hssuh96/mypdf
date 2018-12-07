chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.executeScript({
      file: 'content/main-content-extractor.js'
    }, () => {
      chrome.tabs.executeScript({
      file: 'content/content.js'
    });
  });
});
