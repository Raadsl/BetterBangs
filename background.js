// background.js
// Fetch bangs.json from local extension files.
let bangs = [{ "bang": "!g", "title": "Google", "url": "https://encrypted.google.com/search?hl=en&q={{{s}}}" }]; //for if it fails at least let google work

fetch(chrome.runtime.getURL('bangs.json'))
  .then((response) => response.json())
  .then((data) => {
    bangs = data.slice().sort((a, b) => b.bang.length - a.bang.length); // sort on bang length in descending order

    // Initialize usage counts in storage if not already present
    chrome.storage.local.get({ bangUsageCounts: {} }, (result) => {
      const bangUsageCounts = result.bangUsageCounts;
      bangs.forEach(bang => {
        if (!bangUsageCounts[bang.bang]) {
          bangUsageCounts[bang.bang] = 0;
        }
      });
      chrome.storage.local.set({ bangUsageCounts });
    });
  })
  .catch((error) => console.error('Failed to fetch bangs.json:', error));

// Function to get the search query from a URL
function getSearchQuery(url) {
  const urlObj = new URL(url);

  // Check if the URL is from startpage.com/suggestions
  if (urlObj.origin === 'https://www.startpage.com' && urlObj.pathname === '/suggestions') { //dont activate bangs for search suggestions on startpage
    return null;
  } else if(urlObj.pathname === '/complete/search') { //dont activate bangs for search suggestions on google
    return null;
  }

  const params = new URLSearchParams(urlObj.search);

  if (params.has('query')) {
    return params.get('query');
  }
  if (params.has('q')) {
    return params.get('q');
  }
  if (params.has('p')) { //Yahoo?
    return params.get('p');
  }
  if(params.has('text')) { //yandex
    return params.get('text');
  }
  return null;
}

// Function to replace bang in a URL
function replaceBang(url, query) {
  const lowerCaseQuery = query.toLowerCase();
  return new Promise((resolve, reject) => {
    if (!query.includes("!")) {
      resolve(null);
    }
    chrome.storage.local.get({ bangHistory: [], bangUsageCounts: {}, historyOptIn: false, blacklist: [], whitelist: [], useWhitelist: false }, (result) => {
      const { bangHistory, bangUsageCounts, historyOptIn, blacklist, whitelist, useWhitelist } = result;

      for (let i = 0; i < bangs.length; i++) {
        const bang = bangs[i].bang.toLowerCase();

        if (lowerCaseQuery.includes(bang) && 
            (
              (!useWhitelist && !blacklist.includes(bang)) || 
              (useWhitelist && whitelist.includes(bang))
            )) {
          const searchQuery = lowerCaseQuery.replace(bang, "").trim();
          const newUrl = bangs[i].url.replace("{{{s}}}", encodeURIComponent(searchQuery));

          if (historyOptIn) {
            const formattedDate = new Date().toISOString();
            bangHistory.push({ bang: bangs[i], originalQuery: searchQuery, newUrl, timestamp: formattedDate });
            bangUsageCounts[bang] = (bangUsageCounts[bang] || 0) + 1;
            chrome.storage.local.set({ bangHistory, bangUsageCounts });
          }

          return resolve(newUrl);
        }
      }

      resolve(null);
    });
  });
}

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const query = getSearchQuery(details.url);
    if (query) {
      replaceBang(details.url, query).then(newUrl => {
        if (newUrl) {
          console.log('Old URL:', details.url);
          console.log('Updated URL:', newUrl);
          chrome.tabs.update(details.tabId, { url: newUrl });
        }
      });
    }
  },
  {
    urls: [
      "https://*.startpage.com/*",
      "https://*.google.com/search?*",
      "https://*.google.nl/search?*",
      "https://*.bing.com/search?*",
      "https://*.yahoo.com/search?*",
      "https://*.ecosia.org/search?*",
      "https://*.brave.com/search?*",
      "https://*.swisscows.com/*",
      "https://*.you.com/search?*",
      "https://*.qwant.com/v3/search/web?*",
      "https://*.qwant.com/?*",
      "https://*.yandex.com/search/?*",
      "https://*.mojeek.com/search?*",
      "https://*.google.co.uk/search?*",
      "https://*.google.ca/search?*",
      "https://*.google.com.au/search?*",
      "https://*.google.de/search?*"
    ]
  }
);