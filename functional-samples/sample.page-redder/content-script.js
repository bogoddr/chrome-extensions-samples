// This script runs automatically on pages matching the URL patterns in manifest.json

// Function to update opacity of saved songs
function updateSavedSongsOpacity() {
  chrome.storage.local.get(['songDataDict'], (result) => {
    const songDataDict = result.songDataDict || {};

    // Get all .div-jacket elements
    const jacketElements = document.querySelectorAll('.div-jacket');

    jacketElements.forEach(jacket => {
      const id = jacket.id;

      // Parse the ID format: "div-jacket-{songId}-{diffParam}"
      const match = id.match(/^div-jacket-(.+)-(\d+)$/);

      if (match) {
        const songId = match[1];
        const diffParam = match[2];

        // Check if this song+diff combo exists in storage and is hidden
        const song = Object.values(songDataDict).find(
          song => song.songId === songId && song.diffParam === diffParam
        );

        if (song && song.hidden) {
          jacket.style.opacity = '0.075';
        } else {
          // Reset opacity if not hidden
          jacket.style.opacity = '';
        }
      }
    });

    console.log(`Updated opacity for ${jacketElements.length} jacket elements`);
  });
}

// Log all storage data on page load
chrome.storage.local.get(null, (result) => {
  console.log('=== All Storage Data ===');
  console.log(result);
  if (result.songDataDict) {
    console.log('Song data dictionary:', result.songDataDict);
    console.log('Total songs stored:', Object.keys(result.songDataDict).length);
  } else {
    console.log('No song data stored yet');
  }
  console.log('=======================');

  // Update opacity on page load
  updateSavedSongsOpacity();
});

function addButtonToSongInfo() {
  document.body.style.backgroundColor = 'blue';
  console.log('Content script loaded');

  const songInfoContainer = document.querySelector('#song-info-container');

  if (songInfoContainer) {
    // Create the save button
    const button = document.createElement('button');
    button.id = 'custom-action-button';
    button.textContent = 'Toggle Hidden';
    button.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer;';

    // Add click handler to toggle song info
    button.addEventListener('click', async () => {
      const songTitle = document.querySelector('#song-title')?.innerText || '';
      const songDiff = document.querySelector('#song-diff')?.innerText || '';
      const songDetailsLink = document.querySelector('#song-details-link')?.href || '';

      // Parse the song ID and diff parameter from the href
      let songId = '';
      let diffParam = '';

      if (songDetailsLink) {
        // Extract ID after "song_details/"
        const idMatch = songDetailsLink.match(/\/song_details\/([^?]+)/);
        if (idMatch) {
          songId = idMatch[1];
        }

        // Extract diff parameter
        const urlParams = new URLSearchParams(songDetailsLink.split('?')[1]);
        diffParam = urlParams.get('diff') || '';
      }

      // Create the key by concatenating title and difficulty
      const key = songTitle + songDiff;

      // Get existing song data dictionary
      chrome.storage.local.get(['songDataDict'], (result) => {
        const songDataDict = result.songDataDict || {};

        // Toggle: if exists, toggle hidden flag; if not, add it
        if (songDataDict[key]) {
          // Toggle the hidden flag
          songDataDict[key].hidden = !songDataDict[key].hidden;
          console.log(`Toggled hidden flag for key: ${key}, hidden: ${songDataDict[key].hidden}`);

          // Visual feedback
          button.textContent = songDataDict[key].hidden ? 'Hidden!' : 'Shown!';
          setTimeout(() => {
            button.textContent = 'Toggle Hidden';
          }, 300);
        } else {
          // Add the entry with hidden = true
          songDataDict[key] = {
            title: songTitle,
            difficulty: songDiff,
            songId: songId,
            diffParam: diffParam,
            hidden: true,
            timestamp: Date.now(),
            // Add any other data you want to store here
          };
          console.log('Saved song info with key:', key);
          console.log('Song ID:', songId);
          console.log('Diff param:', diffParam);
          console.log('Hidden:', true);

          // Visual feedback for saving
          button.textContent = 'Saved!';
          setTimeout(() => {
            button.textContent = 'Toggle Hidden';
          }, 300);
        }

        // Save updated dictionary
        chrome.storage.local.set({ songDataDict }, () => {
          console.log('Total songs stored:', Object.keys(songDataDict).length);

          // Update opacity after toggling
          updateSavedSongsOpacity();
        });
      });
    });

    // Create the clear button
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-storage-button';
    clearButton.textContent = 'Clear All Data';
    clearButton.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer; background-color: #ff4444; color: white;';

    // Add click handler to clear all storage
    clearButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all stored song data?')) {
        chrome.storage.local.clear(() => {
          console.log('All storage data cleared!');
          clearButton.textContent = 'Cleared!';
          setTimeout(() => {
            clearButton.textContent = 'Clear All Data';
          }, 1000);
        });
      }
    });

    // Create the export button
    const exportButton = document.createElement('button');
    exportButton.id = 'export-button';
    exportButton.textContent = 'Export Database';
    exportButton.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer; background-color: #4CAF50; color: white;';

    // Add click handler to export data
    exportButton.addEventListener('click', () => {
      chrome.storage.local.get(['songDataDict'], (result) => {
        const songDataDict = result.songDataDict || {};

        // Convert to JSON
        const jsonData = JSON.stringify(songDataDict, null, 2);

        // Create blob and download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `song-database-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Database exported');
        exportButton.textContent = 'Exported!';
        setTimeout(() => {
          exportButton.textContent = 'Export Database';
        }, 1000);
      });
    });

    // Create the import button
    const importButton = document.createElement('button');
    importButton.id = 'import-button';
    importButton.textContent = 'Import Database';
    importButton.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer; background-color: #2196F3; color: white;';

    // Add click handler to import data
    importButton.addEventListener('click', () => {
      // Create hidden file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target.result);

            // Merge with existing data (imported data takes precedence)
            chrome.storage.local.get(['songDataDict'], (result) => {
              const existingData = result.songDataDict || {};
              const mergedData = { ...existingData, ...importedData };

              chrome.storage.local.set({ songDataDict: mergedData }, () => {
                console.log('Database imported and merged');
                console.log('Total songs after import:', Object.keys(mergedData).length);

                // Update opacity after import
                updateSavedSongsOpacity();

                importButton.textContent = 'Imported!';
                setTimeout(() => {
                  importButton.textContent = 'Import Database';
                }, 1000);
              });
            });
          } catch (error) {
            console.error('Error parsing JSON file:', error);
            alert('Error importing file. Please ensure it is a valid JSON file.');
          }
        };
        reader.readAsText(file);
      });

      fileInput.click();
    });

    // Add all buttons to the container
    songInfoContainer.appendChild(button);
    songInfoContainer.appendChild(clearButton);
    songInfoContainer.appendChild(exportButton);
    songInfoContainer.appendChild(importButton);
  }
}

// Run the function when the page loads
addButtonToSongInfo();
