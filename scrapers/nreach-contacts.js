(async () => {
    /**
     * This script attempts to handle two different "views" in the AG-Grid:
     * 1) The "Campaign" view, which has columns like "campaign_replied_funnel" and "0_0" for campaign, etc.
     * 2) The "Job / Title" view, which has columns like "notifications", "job_category", "title", "lead_gen_group".
     *
     * We dynamically detect which view we’re in by looking at the column headers, and then proceed accordingly.
     *
     * We’ll do the usual scrolling/pagination logic, but the extracted columns differ based on the detected view.
     */

    ////////////////////////////////////////////////
    // 1) COMMON FUNCTIONS, SCROLL & PAGINATION
    ////////////////////////////////////////////////

    // A tiny delay helper
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // For row virtualization: we find the main AG-Grid scroll container
    function getScrollContainer() {
      return document.querySelector('.ag-body-viewport');
    }

    // We'll keep track of row IDs we've seen so we don’t duplicate them across pages
    const seenRowIds = new Set();

    // We'll store the results in an array of objects
    const allRows = [];

    // We'll parse contact link strings into separate columns for telegram, twitter, email, linkedin
    function parseLinks(linksString) {
      const allLinks = linksString.split(/\s+/).filter(Boolean);
      const result = {
        telegramLink: '',
        twitterLink: '',
        emailLink: '',
        linkedInLink: '',
      };
      const telegram = [];
      const twitter = [];
      const email = [];
      const linkedin = [];

      for (const link of allLinks) {
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

    // This function attempts to read the table structure from the headers
    // and returns an object describing which columns are present and what we should label them as.
    function detectTableStructure() {
      // We expect to find a row of column headers with role="row" and aria-rowindex=1 or something near the top
      // but let's just query all column headers:  div[role="columnheader"][col-id]
      const headers = Array.from(document.querySelectorAll('[role="columnheader"][col-id]'));
      // We'll store them in a map from col-id => header name
      const colMap = {};
      for (const headerEl of headers) {
        const colId = headerEl.getAttribute('col-id') || '';
        // The text might be the column label
        const label = (headerEl.textContent || '').trim();
        colMap[colId] = label;
      }
      return colMap;
    }

    // We can guess which "view" we are in by checking the presence of known col-ids
    // or we can simply see which col-ids exist and decide how to name them in final CSV.
    const colMap = detectTableStructure();

    // We'll define two possible configurations, each has:
    // - name -> col-id
    // - links -> col-id
    // - plus any additional columns we want
    // The script decides which set of columns to use if they exist in the DOM.
    let currentConfig;

    // First config is the "Campaign" style (the original example)
    // Example columns: name, links, company_name, 0_0 => campaign, campaign_replied_funnel => funnel
    const campaignViewConfig = {
      name: 'name',
      links: 'links',
      company: 'company_name',
      campaign: '0_0',                 // or sometimes col-id="campaign_name"
      funnel: 'campaign_replied_funnel'
    };

    // Second config is "Job / Title" style
    // Example columns: name, links, notifications, job_category, title, company_name, lead_gen_group
    // If we see "notifications" or "job_category" or "title", we likely want to parse those out.
    // We'll gather them in some new object.
    const jobTitleViewConfig = {
      name: 'name',
      links: 'links',
      openTasks: 'notifications',
      jobCategory: 'job_category',
      jobTitle: 'title',
      company: 'company_name',
      leadGenGroup: 'lead_gen_group'
    };

    // We'll define a function to see if a config is "valid" for the current columns
    function hasAllColumns(conf) {
      return Object.values(conf).every(id => !!colMap[id]);
    }

    // Decide if we are in the "campaign" or "job/title" or unknown
    if (hasAllColumns(campaignViewConfig)) {
      currentConfig = { ...campaignViewConfig, viewName: 'CampaignView' };
    } else if (hasAllColumns(jobTitleViewConfig)) {
      currentConfig = { ...jobTitleViewConfig, viewName: 'JobTitleView' };
    } else {
      // It's possible we only partially match. We'll do a "best effort" approach:
      // We'll store which ones are found and skip those that don't exist
      currentConfig = { viewName: 'DynamicDetected' };
      for (const [key, colId] of Object.entries(jobTitleViewConfig)) {
        if (colId === 'viewName') continue;
        if (colMap[colId]) {
          currentConfig[key] = colId;
        }
      }
      // We can also fill from campaign if we see them
      for (const [key, colId] of Object.entries(campaignViewConfig)) {
        if (!currentConfig[key] && colMap[colId]) {
          currentConfig[key] = colId;
        }
      }
    }

    // Next we define a function to extract currently visible rows
    function extractVisibleRows() {
      const rowNodes = document.querySelectorAll('[role="row"][aria-rowindex]');
      for (const row of rowNodes) {
        const rowIndex = parseInt(row.getAttribute('aria-rowindex'), 10);
        if (rowIndex < 6) continue; // skip header / pinned rows, typically

        // We can identify the row by "row-id" if present, otherwise fallback
        const rowKey = row.getAttribute('row-id') || row.getAttribute('aria-rowindex');
        if (seenRowIds.has(rowKey)) continue;
        seenRowIds.add(rowKey);

        // We'll build an object with the relevant columns we find
        const rowData = {};

        // name & links are usually common:
        if (currentConfig.name) {
          const nameCell = row.querySelector(`[col-id="${currentConfig.name}"]`);
          rowData.Name = nameCell?.innerText.trim() ?? '';
        } else {
          rowData.Name = '';
        }

        if (currentConfig.links) {
          const linksCell = row.querySelector(`[col-id="${currentConfig.links}"]`);
          const anchorTags = [...(linksCell?.querySelectorAll('a[href]') || [])];
          const combinedLinks = anchorTags.map(a => a.href).join(' ');
          const { telegramLink, twitterLink, emailLink, linkedInLink } = parseLinks(combinedLinks);
          rowData.TelegramLink = telegramLink;
          rowData.TwitterLink  = twitterLink;
          rowData.EmailLink    = emailLink;
          rowData.LinkedInLink = linkedInLink;
        } else {
          rowData.TelegramLink = '';
          rowData.TwitterLink  = '';
          rowData.EmailLink    = '';
          rowData.LinkedInLink = '';
        }

        // For additional columns:
        if (currentConfig.company) {
          const el = row.querySelector(`[col-id="${currentConfig.company}"]`);
          rowData.Company = el?.innerText.trim() ?? '';
        }
        if (currentConfig.campaign) {
          const el = row.querySelector(`[col-id="${currentConfig.campaign}"]`);
          rowData.Campaign = el?.innerText.trim() ?? '';
        }
        if (currentConfig.funnel) {
          const el = row.querySelector(`[col-id="${currentConfig.funnel}"]`);
          rowData.ReplyFunnel = el?.innerText.trim() ?? '';
        }
        if (currentConfig.openTasks) {
          const el = row.querySelector(`[col-id="${currentConfig.openTasks}"]`);
          rowData.OpenTasks = el?.innerText.trim() ?? '';
        }
        if (currentConfig.jobCategory) {
          const el = row.querySelector(`[col-id="${currentConfig.jobCategory}"]`);
          rowData.JobCategory = el?.innerText.trim() ?? '';
        }
        if (currentConfig.jobTitle) {
          const el = row.querySelector(`[col-id="${currentConfig.jobTitle}"]`);
          rowData.JobTitle = el?.innerText.trim() ?? '';
        }
        if (currentConfig.leadGenGroup) {
          const el = row.querySelector(`[col-id="${currentConfig.leadGenGroup}"]`);
          rowData.LeadGenGroup = el?.innerText.trim() ?? '';
        }

        allRows.push(rowData);
      }
    }

    // This scroll function remains the same; we scroll until no more new rows appear
    async function scrapeCurrentPageRows() {
      const container = getScrollContainer();
      if (!container) {
        console.error('No .ag-body-viewport container found');
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
      // one last pass
      extractVisibleRows();
    }

    // We'll handle pagination using the standard approach
    async function scrapeAllPages() {
      let totalPages = parseInt(document.querySelector('[data-ref="lbTotal"]')?.textContent || '1', 10);
      let currentPage = parseInt(document.querySelector('[data-ref="lbCurrent"]')?.textContent || '1', 10);

      while (true) {
        await scrapeCurrentPageRows();
        if (currentPage < totalPages) {
          const nextBtn = document.querySelector('[data-ref="btNext"]');
          if (!nextBtn) {
            console.warn('No Next Page button found; stopping early');
            break;
          }
          nextBtn.click();
          await sleep(1000);
          currentPage = parseInt(document.querySelector('[data-ref="lbCurrent"]')?.textContent || '1', 10);
        } else {
          // last page
          break;
        }
      }
    }

    ////////////////////////////////////////////////
    // 2) RUN THE SCRAPER
    ////////////////////////////////////////////////

    await scrapeAllPages();

    ////////////////////////////////////////////////
    // 3) BUILD OUR CSV HEADERS DYNAMICALLY
    // Because we may have different columns based on the view
    ////////////////////////////////////////////////
    // We'll unify the list of possible columns, in the order we want them in CSV.
    // If a row object doesn't have it, we fill with empty string.

    const possibleColumnsOrder = [
      'Name',
      'TelegramLink',
      'TwitterLink',
      'EmailLink',
      'LinkedInLink',
      'Company',
      'Campaign',
      'ReplyFunnel',
      'OpenTasks',
      'JobCategory',
      'JobTitle',
      'LeadGenGroup'
    ];

    // Filter down to those that actually appear in at least one row (except name + links are always included).
    // Or we can just keep them in the final CSV in a consistent order.
    // For simplicity, let's keep the full set in order:
    const finalColumns = possibleColumnsOrder;

    // Build CSV
    const csvRows = [];
    csvRows.push(finalColumns);
    for (const rowData of allRows) {
      const rowArr = finalColumns.map(col => {
        const val = rowData[col] ?? '';
        return String(val).replace(/\r?\n/g, ' '); // remove newlines if any
      });
      csvRows.push(rowArr);
    }

    const csvString = csvRows.map(
      arr => arr.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    ////////////////////////////////////////////////
    // 4) DOWNLOAD THE CSV
    ////////////////////////////////////////////////

    const blobUrl = URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }));
    const linkEl = document.createElement('a');
    linkEl.href = blobUrl;
    linkEl.download = 'contacts.csv';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    console.log(`Done. Scraped ${allRows.length} rows from a detected "${currentConfig.viewName}" table view.`);
  })();