// background-firefox.js
// Cross-browser compatibility
const browser = globalThis.browser || globalThis.chrome;

// Fetch bangs.json from local extension files.
let bangs = [{ "bang": "!g", "title": "Google", "url": "https://encrypted.google.com/search?hl=en&q={{{s}}}" }]; //for if it fails at least let google work

fetch(browser.runtime.getURL('bangs.json'))
  .then((response) => response.json())
  .then((data) => {
    bangs = data.bangs.map(bang => ({
      bang: bang.b,
      title: bang.t,
      url: bang.u
    })).sort((a, b) => b.bang.length - a.bang.length); // sort on bang length in descending order
    // Initialize usage counts in storage if not already present
    browser.storage.local.get({ bangUsageCounts: {} }, (result) => {
      const bangUsageCounts = result.bangUsageCounts;
      bangs.forEach(bang => {
        if (!bangUsageCounts[bang.bang]) {
          bangUsageCounts[bang.bang] = 0;
        }
      });
      browser.storage.local.set({ bangUsageCounts });
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
    const query = params.get('query');
    return query;
  }
  if (params.has('q')) {
    const query = params.get('q');
    return query;
  }
  if (params.has('p')) { //Yahoo?
    const query = params.get('p');
    return query;
  }
  if(params.has('text')) { //yandex
    const query = params.get('text');
    return query;
  }
  return null;
}

// Function to replace bang in a URL
function replaceBang(url, query) {
  const lowerCaseQuery = query.toLowerCase();
  
  return new Promise((resolve, reject) => {
    if (!query.includes("!")) {
      resolve(null);
      return;
    }
    browser.storage.local.get({ bangHistory: [], bangUsageCounts: {}, historyOptIn: false, blacklist: [], whitelist: [], useWhitelist: false, firstResultEnabled: true }, (result) => {
      const { bangHistory, bangUsageCounts, historyOptIn, blacklist, whitelist, useWhitelist, firstResultEnabled } = result;

      for (let i = 0; i < bangs.length; i++) {
        const bang = bangs[i].bang.toLowerCase();

        if (lowerCaseQuery.includes(bang) && 
            (
              (!useWhitelist && !blacklist.includes(bang)) || 
              (useWhitelist && whitelist.includes(bang))
            )) {
          const searchQuery = lowerCaseQuery.replace(bang, "").trim();
          
          // Special handling for the "!" bang (first result)
          if (bang === "!" && bangs[i].url.startsWith("FIRST_RESULT_SPECIAL:")) {
            if (!firstResultEnabled) {
              resolve(null);
              return;
            }
            // For the "!" bang, we let the search proceed and handle it via content script
            // Mark this tab for first result processing
            resolve("FIRST_RESULT_MARKER");
            return;
          }
          
          const newUrl = bangs[i].url.replace("{{{s}}}", encodeURIComponent(searchQuery));

          if (historyOptIn) {
            const formattedDate = new Date().toISOString();
            bangHistory.push({ bang: bangs[i], originalQuery: searchQuery, newUrl, timestamp: formattedDate });
            bangUsageCounts[bang] = (bangUsageCounts[bang] || 0) + 1;
            browser.storage.local.set({ bangHistory, bangUsageCounts });
          }

          return resolve(newUrl);
        }
      }

      resolve(null);
    });
  });
}

// Store tabs that are processing first result bangs
let firstResultTabs = new Set();

// Listen for web requests (Firefox only)
if (browser.webRequest) {
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const query = getSearchQuery(details.url);
      if (query) {
        return new Promise((resolve) => {
          replaceBang(details.url, query).then(newUrl => {
            if (newUrl === "FIRST_RESULT_MARKER") {
              // Mark this tab for first result processing
              firstResultTabs.add(details.tabId);
              
              // Modify the URL to remove the "!" from the search query
              const modifiedUrl = details.url.replace(/([&?](?:q|query|p|text)=)[^&]*(!)[^&]*/, (match, prefix, bang) => {
                const cleanQuery = match.replace(prefix, '').replace(/!/g, '').trim();
                return prefix + encodeURIComponent(cleanQuery);
              });
              
              if (modifiedUrl !== details.url) {
                resolve({ redirectUrl: modifiedUrl });
              } else {
                resolve({});
              }
              
              // Send message to content script to process first result
              setTimeout(() => {
                browser.tabs.sendMessage(details.tabId, {
                  action: 'processFirstResult',
                  originalQuery: query.replace(/!/g, '').trim()
                }).catch(error => {
                  console.log('[BetterBangs] Error sending message to content script:', error);
                });
              }, 2000); // Wait 2 seconds for page to load
              
            } else if (newUrl) {
              resolve({ redirectUrl: newUrl });
            } else {
              resolve({});
            }
          }).catch(error => {
            console.error('[BetterBangs] Error in replaceBang:', error);
            resolve({});
          });
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
        "https://*.yandex.ru/search/?*",
        "https://*.mojeek.com/search?*",
        "https://*.google.co.uk/search?*",
        "https://*.google.ca/search?*",
        "https://*.google.com.au/search?*",
        "https://*.google.de/search?*"
      ]
    },
    ["blocking"]
  );
}

// Listen for messages from content script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'redirectToFirstResult' && request.url) {
    // Redirect to the first result
    browser.tabs.update(sender.tab.id, { url: request.url });
    
    // Remove from processing set
    firstResultTabs.delete(sender.tab.id);
    
    // Log usage if history is enabled
    browser.storage.local.get({ bangHistory: [], bangUsageCounts: {}, historyOptIn: false }, (result) => {
      if (result.historyOptIn) {
        const { bangHistory, bangUsageCounts } = result;
        const formattedDate = new Date().toISOString();
        bangHistory.push({ 
          bang: { bang: "!", title: "First Result", url: "FIRST_RESULT_SPECIAL:{{{s}}}" }, 
          originalQuery: request.originalQuery, 
          newUrl: request.url, 
          timestamp: formattedDate 
        });
        bangUsageCounts["!"] = (bangUsageCounts["!"] || 0) + 1;
        browser.storage.local.set({ bangHistory, bangUsageCounts });
      }
    });
  }
});

// Clean up closed tabs
browser.tabs.onRemoved.addListener((tabId) => {
  if (firstResultTabs.has(tabId)) {
    firstResultTabs.delete(tabId);
  }
});
