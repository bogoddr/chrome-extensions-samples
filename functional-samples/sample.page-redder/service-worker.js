function addButtonToSongInfo() {
  document.body.style.backgroundColor = 'blue';
  console.log('test')

  const songInfoContainer = document.querySelector('#song-info-container');

  if (songInfoContainer) {
    // Create the button
    const button = document.createElement('button');
    button.id = 'custom-action-button';
    button.textContent = 'Save Song Info';
    button.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer;';

    // Add click handler to save song info
    button.addEventListener('click', async () => {
      const songTitle = document.querySelector('#song-title')?.innerText || '';
      const songDiff = document.querySelector('#song-diff')?.innerText || '';

      // Create the key by concatenating title and difficulty
      const key = songTitle + songDiff;

      console.log('Saving song info with key:', key);

      // Get existing song data dictionary
      chrome.storage.local.get(['songDataDict'], (result) => {
        const songDataDict = result.songDataDict || {};

        // Store arbitrary data for this song (customize this as needed)
        songDataDict[key] = {
          title: songTitle,
          difficulty: songDiff,
          timestamp: Date.now(),
          // Add any other data you want to store here
        };

        // Save updated dictionary
        chrome.storage.local.set({ songDataDict }, () => {
          console.log('Song data saved:', songDataDict[key]);
          console.log('Total songs stored:', Object.keys(songDataDict).length);

          // Visual feedback
          button.textContent = 'Saved!';
          setTimeout(() => {
            button.textContent = 'Save Song Info';
          }, 1000);
        });
      });
    });

    // Add the button to the container
    songInfoContainer.appendChild(button);
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.includes('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: addButtonToSongInfo
    });
  }
});
