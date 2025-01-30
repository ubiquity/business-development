(async () => {
    // A simple delay helper
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Keep track of rows we've already scraped
    const seenRowIds = new Set();
    const allRows = [];

    // We'll define final columns:
    // - Name
    // - TelegramLink
    // - TwitterLink
    // - EmailLink
    // - LinkedInLink
    // - Company
    // - Campaign
    // - ReplyFunnel
    const colIds = {
      name: 'name',
      links: 'links',
      company: 'company_name',
      campaign: '0_0', // "Campaign" col
      funnel: 'campaign_replied_funnel',
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
      const rowNodes = document.querySelectorAll('[role="row"][aria-rowindex]');
      for (const row of rowNodes) {
        const rowIndex = parseInt(row.getAttribute('aria-rowindex'), 10);
        if (rowIndex < 6) continue; // skip any header rows

        // row-id or aria-rowindex is our unique key
        const rowKey = row.getAttribute('row-id') || row.getAttribute('aria-rowindex');
        if (seenRowIds.has(rowKey)) {
          continue;
        }
        seenRowIds.add(rowKey);

        const nameCell     = row.querySelector(`[col-id="${colIds.name}"]`);
        const linksCell    = row.querySelector(`[col-id="${colIds.links}"]`);
        const companyCell  = row.querySelector(`[col-id="${colIds.company}"]`);
        const campaignCell = row.querySelector(`[col-id="${colIds.campaign}"]`);
        const funnelCell   = row.querySelector(`[col-id="${colIds.funnel}"]`);

        const name     = nameCell?.innerText.trim() ?? '';
        const company  = companyCell?.innerText.trim() ?? '';
        const campaign = campaignCell?.innerText.trim() ?? '';
        const funnel   = funnelCell?.innerText.trim() ?? '';

        // Gather all anchors behind icons, etc.
        const anchorTags = [...(linksCell?.querySelectorAll('a[href]') || [])];
        // Join them into a single string to parse
        const combinedLinks = anchorTags.map(a => a.href).join(' ');

        const {
          telegramLink,
          twitterLink,
          emailLink,
          linkedInLink
        } = parseLinks(combinedLinks);

        allRows.push({
          Name: name,
          TelegramLink: telegramLink,
          TwitterLink: twitterLink,
          EmailLink: emailLink,
          LinkedInLink: linkedInLink,
          Company: company,
          Campaign: campaign,
          ReplyFunnel: funnel,
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

    // Build final CSV
    const headers = [
      'Name',
      'TelegramLink',
      'TwitterLink',
      'EmailLink',
      'LinkedInLink',
      'Company',
      'Campaign',
      'ReplyFunnel',
    ];

    const csvRows = [headers];
    for (const row of allRows) {
      csvRows.push([
        row.Name,
        row.TelegramLink,
        row.TwitterLink,
        row.EmailLink,
        row.LinkedInLink,
        row.Company,
        row.Campaign,
        row.ReplyFunnel,
      ]);
    }

    const csvString = csvRows.map(
      rowArr => rowArr.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download
    const blobUrl = URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }));
    const linkEl = document.createElement('a');
    linkEl.href = blobUrl;
    linkEl.download = 'contacts.csv';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    console.log(`Done! Scraped ${allRows.length} contacts over ${totalPages} pages.`);
  })();