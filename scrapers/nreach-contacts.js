// This script is meant to be run in the browser's developer console on the nReach platform.
// It will scrape all pages of the table and make a CSV file
// In order to work properly, you need to zoom out as much as possible so that all columns are visible due to the virtualization of the table
// You can adjust the `colIds` object to add/remove columns you want to scrape
(async () => {
    // A simple delay helper
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Keep track of rows we've already scraped
    const seenRowIds = new Set();
    const allRows = [];

    const colIds = {
      "Chains": "df_data.chains",
      "EVM Support": "df_data.evm_support",
      "Category": "df_data.high_level_categories",
      "Tags": "df_data.categories",
      "Funding": "df_data.total_funding",
      "Last Funding Date": "df_data.latest_funding_round_date",
      "TVL": "df_data.tvl",
      "30d Volume": "df_data.dex_volume_metrics.total30d",
      "30d Fees": "df_data.fee_metrics.total30d",
      "Fully Diluted Market Cap": "df_data.token_fully_diluted_market_cap",
      "30d Unique Wallets": "df_data.unique_active_wallets_30d",
      "Genesis Date": "df_data.genesis_time",
      "Latest Smart Contract Deployment": "df_data.latest_smart_contract_deployment_on_mainnet",
      "Tweet Count": "df_data.tweet_count",
      "Code Languages": "df_data.code_languages",
      "Github Categories": "df_data.used_tool_categories",
      "Active Members": "df_data.active_members",
      "Investments": "df_data.num_investments",
      "Latest Investment Date": "df_data.latest_investment_date",
    };

    // Locate the AG Grid's scrollable body container (for row virtualization)
    function getScrollContainer() {
      return document.querySelector('.ag-body-viewport');
    }

    // Parse out the relevant contacts from the links cell
    function parseLinks(linksString) {
      // We'll separate them into arrays based on type
      const allLinks = linksString.split(/\s+/).filter(Boolean);
      const result = {
        telegram: [],
        twitter: [],
        email: [],
        linkedin: [],
      };
      for (const link of allLinks) {
        const lower = link.toLowerCase();
        if (lower.includes('t.me/')) {
          result.telegram.push(link);
        } else if (lower.includes('twitter.com')) {
          result.twitter.push(link);
        } else if (lower.startsWith('mailto:')) {
          result.email.push(link);
        } else if (lower.includes('linkedin.com')) {
          result.linkedin.push(link);
        }
      }

      // Return them as space-joined in case multiple
      return {
        telegramLink: result.telegram.join(' '),
        twitterLink: result.twitter.join(' '),
        emailLink: result.email.join(' '),
        linkedInLink: result.linkedin.join(' '),
      };
    }

    // Extract newly visible rows
    function extractVisibleRows() {
      const leftPanelRows = document.querySelectorAll('div.ag-pinned-left-cols-container > div[role="row"][aria-rowindex]');
      const rightPanelContainer = document.querySelector("div.ag-center-cols-container");
      for (const leftRow of leftPanelRows) {
        // row-id or aria-rowindex is our unique key
        const rowKey = leftRow.getAttribute("row-id") || leftRow.getAttribute("aria-rowindex");
        if (seenRowIds.has(rowKey)) {
          continue;
        }
        seenRowIds.add(rowKey);

        const rightRow = rightPanelContainer.querySelector(`div[row-id="${rowKey}"]`);

        const nameCell = leftRow.querySelector(`[col-id="external_features.name"]`);
        const name = nameCell?.innerText.trim() ?? "";

        const data = {};
        for (const [name, colId] of Object.entries(colIds)) {
          data[name] = rightRow.querySelector(`[col-id="${colId}"]`)?.innerText.trim() ?? "";
        }

        const linksCell = rightRow.querySelector(`[col-id="df_data.available_links"]`);
        // Gather all anchors behind icons, etc.
        const anchorTags = [...(linksCell?.querySelectorAll("a[href]") || [])];
        // Join them into a single string to parse
        const combinedLinks = anchorTags.map((a) => a.href).join(" ");

        const { telegramLink, twitterLink, emailLink, linkedInLink } = parseLinks(combinedLinks);

        allRows.push({
          Name: name,
          TelegramLink: telegramLink,
          TwitterLink: twitterLink,
          EmailLink: emailLink,
          LinkedInLink: linkedInLink,
          ...data,
        });
      }
    }

    // Scroll the table to capture all rows for the current page
    async function scrapeCurrentPageRows() {
      const container = getScrollContainer();
      if (!container) {
        console.error("Could not find AG Grid's scroll container.");
        return;
      }
      container.scrollTop = 0;
      let previousScrollTop = -1;

      while (true) {
        extractVisibleRows();
        await sleep(300);

        const oldScroll = container.scrollTop;
        container.scrollTop += container.clientHeight;
        await sleep(300);

        if (container.scrollTop === oldScroll || container.scrollTop === previousScrollTop) {
          break;
        }
        previousScrollTop = container.scrollTop;
      }
      // one last extraction pass
      extractVisibleRows();
    }

    // We'll navigate pages until we finish
    let totalPages = parseInt(document.querySelector('[data-ref="lbTotal"]')?.textContent || '1', 10);
    let currentPage = parseInt(document.querySelector('[data-ref="lbCurrent"]')?.textContent || '1', 10);

    while (true) {
      // Scrape the rows on this page
      await scrapeCurrentPageRows();

      // If not the final page, click next
      if (currentPage < totalPages) {
        const nextBtn = document.querySelector('[data-ref="btNext"]');
        if (!nextBtn) {
          console.error("Could not find the Next Page button.");
          break;
        }
        nextBtn.click();
        await sleep(1000);

        // refresh current page from DOM
        currentPage = parseInt(document.querySelector('[data-ref="lbCurrent"]')?.textContent || '1', 10);
      } else {
        break; // done
      }
    }

    const headers = ["Name", "TelegramLink", "TwitterLink", "EmailLink", "LinkedInLink", ...Object.keys(colIds)];

    const csvRows = [headers];
    for (const row of allRows) {
      csvRows.push(Object.values(row));
    }

    const csvString = csvRows.map((rowArr) => rowArr.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    // Download
    const blobUrl = URL.createObjectURL(new Blob([csvString], { type: "text/csv" }));
    const linkEl = document.createElement("a");
    linkEl.href = blobUrl;
    linkEl.download = "contacts.csv";
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    console.log(`Done! Scraped ${allRows.length} contacts over ${totalPages} pages.`);
})();
