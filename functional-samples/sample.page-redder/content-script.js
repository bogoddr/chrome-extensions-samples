// This script runs automatically on pages matching the URL patterns in manifest.json

// Add custom CSS to the page
const style = document.createElement('style');
style.textContent = `
#song-info {
  margin:0 !important;
}
  #song-title {
    font-size: 15px !important;
  }
  #song-diff {
    font-size: 12px !important;
  }
`;
document.head.appendChild(style);

// Function to update opacity of saved songs
function updateSavedSongsOpacity() {
  chrome.storage.local.get(['songDataDict'], (result) => {
    const songDataDict = result.songDataDict || {};

    // Get all .div-jacket elements
    const jacketElements = document.querySelectorAll('.div-jacket');

    // Count total songs on page using .img-jacket elements
    const totalSongsOnPage = document.querySelectorAll('.div-jacket').length;

    // Track hidden songs on current page
    let hiddenSongsOnPage = 0;

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
          hiddenSongsOnPage++;
          jacket.style.opacity = '0.075';
        } else {
          // Reset opacity if not hidden or not in storage
          jacket.style.opacity = '';
        }
      }
    });

    // Update counter display
    const counter = document.getElementById('song-counter');
    if (counter) {
      counter.textContent = `${hiddenSongsOnPage} / ${totalSongsOnPage} complete`;
    }

    console.log(`Updated opacity for ${jacketElements.length} jacket elements`);
    console.log(`Hidden songs on page: ${hiddenSongsOnPage} / Total songs on page: ${totalSongsOnPage}`);
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
    // Create counter element
    const counter = document.createElement('div');
    counter.id = 'song-counter';
    counter.style.cssText = 'margin: 10px; padding: 10px; background-color: #333; color: white; border-radius: 4px; font-weight: bold; text-align: center; font-size: 16px;';
    counter.textContent = 'Hidden: 0 / Total: 0';
    songInfoContainer.appendChild(counter);

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

    // Create the view data button
    const viewButton = document.createElement('button');
    viewButton.id = 'view-data-button';
    viewButton.textContent = 'View All Data';
    viewButton.style.cssText = 'margin: 10px; padding: 10px 20px; cursor: pointer; background-color: #9C27B0; color: white;';

    // Add click handler to open data viewer
    viewButton.addEventListener('click', () => {
      chrome.storage.local.get(['songDataDict'], (result) => {
        const songDataDict = result.songDataDict || {};
        openDataViewer(songDataDict);
      });
    });

    // Add all buttons to the container
    songInfoContainer.appendChild(button);
    songInfoContainer.appendChild(clearButton);
    songInfoContainer.appendChild(exportButton);
    songInfoContainer.appendChild(importButton);
    songInfoContainer.appendChild(viewButton);
  }
}

// Function to open data viewer window
function openDataViewer(songDataDict) {
  // Group songs by difficulty level
  const songsByDifficulty = {};

  Object.entries(songDataDict).forEach(([key, song]) => {
    // Extract difficulty level number from difficulty string (e.g., "ESP 15" or "CSP 19.99" -> "15" or "19")
    const diffMatch = song.difficulty.match(/(\d+)(?:\.\d+)?$/);
    const diffLevel = diffMatch ? diffMatch[1] : 'Unknown';

    if (!songsByDifficulty[diffLevel]) {
      songsByDifficulty[diffLevel] = [];
    }

    songsByDifficulty[diffLevel].push(song);
  });

  // Sort difficulty levels numerically
  const sortedDiffLevels = Object.keys(songsByDifficulty).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(a) - parseInt(b);
  });

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'data-viewer-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  // Create modal window
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    width: 80%;
    max-width: 1200px;
    height: 80%;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px;
    background: #333;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <h2 style="margin: 0;">Song Database (${Object.keys(songDataDict).length} songs)</h2>
    <button id="close-viewer" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close</button>
  `;

  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.style.cssText = `
    display: flex;
    background: #f0f0f0;
    overflow-x: auto;
    border-bottom: 2px solid #ccc;
  `;

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  `;

  // Create tabs and content
  sortedDiffLevels.forEach((diffLevel, index) => {
    const songs = songsByDifficulty[diffLevel];

    // Create tab button
    const tab = document.createElement('button');
    tab.className = 'difficulty-tab';
    tab.dataset.difficulty = diffLevel;
    tab.textContent = `Level ${diffLevel} (${songs.length})`;
    tab.style.cssText = `
      padding: 15px 25px;
      border: none;
      background: ${index === 0 ? '#2196F3' : '#f0f0f0'};
      color: ${index === 0 ? 'white' : '#333'};
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      white-space: nowrap;
      transition: background 0.3s;
    `;

    tab.addEventListener('click', () => {
      // Update tab styles
      document.querySelectorAll('.difficulty-tab').forEach(t => {
        t.style.background = '#f0f0f0';
        t.style.color = '#333';
      });
      tab.style.background = '#2196F3';
      tab.style.color = 'white';

      // Show corresponding content
      document.querySelectorAll('.difficulty-content').forEach(c => {
        c.style.display = 'none';
      });
      document.getElementById(`content-${diffLevel}`).style.display = 'block';
    });

    tabsContainer.appendChild(tab);

    // Create content for this difficulty
    const content = document.createElement('div');
    content.id = `content-${diffLevel}`;
    content.className = 'difficulty-content';
    content.style.display = index === 0 ? 'block' : 'none';

    // Sort songs by title
    songs.sort((a, b) => a.title.localeCompare(b.title));

    // Create table
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;

    table.innerHTML = `
      <thead>
        <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
          <th style="padding: 12px; text-align: left;">Title</th>
          <th style="padding: 12px; text-align: left;">Difficulty</th>
          <th style="padding: 12px; text-align: left;">Hidden</th>
          <th style="padding: 12px; text-align: left;">Song ID</th>
          <th style="padding: 12px; text-align: left;">Diff Param</th>
          <th style="padding: 12px; text-align: left;">Date Added</th>
        </tr>
      </thead>
      <tbody>
        ${songs.map((song, i) => `
          <tr style="border-bottom: 1px solid #eee; ${i % 2 === 0 ? 'background: #fafafa;' : ''}">
            <td style="padding: 12px;">${song.title}</td>
            <td style="padding: 12px;">${song.difficulty}</td>
            <td style="padding: 12px;">
              <span style="padding: 4px 8px; border-radius: 4px; ${song.hidden ? 'background: #ff9800; color: white;' : 'background: #4CAF50; color: white;'}">
                ${song.hidden ? 'Yes' : 'No'}
              </span>
            </td>
            <td style="padding: 12px; font-family: monospace; font-size: 11px;">${song.songId || 'N/A'}</td>
            <td style="padding: 12px;">${song.diffParam || 'N/A'}</td>
            <td style="padding: 12px;">${new Date(song.timestamp).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    content.appendChild(table);
    contentContainer.appendChild(content);
  });

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(tabsContainer);
  modal.appendChild(contentContainer);
  overlay.appendChild(modal);

  // Add close handler
  header.querySelector('#close-viewer').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // Add to page
  document.body.appendChild(overlay);
}

// Run the function when the page loads
addButtonToSongInfo();
