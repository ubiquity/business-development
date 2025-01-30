(async () => {
    ////////////////////////////////////////////////
    // 1) HELPER FUNCTIONS
    ////////////////////////////////////////////////

    // Wait a bit
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Return the main scrolling container used by AG Grid for row virtualization
    function getScrollContainer() {
      return document.querySelector('.ag-body-viewport');
    }

    // For storing row data without duplicates
    const seenRowIds = new Set();
    const allRows = [];

    // We only break out links for Telegram/Twitter/Email/LinkedIn
    function parseLinks(linksStr) {
      const result = { telegramLink: '', twitterLink: '', emailLink: '', linkedInLink: '' };
      const telegram = [];
      const twitter = [];
      const email = [];
      const linkedin = [];

      const all = linksStr.split(/\s+/).filter(Boolean);
      for (const link of all) {
        const lower = link.toLowerCase();
        if (lower.includes('t.me/')) {
          telegram.push(link);
        } else if (lower.includes('twitter.com')) {
          twitter.push(link);
        } else if (lower.startsWith('mailto:')) {
          email.push(link);
        } else if (lower.includes('linkedin.com')) {
          linkedin.push(link);
        }
      }
      result.telegramLink = telegram.join(' ');
      result.twitterLink = twitter.join(' ');
      result.emailLink = email.join(' ');
      result.linkedInLink = linkedin.join(' ');
      return result;
    }

    ////////////////////////////////////////////////
    // 2) DETECT RELEVANT COLUMNS FROM HEADERS
    ////////////////////////////////////////////////

    // We'll read all column headers to see which col-ids are present
    // (AG Grid often assigns col-id="name", col-id="links", etc.)
    const headerEls = Array.from(document.querySelectorAll('[role="columnheader"][col-id]'));
    const colMap = {};
    for (const el of headerEls) {
      const colId = el.getAttribute('col-id') || '';
      const colLabel = (el.textContent || '').trim();
      colMap[colId] = colLabel;
    }

    // We define the col-ids we want to handle, mapping to a property name in our final row object
    // You can add or remove as needed. The script will only fill those that actually exist in the DOM.
    const desiredColumns = {
      name: 'name',
      links: 'links',
      notifications: 'notifications',
      jobCategory: 'job_category',
      jobTitle: 'title',
      company: 'company_name',
      leadGenGroup: 'lead_gen_group',
      // for “Campaign” style:
      campaign: '0_0', // or "campaign_name"
      funnel: 'campaign_replied_funnel',
    };

    // Figure out which of these actually exist in colMap
    const activeCols = {};
    for (const [prop, colId] of Object.entries(desiredColumns)) {
      if (colMap[colId] !== undefined) {
        // The DOM actually has a column with that colId
        activeCols[prop] = colId;
      }
    }

    // Our final CSV columns in this order
    // Adjust as needed for your usage
    const csvColumnOrder = [
      'Name',
      'TelegramLink',
      'TwitterLink',
      'EmailLink',
      'LinkedInLink',
      'Notifications',
      'JobCategory',
      'JobTitle',
      'Company',
      'LeadGenGroup',
      'Campaign',
      'ReplyFunnel'
    ];

    ////////////////////////////////////////////////
    // 3) EXTRACT ROWS (INCLUDING PINNED PARTS)
    ////////////////////////////////////////////////

    // In AG Grid, each row can appear in multiple containers:
    // e.g. pinned left, pinned center, pinned right
    // but they share the same row-id or aria-rowindex. We'll gather them all, then unify.

    function extractVisibleRows() {
      // 1) gather all [role="row"][row-id] or [role="row"][aria-rowindex]
      const rowEls = Array.from(document.querySelectorAll('[role="row"][row-id], [role="row"][aria-rowindex]'));

      // 2) group them by rowId
      const rowMap = new Map(); // rowId -> array of rowEls
      for (const rowEl of rowEls) {
        const rowId = rowEl.getAttribute('row-id') || rowEl.getAttribute('aria-rowindex');
        if (!rowMap.has(rowId)) rowMap.set(rowId, []);
        rowMap.get(rowId).push(rowEl);
      }

      // 3) For each rowId, we combine the cell data from each container
      for (const [rowId, rowParts] of rowMap) {
        // skip if we've already done this row
        if (seenRowIds.has(rowId)) continue;
        // We'll gather the final row data in a single object
        const rowData = {
          Name: '',
          TelegramLink: '',
          TwitterLink: '',
          EmailLink: '',
          LinkedInLink: '',
          Notifications: '',
          JobCategory: '',
          JobTitle: '',
          Company: '',
          LeadGenGroup: '',
          Campaign: '',
          ReplyFunnel: ''
        };

        // For each piece of the row (pinned left/center/right), let's read its cells
        for (const rowEl of rowParts) {
          // For each cell within that row
          const cellEls = Array.from(rowEl.querySelectorAll('[role="gridcell"][col-id]'));
          for (const cell of cellEls) {
            const colId = cell.getAttribute('col-id');
            // see if colId is one we care about
            const propName = Object.keys(activeCols).find(k => activeCols[k] === colId);
            if (!propName) continue;

            switch (propName) {
              case 'name': {
                // read text
                rowData.Name = cell.innerText.trim();
                break;
              }
              case 'links': {
                // gather anchor tags
                const anchors = [...cell.querySelectorAll('a[href]')].map(a => a.href);
                const combined = anchors.join(' ');
                const { telegramLink, twitterLink, emailLink, linkedInLink } = parseLinks(combined);
                rowData.TelegramLink = telegramLink;
                rowData.TwitterLink  = twitterLink;
                rowData.EmailLink    = emailLink;
                rowData.LinkedInLink = linkedInLink;
                break;
              }
              case 'notifications': {
                rowData.Notifications = cell.innerText.trim();
                break;
              }
              case 'jobCategory': {
                rowData.JobCategory = cell.innerText.trim();
                break;
              }
              case 'jobTitle': {
                rowData.JobTitle = cell.innerText.trim();
                break;
              }
              case 'company': {
                rowData.Company = cell.innerText.trim();
                break;
              }
              case 'leadGenGroup': {
                rowData.LeadGenGroup = cell.innerText.trim();
                break;
              }
              case 'campaign': {
                rowData.Campaign = cell.innerText.trim();
                break;
              }
              case 'funnel': {
                rowData.ReplyFunnel = cell.innerText.trim();
                break;
              }
              default:
                break;
            }
          }
        }

        // Now we have a complete row
        allRows.push(rowData);
        seenRowIds.add(rowId);
      }
    }

    // We'll scroll through the current page from top to bottom
    async function scrapeCurrentPageRows() {
      const container = getScrollContainer();
      if (!container) {
        console.error('No .ag-body-viewport found for scrolling');
        return;
      }
      container.scrollTop = 0;
      let prev = -1;
      while (true) {
        extractVisibleRows();
        await sleep(250);
        const old = container.scrollTop;
        container.scrollTop += container.clientHeight;
        await sleep(250);
        if (container.scrollTop === old || container.scrollTop === prev) break;
        prev = container.scrollTop;
      }
      // one final pass
      extractVisibleRows();
    }

    // If there's pagination, we handle it:
    async function scrapeAllPages() {
      const lbTotal = document.querySelector('[data-ref="lbTotal"]');
      const lbCurrent = document.querySelector('[data-ref="lbCurrent"]');

      let totalPages = parseInt(lbTotal?.textContent || '1', 10);
      let currentPage = parseInt(lbCurrent?.textContent || '1', 10);

      while (true) {
        await scrapeCurrentPageRows();
        if (currentPage < totalPages) {
          const nextBtn = document.querySelector('[data-ref="btNext"]');
          if (!nextBtn) {
            console.warn('No [data-ref="btNext"] button found, stopping early');
            break;
          }
          nextBtn.click();
          await sleep(1000);
          currentPage = parseInt(lbCurrent?.textContent || '1', 10);
        } else {
          break; // done
        }
      }
    }

    ////////////////////////////////////////////////
    // 4) RUN THE SCRAPER & GENERATE CSV
    ////////////////////////////////////////////////

    await scrapeAllPages();

    // Build CSV
    const finalCols = csvColumnOrder; // we might skip ones not in 'activeCols', or just keep them empty
    const csvRows = [];
    csvRows.push(finalCols);
    for (const row of allRows) {
      const rowVals = finalCols.map(colName => row[colName] ?? '');
      csvRows.push(rowVals.map(val => val.replace(/\r?\n/g, ' ')));
    }

    const csvString = csvRows.map(
      rowArr => rowArr.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download
    const blobUrl = URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }));
    const linkEl = document.createElement('a');
    linkEl.href = blobUrl;
    linkEl.download = 'contacts.csv';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    console.log(`Done! Found ${allRows.length} rows. Combined pinned columns & scrolled all pages.`);
  })();