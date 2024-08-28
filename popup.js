document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const historySearchInput = document.getElementById('historySearchInput');
  const deleteHistoryButton = document.getElementById('deleteHistoryButton');
  const optInHistoryCheckbox = document.getElementById('optInHistory');
  const useWhitelistCheckbox = document.getElementById('useWhitelist');
  const enableBlacklistCheckbox = document.getElementById('enableBlacklist');
  const list = document.getElementById('bangsList');
  const historyList = document.getElementById('historyList');
  const allBangsSection = document.getElementById('allbangs');
  const bangsHistorySection = document.getElementById('bangshistory');
  const settingsSection = document.getElementById('settings');
  const blacklistInput = document.getElementById('blacklistInput');
  const whitelistInput = document.getElementById('whitelistInput');
  const addToBlacklistButton = document.getElementById('addToBlacklistButton');
  const addToWhitelistButton = document.getElementById('addToWhitelistButton');
  const blacklistElement = document.getElementById('blacklist');
  const whitelistElement = document.getElementById('whitelist');
  const navLinks = document.querySelectorAll('nav a');
  const datalist = document.getElementById('bangsDatalist');

  let bangs = [];

  fetch(chrome.runtime.getURL('bangs.json'))
    .then(response => response.json())
    .then(data => {
      bangs = data;
      populateDatalist(bangs); // Populate the datalist for autocomplete

      chrome.storage.local.get(
        { bangUsageCounts: {}, bangHistory: [], historyOptIn: false, blacklist: [], whitelist: [], useWhitelist: false, enableBlacklist: false },
        (result) => {
          const bangUsageCounts = result.bangUsageCounts;
          const bangHistory = result.bangHistory;
          const historyOptIn = result.historyOptIn;
          const blacklist = result.blacklist;
          const whitelist = result.whitelist;
          const useWhitelist = result.useWhitelist;
          const enableBlacklist = result.enableBlacklist;

          optInHistoryCheckbox.checked = historyOptIn;
          useWhitelistCheckbox.checked = useWhitelist;
          enableBlacklistCheckbox.checked = enableBlacklist;

          bangs.forEach(bang => {
            bang.usageCount = bangUsageCounts[bang.bang] || 0;
          });

          displayBangs(bangs);

          if (historyOptIn) {
            displayHistory(bangHistory);
          }

          searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const filteredBangs = bangs.filter(bang => 
              bang.title.toLowerCase().includes(query) || 
              bang.bang.toLowerCase().includes(query)
            );
            displayBangs(filteredBangs);
          });

          historySearchInput.addEventListener('input', handleSearch);

          deleteHistoryButton.addEventListener('click', deleteHistory);

          optInHistoryCheckbox.addEventListener('change', (event) => {
            chrome.storage.local.set({ historyOptIn: event.target.checked });
          });

          useWhitelistCheckbox.addEventListener('change', (event) => {
            chrome.storage.local.set({ useWhitelist: event.target.checked });
          });

          enableBlacklistCheckbox.addEventListener('change', (event) => {
            chrome.storage.local.set({ enableBlacklist: event.target.checked });
          });

          addToBlacklistButton.addEventListener('click', () => addToList('blacklist', blacklistInput, blacklistElement));
          addToWhitelistButton.addEventListener('click', () => addToList('whitelist', whitelistInput, whitelistElement));

          displayList(blacklist, blacklistElement, 'blacklist');
          displayList(whitelist, whitelistElement, 'whitelist');
        }
      );
    })
    .catch(error => console.error('Failed to fetch bangs.json:', error));

  function formatUsageCount(count) {
    switch (true) {
      case count >= 1e18:
        return (count / 1e18).toFixed(1) + 'q';
      case count >= 1e15:
        return (count / 1e15).toFixed(1) + 'p';
      case count >= 1e12:
        return (count / 1e12).toFixed(1) + 't';
      case count >= 1e9:
        return (count / 1e9).toFixed(1) + 'b';
      case count >= 1e6:
        return (count / 1e6).toFixed(1) + 'm';
      case count >= 1e3:
        return (count / 1e3).toFixed(1) + 'k';
      default:
        return count.toString();
    }
  }

  function displayBangs(bangs) {
    list.innerHTML = '';

    const sortedBangs = [...bangs].sort((a, b) => b.usageCount - a.usageCount);
    chrome.storage.local.get('historyOptIn', (result) => {
      const historyOptIn = result.historyOptIn;

      sortedBangs.forEach(bang => {
        const listItem = document.createElement('li');
        const usageCount = bang.usageCount || 0;
        const formattedCount = formatUsageCount(usageCount);

        const bangTitle = document.createElement('span');
        bangTitle.className = 'bang-title';
        bangTitle.title = `${bang.bang} - ${bang.title}`;
        bangTitle.textContent = `${bang.bang} - ${bang.title}`;

        listItem.appendChild(bangTitle);

        if (historyOptIn) {
          const usageCountSpan = document.createElement('span');
          usageCountSpan.className = 'usage-count';
          usageCountSpan.title = `You used this bang ${usageCount} times`;
          usageCountSpan.textContent = formattedCount;
          listItem.appendChild(usageCountSpan);
        }
        list.appendChild(listItem);
      });
    });
  }

  function groupHistoryByDate(history) {
    return history.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});
  }
  
  function displayHistory(history) {
    historyList.innerHTML = '';
  
    const groupedHistory = groupHistoryByDate(history);
    Object.keys(groupedHistory).forEach(date => {
      const dateLabel = formatDateLabel(date);
      const dateHeader = document.createElement('h3');
      dateHeader.textContent = dateLabel;
      dateHeader.title = new Date(date).toLocaleDateString();
      historyList.appendChild(dateHeader);
  
      groupedHistory[date].forEach(item => {
        const listItem = document.createElement('li');
        const hourDate = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
        listItem.classList.add('history-item');
        listItem.title = new Date(item.timestamp).toLocaleString();
        const historyDateDiv = document.createElement('div');
        historyDateDiv.className = 'history-date';
        historyDateDiv.textContent = hourDate;

        const bangTitleDiv = document.createElement('div');
        bangTitleDiv.textContent = `${item.bang.title} (${item.bang.bang})`;

        const originalQueryDiv = document.createElement('div');
        originalQueryDiv.textContent = item.originalQuery;

        listItem.appendChild(historyDateDiv);
        listItem.appendChild(bangTitleDiv);
        listItem.appendChild(originalQueryDiv);
        historyList.appendChild(listItem);
      });
    });
  }
  
  function formatDateLabel(date) {
    const today = new Date();
    const historyDate = new Date(date);
  
    // Convert both dates to their local date string representation
    const todayDateString = today.toLocaleDateString();
    const historyDateString = historyDate.toLocaleDateString();
  
    // Compare the date strings to determine the label
    if (todayDateString === historyDateString) {
      return 'Today';
    } else if (new Date(todayDateString) - new Date(historyDateString) === 86400000) {
      return 'Yesterday';
    } else if ((new Date(todayDateString) - new Date(historyDateString)) / (1000 * 60 * 60 * 24) <= 7) {
      return 'A week ago';
    } else {
      return historyDateString;
    }
  }

  function handleSearch() {
    const query = historySearchInput.value.toLowerCase();
    chrome.storage.local.get('bangHistory', (result) => {
      const filteredHistory = result.bangHistory.filter(item => 
        item.bang.title.toLowerCase().includes(query) || 
        item.bang.bang.toLowerCase().includes(query) || 
        item.originalQuery.toLowerCase().includes(query) ||
        new Date(item.timestamp).toLocaleString().toLowerCase().includes(query)
      );
      displayHistory(filteredHistory);
    });
  }

  function deleteHistory() {
    if (confirm('Are you sure you want to delete the history?')) {
      chrome.storage.local.set({ bangHistory: [] }, () => {
        displayHistory([]);
      });
    }
  }

  function handleNavigation(event) {
    event.preventDefault();
    const targetId = event.target.getAttribute('href').substring(1);
    allBangsSection.style.display = targetId === 'allbangs' ? 'block' : 'none';
    bangsHistorySection.style.display = targetId === 'bangshistory' ? 'block' : 'none';
    settingsSection.style.display = targetId === 'settings' ? 'block' : 'none';
  }

  function displayList(list, element, listName) {
    element.innerHTML = '';
    list.forEach(bang => {
      const listItem = document.createElement('li');
      const bangText = document.createTextNode(bang);

      const xButton = document.createElement('button');
      xButton.className = 'x-button';
      xButton.dataset.list = listName;
      xButton.dataset.bang = bang;
      xButton.textContent = 'X';

      listItem.appendChild(bangText);
      listItem.appendChild(xButton);
      element.appendChild(listItem);
    });

    document.querySelectorAll('.x-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const bang = event.target.getAttribute('data-bang');
        const listName = event.target.getAttribute('data-list');
        removeBang(listName, bang);
      });
    });
  }

  function addToList(listName, inputElement, listElement) {
    const bang = inputElement.value.trim();
  
    if (bang === '') return;
  
    const validBang = bangs.find(item => item.bang === bang);
  
    if (!validBang) {
      alert('Invalid bang name. Please select a valid bang from the autocomplete list.');
      return;
    }

    chrome.storage.local.get({ [listName]: [] }, (result) => {
      const list = result[listName];
      if (!list.includes(bang)) {
        list.push(bang);
        chrome.storage.local.set({ [listName]: list }, () => {
          displayList(list, listElement, listName);
        });
      }
    });
  }

  function removeBang(listName, bang) {
    chrome.storage.local.get({ [listName]: [] }, (result) => {
      const list = result[listName];
      const index = list.indexOf(bang);
      if (index > -1) {
        list.splice(index, 1);
        chrome.storage.local.set({ [listName]: list }, () => {
          displayList(list, listElement, listName);
        });
      }
    });
  }

  function populateDatalist(bangs) {
    datalist.innerHTML = '';
    bangs.forEach(bang => {
      const option = document.createElement('option');
      option.value = bang.bang;
      datalist.appendChild(option);
    });
  }

  // Handle navigation clicks
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavigation);
  });
});