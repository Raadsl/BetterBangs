// Content script to extract the first search result from supported search engines
(function() {
  'use strict';

  // Cross-browser compatibility
  const browser = globalThis.browser || globalThis.chrome;

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

  // Check for bangs when page loads - only needed as fallback
  function checkForBangs() {
    // This is now mainly a fallback in case webRequest doesn't catch it
    const query = getSearchQuery(window.location.href);
    if (query && query.includes("!")) {
      // Only proceed if we're not already processing this tab
      browser.runtime.sendMessage({
        action: 'checkBang',
        url: window.location.href,
        query: query
      }).then(response => {
        if (response && response.action === 'redirect') {
          window.location.href = response.url;
        } else if (response && response.action === 'processFirstResult') {
          processFirstResult(response.originalQuery);
        }
      }).catch(error => {
        console.log('[BetterBangs] Error sending message to background:', error);
      });
    }
  }

  // Run bang check on page load (as fallback)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForBangs);
  } else {
    // Small delay to allow webRequest to process first
    setTimeout(checkForBangs, 100);
  }

  // Loading modal
  function createLoadingModal() {
    const modal = document.createElement('div');
    modal.id = 'betterbangs-loading-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 300px;
      position: relative;
    `;

    const brandHeader = document.createElement('div');
    brandHeader.textContent = 'BetterBangs';
    brandHeader.style.cssText = `
      font-size: 14px;
      color: #007bff;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const message = document.createElement('div');
    message.textContent = 'Opening first search result...';
    message.style.cssText = `
      font-size: 16px;
      color: #333;
      margin-bottom: 10px;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    modalContent.appendChild(brandHeader);
    modalContent.appendChild(message);
    modalContent.appendChild(spinner);
    modal.appendChild(modalContent);

    // Click to close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideLoadingModal();
      }
    });

    return modal;
  }

  function showLoadingModal() {
    const existingModal = document.getElementById('betterbangs-loading-modal');
    if (existingModal) {
      existingModal.style.display = 'flex';
      return;
    }

    const modal = createLoadingModal();
    document.body.appendChild(modal);
  }

  function hideLoadingModal() {
    const modal = document.getElementById('betterbangs-loading-modal');
    if (modal) {
      modal.remove();
    }
  }

  function getFirstResultUrl() {
  const hostname = window.location.hostname;
  let firstResultSelector = '';
    
    // Define selectors for different search engines
    if (hostname.includes('google.')) {
      // Google
      firstResultSelector = 'div#search div.g:first-of-type h3 a, div#rso div.g:first-of-type h3 a, div.g:first-of-type a[href^="/url?q="], div.yuRUbf:first-of-type a';
    } else if (hostname.includes('startpage.com')) {
      // Startpage
      firstResultSelector = '.result:first-of-type .result-title.result-link, .result:first-of-type .wgl-site-title, .w-gl__result:first-of-type .w-gl__result-title a, .result:first-of-type .result-title a, .w-gl__result:first-of-type h3 a, .w-gl__result:first-of-type .result__title a, .search-item:first-of-type .search-item__title a, .search-result:first-of-type .search-result__title a, .algo-result:first-of-type .algo-result__title a';
    } else if (hostname.includes('bing.com')) {
      // Bing
      firstResultSelector = '#b_results .b_algo:first-of-type h2 a, .b_algo:first-of-type .b_title a';
    } else if (hostname.includes('yahoo.com')) {
      // Yahoo
      firstResultSelector = '#web .searchCenterMiddle .compDlink:first-of-type a, .algo:first-of-type .ac-algo a';
    } else if (hostname.includes('ecosia.org')) {
      // Ecosia
      firstResultSelector = '.result:first-of-type .result__title a';
    } else if (hostname.includes('brave.com')) {
      // Brave Search
      firstResultSelector = '.snippet[data-type="web"] > a, .snippet[data-type="web"] a.heading-serpresult, .snippet[data-type="web"]:first-of-type > a, .web-result:first-of-type .title a, .result[data-pos="0"] .title a, .result:first-of-type .snippet-title a';
    } else if (hostname.includes('you.com')) {
      // You.com - not supported
      return null;
    } else if (hostname.includes('qwant.com')) {
      // Qwant
      firstResultSelector = '[data-testid="webResult"]:first-of-type a[data-testid="serp-link"], .result:first-of-type a, .search-result:first-of-type a, main a[href^="http"]:not([href*="qwant.com"]):not([href*="javascript"]):not([aria-label]):not([href*="junior"])';
    } else if (hostname.includes('yandex.')) {
      // Yandex
      firstResultSelector = '.Organic .OrganicTitle-Link, .organic .OrganicTitle-Link, a.OrganicTitle-Link, .serp-item .OrganicTitle-Link, .OrganicTitle .OrganicTitle-Link, a[class*="OrganicTitle-Link"], .organic__url.link';
    } else if (hostname.includes('mojeek.com')) {
      // Mojeek
      firstResultSelector = 'h2 a.title:first-of-type, .results-standard:first-of-type .title a, h2:first-of-type a.title';
    } else if (hostname.includes('swisscows.com')) {
      // Swisscows
      firstResultSelector = 'article.item:first-of-type .mainlink, article.item:first-of-type a.mainlink, .web-results .item:first-of-type .title a';
    }

    if (firstResultSelector) {
      const firstResult = document.querySelector(firstResultSelector);
      if (firstResult) {
        let url = firstResult.href;
        console.log('[BetterBangs] Found first result:', url);
        // Handle Google's redirect URLs
        if (hostname.includes('google.') && url.includes('/url?q=')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          const actualUrl = urlParams.get('q');
          if (actualUrl) {
            url = actualUrl;
            console.log('[BetterBangs] Extracted from Google redirect:', url);
          }
        }
        return url;
      } else {
        console.log('[BetterBangs] No result found with selector for', hostname);
      }
    }
    return null;
  }

  // Function to wait for search results to load
  function waitForResults() {
    return new Promise((resolve) => {
      const maxAttempts = 10; // Wait up to 2.5 seconds (10 * 250ms)
      let attempts = 0;
      const checkForResults = () => {
        attempts++;
        const firstResultUrl = getFirstResultUrl();
        if (firstResultUrl) {
          resolve(firstResultUrl);
        } else if (attempts < maxAttempts) {
          setTimeout(checkForResults, 250); // Check every 250ms
        } else {
          resolve(null);
        }
      };
      checkForResults();
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === 'getFirstResult') {
      waitForResults().then((url) => {
        sendResponse({ firstResultUrl: url });
      });
      return true;
    }
    
    if (request.action === 'processFirstResult') {
      processFirstResult(request.originalQuery);
    }
  });

  // Function to process first result
  function processFirstResult(originalQuery) {
    // Show loading modal immediately
    showLoadingModal();
    
    waitForResults().then((url) => {
      if (url) {
        console.log('[BetterBangs] Redirecting to:', url);
        browser.runtime.sendMessage({
          action: 'redirectToFirstResult',
          url: url,
          originalQuery: originalQuery || ''
        });
        // Keep modal visible during redirect
      } else {
        console.log('[BetterBangs] No first result found');
        setTimeout(hideLoadingModal, 1000);
      }
    });
  }

  console.log('[BetterBangs] Content script loaded for:', window.location.hostname);
})();
