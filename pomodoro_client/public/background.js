chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel
  if (chrome.sidePanel) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
    console.error('Side panel API is not available. Please use Chrome 114 or later.');
  }
});
