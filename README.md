<p align="center">
    <img src="icons/icon500.png" height="300"><br />
</p>

# BetterBangs

This extension adds DuckDuckGo bangs to A lot of search engines. Like [StartPage](https://www.startpage.com/), [Bing](https://www.bing.com/), and [Google](https://www.google.com/).
It has an optional bang history tracking feature to see which Bangs you use the most. A nice statistic to know.

## Installation
The BetterBangs extension is available to download for anyone using firefox-based browsers or edge. For chromium based browsers, please manually download the crx file

[![Firefox download link](https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png)](https://addons.mozilla.org/en-US/firefox/addon/betterbangs)

Install on [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/betterbangs/dkifiohhaleejodbpijkfmjipogdmapp) 
or just download it manually as [.crx-file](/BetterBangs.crx) for Chromium


## Supported Search Engines

| Search Engine  | URL(s)                         |
| -------------- | ------------------------------ |
| Startpage      | `https://*.startpage.com/*` (suggested)    |
| Google         | `https://*.google.com/*`, `https://*.google.nl/*`, `https://*.google.co.uk/*`, `https://*.google.ca/*`, `https://*.google.com.au/*`, `https://*.google.de/*` |
| Bing           | `https://*.bing.com/*`         |
| Yahoo          | `https://*.yahoo.com/*`        |
| Ecosia         | `https://*.ecosia.org/*`       |
| Brave          | `https://*.brave.com/*`        |
| Swisscows      | `https://*.swisscows.com/*`    |
| You.com        | `https://*.you.com/*`          |
| Qwant          | `https://*.qwant.com/*`        |
| Yandex         | `https://*.yandex.com/*`, `https://*.yandex.ru/*`       |
| Mojeek         | `https://*.mojeek.com/*`       |

## Notes
I highly recommend using Startpage, since it has Google results as well + it's really privacy focused. But if you still decide to use Google, the extension will only work on the Google domains from the table above. So if it doesn't work, that is the reason. It might not always work on Startpage if it is set to search using POST requests.

It works by checking if the query contains an !, if it does it checks the local list of bangs and redirects you to the site you want to go to. 
The last time the Bang list was updated was on 02-01-2024.

## Contributing
Please fork this repository and create a new pull request to contribute to it.

If you notice any errors, or want to update the bangs.json file, please create a new issue on GitHub.

# License
This extension is licensed under the MIT License.