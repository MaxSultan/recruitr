const puppeteer = require('puppeteer');

/**
 * Browser automation service for TrackWrestling
 * Single Responsibility: Handle browser interactions with TrackWrestling
 */
class TrackWrestlingBrowserService {
  
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and navigate to TrackWrestling
   * @param {Object} options - Browser options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: options.headless !== false, // Default to headless
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...options
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 });

      console.log('✅ Browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Navigate to TrackWrestling seasons page
   * @returns {Promise<void>}
   */
  async navigateToSeasons() {
    try {
      console.log('🌐 Navigating to TrackWrestling seasons...');
      
      // Try with a longer timeout and more lenient wait condition
      await this.page.goto('https://www.trackwrestling.com/seasons/index.jsp', {
        waitUntil: 'domcontentloaded', // Less strict than networkidle2
        timeout: 60000 // Increased timeout to 60 seconds
      });
      
      // Wait a bit more for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ Successfully navigated to seasons page');
      
      // Take a screenshot to see what we got
      await this.screenshot('seasons-page-loaded.png');
      
    } catch (error) {
      console.error('❌ Failed to navigate to seasons page:', error);
      
      // Try alternative approach with just load event
      try {
        console.log('🔄 Retrying with load event...');
        await this.page.goto('https://www.trackwrestling.com/seasons/index.jsp', {
          waitUntil: 'load',
          timeout: 60000
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Successfully navigated to seasons page (retry)');
        await this.screenshot('seasons-page-retry.png');
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError);
        throw retryError;
      }
    }
  }

  /**
   * Select target season by navigating through pagination if needed
   * @param {string} targetSeason - Target season text (e.g., "2025-26 High School Boys")
   * @returns {Promise<void>}
   */
  async selectSeason(targetSeason) {
    try {
      console.log(`🔍 Looking for season: ${targetSeason}`);
      
      let attempts = 0;
      const maxAttempts = 20; // Increased to handle more pages
      
      while (attempts < maxAttempts) {
        // Take a screenshot for debugging on first attempt
        if (attempts === 0) {
          await this.screenshot(`season-search-page-${attempts + 1}.png`);
        }
        
        // First, try to find and click the season link on current page
        const seasonFound = await this.page.evaluate((targetSeason) => {
          const links = Array.from(document.querySelectorAll('a'));
          const matchingLink = links.find(link => 
            link.textContent.includes(targetSeason)
          );
          if (matchingLink) {
            matchingLink.click();
            return true;
          }
          return false;
        }, targetSeason);
        
        if (seasonFound) {
          console.log(`✅ Found and clicked season: ${targetSeason}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for modal to open
          return;
        }
        
        // If not found, try to navigate to next page
        console.log(`📄 Season not found on page ${attempts + 1}, checking next page...`);
        
        // Get current page info for debugging
        const currentPageInfo = await this.page.evaluate(() => {
          const paginationInfo = document.querySelector('.dgPagerInfo');
          const allLinks = Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim()).filter(text => text.includes('High School'));
          return {
            pagination: paginationInfo ? paginationInfo.textContent : 'No pagination info found',
            availableSeasons: allLinks.slice(0, 5) // Show first 5 seasons for debugging
          };
        });
        
        console.log(`📊 Page ${attempts + 1} info:`, currentPageInfo);
        
        // Look for next page button
        const nextButton = await this.page.$('a.icon-arrow_r.dgNext');
        if (nextButton) {
          console.log('➡️  Clicking next page...');
          await nextButton.click();
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to load
          attempts++;
        } else {
          // Try alternative next page selectors
          const altNextButton = await this.page.$('a[title="Next Page"]') || 
                               await this.page.$('.dgNext');
          
          if (altNextButton) {
            console.log('➡️  Found alternative next button, clicking...');
            await altNextButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            attempts++;
          } else {
            throw new Error(`Season "${targetSeason}" not found after checking ${attempts + 1} pages. Available seasons: ${currentPageInfo.availableSeasons.join(', ')}`);
          }
        }
      }
      
      throw new Error(`Season "${targetSeason}" not found after checking ${maxAttempts} pages`);
    } catch (error) {
      console.error('❌ Failed to select season:', error);
      throw error;
    }
  }

  /**
   * Select state/region from modal
   * @param {string} stateId - State ID (e.g., "50" for Utah)
   * @returns {Promise<void>}
   */
  async selectState(stateId) {
    try {
      console.log(`🏛️  Selecting state ID: ${stateId}`);
      
      // Wait for modal to be visible
      await this.page.waitForSelector('#gbId', { visible: true, timeout: 10000 });
      
      // Select the state
      await this.page.select('#gbId', stateId);
      await new Promise(resolve => setTimeout(resolve,(1000)));
      
      // Click login button
      const loginButton = await this.page.$('input[type="button"][value="Login"]');
      if (loginButton) {
        await loginButton.click();
        
        // Wait for navigation and page to load
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        } catch (navError) {
          console.log('⚠️  Navigation timeout, waiting for page to load...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Wait a bit more for the page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Successfully logged in and navigated');
        
        // Take a screenshot to see what we got
        await this.screenshot('after-login-navigation.png');
      } else {
        throw new Error('Login button not found');
      }
    } catch (error) {
      console.error('❌ Failed to select state:', error);
      throw error;
    }
  }

  /**
   * Increase pagination to show more events
   * @param {number} pageSize - Number of items per page (default: 10000)
   * @returns {Promise<void>}
   */
  async increasePagination(pageSize = 10000) {
    try {
      console.log(`📄 Setting pagination to ${pageSize} items per page...`);
      
      // Find the pagination input
      const paginationInput = await this.page.$('input[type="text"][maxlength="5"]');
      if (paginationInput) {
        await paginationInput.click();
        await paginationInput.selectText();
        await paginationInput.type(pageSize.toString());
        await paginationInput.press('Enter');
        
        // Wait for page to reload
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Pagination updated successfully');
      } else {
        console.log('⚠️  Pagination input not found, continuing...');
      }
    } catch (error) {
      console.error('❌ Failed to update pagination:', error);
      throw error;
    }
  }

  /**
   * Get all event links from the current page
   * @returns {Promise<Array>} Array of event data
   */
  async getEventLinks() {
    try {
      console.log('🔗 Extracting event links...');
      
      // Take a screenshot to see what's on the page
      await this.screenshot('after-login-page.png');
      
      // Check what elements are available on the page
      const pageInfo = await this.page.evaluate(() => {
        const dataGrid = document.querySelector('.dataGrid');
        const tables = document.querySelectorAll('table');
        const links = document.querySelectorAll('a');
        
        return {
          hasDataGrid: !!dataGrid,
          tableCount: tables.length,
          linkCount: links.length,
          pageTitle: document.title,
          currentUrl: window.location.href,
          bodyText: document.body.textContent.substring(0, 500)
        };
      });
      
      console.log('📊 Page info after login:', pageInfo);
      
      // If we don't have the expected page structure, check for iframe
      if (!pageInfo.hasDataGrid && pageInfo.tableCount === 0) {
        console.log('🔄 Page doesn\'t have expected structure, checking for iframe...');
        
        // Check if there's a PageFrame iframe
        const iframeInfo = await this.page.evaluate(() => {
          const iframe = document.querySelector('#PageFrame');
          if (iframe) {
            return {
              hasIframe: true,
              iframeSrc: iframe.src,
              iframeId: iframe.id
            };
          }
          return { hasIframe: false };
        });
        
        console.log('📋 Iframe info:', iframeInfo);
        
        if (iframeInfo.hasIframe) {
          console.log(`🔄 Found iframe with src: ${iframeInfo.iframeSrc}`);
          
          // Wait for iframe to load
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Get the iframe content
          const iframe = await this.page.$('#PageFrame');
          if (iframe) {
            const iframeContent = await iframe.contentFrame();
            if (iframeContent) {
              console.log('✅ Successfully accessed iframe content');
              
              // Take a screenshot of the iframe content
              await this.screenshot('iframe-content.png');
              
              // Check what's in the iframe
              const iframePageInfo = await iframeContent.evaluate(() => {
                const dataGrid = document.querySelector('.dataGrid');
                const tables = document.querySelectorAll('table');
                const links = document.querySelectorAll('a');
                
                return {
                  hasDataGrid: !!dataGrid,
                  tableCount: tables.length,
                  linkCount: links.length,
                  pageTitle: document.title,
                  currentUrl: window.location.href,
                  bodyText: document.body.textContent.substring(0, 500)
                };
              });
              
              console.log('📊 Iframe page info:', iframePageInfo);
              
              // If iframe has the data we need, switch to working with iframe
              if (iframePageInfo.hasDataGrid || iframePageInfo.tableCount > 0) {
                console.log('✅ Iframe contains the events data we need');
                // We'll need to modify our methods to work with iframe content
                this.iframeContent = iframeContent;
                return await this.getEventLinksFromIframe();
              }
            }
          }
        }
      }
      
      // Try to find the data grid with a longer timeout
      try {
        await this.page.waitForSelector('.dataGrid', { timeout: 30000 });
      } catch (waitError) {
        console.log('⚠️  .dataGrid not found, looking for alternative selectors...');
        
        // Try alternative selectors
        const alternativeSelectors = ['table', '.event-list', '.tournament-list', '[class*="grid"]'];
        let foundSelector = null;
        
        for (const selector of alternativeSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            foundSelector = selector;
            console.log(`✅ Found alternative selector: ${selector}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!foundSelector) {
          throw new Error('No suitable table/grid selector found on the page');
        }
      }
      
      const events = await this.page.evaluate(() => {
        // Try multiple selectors
        const selectors = ['.dataGrid tr.dataGridRow', 'table tr', '.event-list tr'];
        let rows = [];
        
        for (const selector of selectors) {
          const foundRows = document.querySelectorAll(selector);
          if (foundRows.length > 0) {
            rows = foundRows;
            console.log(`Using selector: ${selector} (${foundRows.length} rows)`);
            break;
          }
        }
        
        const eventData = [];
        
        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const links = cells[2].querySelectorAll('a');
            links.forEach(link => {
              eventData.push({
                index: index,
                text: link.textContent.trim(),
                href: link.href,
                onclick: link.getAttribute('onclick')
              });
            });
          }
        });
        
        return eventData;
      });
      
      console.log(`✅ Found ${events.length} event links`);
      return events;
    } catch (error) {
      console.error('❌ Failed to get event links:', error);
      throw error;
    }
  }

  /**
   * Parse event date from text
   * @param {string} dateText - Raw date text from TrackWrestling
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseEventDate(dateText) {
    if (!dateText || typeof dateText !== 'string') return null;
    
    try {
      // Common TrackWrestling date formats:
      // "Jan 15, 2025"
      // "12/15/2024"
      // "2025-01-15"
      // "January 15, 2025"
      
      // Try different date parsing approaches
      let parsedDate = new Date(dateText);
      
      // If invalid, try some common transformations
      if (isNaN(parsedDate.getTime())) {
        // Try MM/DD/YYYY format
        const mmddyyyy = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (mmddyyyy) {
          parsedDate = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
        }
      }
      
      // If still invalid, try YYYY-MM-DD format
      if (isNaN(parsedDate.getTime())) {
        const yyyymmdd = dateText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (yyyymmdd) {
          parsedDate = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
        }
      }
      
      // Return null if still invalid
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️  Could not parse date: "${dateText}"`);
        return null;
      }
      
      return parsedDate;
    } catch (error) {
      console.warn(`⚠️  Error parsing date "${dateText}":`, error.message);
      return null;
    }
  }

  /**
   * Get event links from iframe content
   * @returns {Promise<Array>} Array of event data
   */
  async getEventLinksFromIframe() {
    try {
      console.log('🔗 Extracting event links from iframe...');
      
      if (!this.iframeContent) {
        throw new Error('No iframe content available');
      }
      
      // Wait for the data grid to load in the iframe
      await this.iframeContent.waitForSelector('.dataGrid', { timeout: 30000 });
      
      // Set pagination to show all events (250)
      console.log('📊 Setting pagination to show all 250 events...');
      try {
        await this.iframeContent.evaluate(() => {
          // Look for pagination input field
          const paginationInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
          let paginationInput = null;
          
          // Find the pagination input (usually has specific attributes or is near pagination elements)
          for (const input of paginationInputs) {
            const parent = input.parentElement;
            if (parent && (
              parent.textContent.toLowerCase().includes('show') ||
              parent.textContent.toLowerCase().includes('display') ||
              parent.textContent.toLowerCase().includes('items') ||
              parent.className.includes('pagination') ||
              input.placeholder && input.placeholder.toLowerCase().includes('show')
            )) {
              paginationInput = input;
              break;
            }
          }
          
          if (paginationInput) {
            console.log('Found pagination input, setting to 250...');
            paginationInput.value = '250';
            paginationInput.dispatchEvent(new Event('input', { bubbles: true }));
            paginationInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Try to trigger submit by pressing Enter
            paginationInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            paginationInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
            
            return true;
          } else {
            console.log('No pagination input found, trying alternative methods...');
            
            // Try to find any input that might control pagination
            const allInputs = document.querySelectorAll('input');
            for (const input of allInputs) {
              if (input.value && !isNaN(input.value) && input.value < 100) {
                console.log(`Found potential pagination input with value: ${input.value}`);
                input.value = '250';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                break;
              }
            }
            
            return false;
          }
        });
        
        // Wait for the page to reload with more events
        console.log('⏳ Waiting for page to reload with all events...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.iframeContent.waitForSelector('.dataGrid', { timeout: 30000 });
        
      } catch (error) {
        console.log('⚠️  Could not set pagination to 250, continuing with default...');
      }
      
      let allEvents = [];
      let pageNumber = 1;
      let hasNextPage = true;
      
      while (hasNextPage) {
        console.log(`📄 Processing events page ${pageNumber}...`);
        
        const events = await this.iframeContent.evaluate(() => {
          const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
          const eventData = [];
          
          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              // Extract date from column 2 (index 1)
              const dateText = cells[1] ? cells[1].textContent.trim() : '';
              
              // Extract event link from column 3 (index 2)
              const links = cells[2].querySelectorAll('a');
              links.forEach(link => {
                eventData.push({
                  index: index,
                  dateText: dateText,
                  text: link.textContent.trim(),
                  href: link.href,
                  onclick: link.getAttribute('onclick')
                });
              });
            }
          });
          
          return eventData;
        });
        
        // Parse dates for events
        const eventsWithDates = events.map(event => ({
          ...event,
          date: this.parseEventDate(event.dateText)
        }));
        
        allEvents = allEvents.concat(eventsWithDates);
        console.log(`✅ Found ${events.length} events on page ${pageNumber} (total: ${allEvents.length})`);
        
        // Check if there's a next page - look for multiple pagination indicators
        const nextPageInfo = await this.iframeContent.evaluate(() => {
          // Look for multiple types of next buttons
          const nextButton1 = document.querySelector('a.icon-arrow_r.dgNext');
          const nextButton2 = document.querySelector('a[title="Next Page"]');
          const nextButton4 = document.querySelector('a[onclick*="next"]');
          
          // Find next button by text content
          const allLinks = Array.from(document.querySelectorAll('a'));
          const nextButton3 = allLinks.find(link => link.textContent.toLowerCase().includes('next'));
          
          // Also check for pagination info
          const paginationInfo = document.querySelector('.pagination-info, .pagination, .dgPagination');
          const pageText = paginationInfo ? paginationInfo.textContent : '';
          
          return {
            hasNext: !!(nextButton1 || nextButton2 || nextButton3 || nextButton4),
            nextHref: nextButton1 ? nextButton1.getAttribute('href') : 
                     nextButton2 ? nextButton2.getAttribute('href') :
                     nextButton3 ? nextButton3.getAttribute('href') :
                     nextButton4 ? nextButton4.getAttribute('href') : null,
            paginationText: pageText,
            totalRows: document.querySelectorAll('.dataGrid tr.dataGridRow').length
          };
        });
        
        console.log(`📊 Page ${pageNumber} info:`, nextPageInfo);
        
        if (nextPageInfo.hasNext && nextPageInfo.totalRows > 0) {
          console.log(`➡️  Found next page, navigating...`);
          
          // Try multiple ways to click next
          let clicked = false;
          
          // Method 1: Standard next button
          if (nextPageInfo.nextHref) {
            try {
              await this.iframeContent.evaluate(() => {
                const nextButton = document.querySelector('a.icon-arrow_r.dgNext, a[title="Next Page"], a[onclick*="next"]');
                if (nextButton) {
                  nextButton.click();
                }
              });
              clicked = true;
            } catch (error) {
              console.log('Method 1 failed, trying method 2...');
            }
          }
          
          // Method 2: Try clicking by text
          if (!clicked) {
            try {
              await this.iframeContent.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('a'));
                const nextBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('next'));
                if (nextBtn) {
                  nextBtn.click();
                }
              });
              clicked = true;
            } catch (error) {
              console.log('Method 2 failed, trying method 3...');
            }
          }
          
          // Method 3: Try JavaScript navigation
          if (!clicked) {
            try {
              await this.iframeContent.evaluate(() => {
                // Try common pagination functions
                if (typeof dgNext === 'function') {
                  dgNext();
                } else if (typeof nextPage === 'function') {
                  nextPage();
                } else if (typeof goToNextPage === 'function') {
                  goToNextPage();
                }
              });
              clicked = true;
            } catch (error) {
              console.log('Method 3 failed, trying method 4...');
            }
          }
          
          if (clicked) {
            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 5000));
            await this.iframeContent.waitForSelector('.dataGrid', { timeout: 30000 });
            pageNumber++;
          } else {
            console.log('❌ Could not navigate to next page');
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
          console.log(`📄 No more pages found. Total events: ${allEvents.length}`);
        }
      }
      
      console.log(`✅ Found ${allEvents.length} total event links across ${pageNumber} pages`);
      
      // Sort events chronologically by date
      const sortedEvents = allEvents.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
      });
      
      console.log(`📅 Events sorted chronologically (${sortedEvents.length} total)`);
      if (sortedEvents.length > 0) {
        console.log(`📅 First event: ${sortedEvents[0].dateText} - ${sortedEvents[0].text}`);
        console.log(`📅 Last event: ${sortedEvents[sortedEvents.length - 1].dateText} - ${sortedEvents[sortedEvents.length - 1].text}`);
      }
      
      return sortedEvents;
    } catch (error) {
      console.error('❌ Failed to get event links from iframe:', error);
      throw error;
    }
  }

  /**
   * Navigate to a specific event and get team links
   * @param {string} eventUrl - Event URL
   * @returns {Promise<Array>} Array of team data
   */
  async getTeamLinks(eventUrl) {
    try {
      console.log(`🏫 Navigating to event: ${eventUrl}`);
      
      // If we have iframe content, handle JavaScript links
      if (this.iframeContent) {
        // Check if this is a JavaScript link
        if (eventUrl.startsWith('javascript:')) {
          console.log(`🔄 Executing JavaScript link: ${eventUrl}`);
          
          // Extract the actual JavaScript code
          const jsCode = eventUrl.substring(11); // Remove 'javascript:' prefix
          console.log(`📝 JavaScript code to execute: ${jsCode}`);
          
          // Get initial frame count
          const initialFrames = await this.page.frames();
          const initialFrameCount = initialFrames.length;
          console.log(`📊 Initial frames: ${initialFrameCount}`);
          
          // Check if the openEvent function exists
          const functionExists = await this.iframeContent.evaluate(() => {
            return typeof openEvent === 'function';
          });
          console.log(`🔍 openEvent function exists: ${functionExists}`);
          
          // Execute the JavaScript function
          try {
            const result = await this.iframeContent.evaluate((jsCode) => {
              return eval(jsCode);
            }, jsCode);
            console.log(`✅ JavaScript executed successfully, result: ${result}`);
          } catch (jsError) {
            console.log(`❌ JavaScript execution failed: ${jsError.message}`);
          }
          
          // Wait for page to potentially change
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if new pages were opened
          const newPages = await this.page.browser().pages();
          console.log(`📄 Total pages after JavaScript: ${newPages.length}`);
          
          // Check each page to see if any contain event details
          let eventPage = null;
          for (let i = 0; i < newPages.length; i++) {
            try {
              const pageUrl = newPages[i].url();
              const pageTitle = await newPages[i].title();
              console.log(`📄 Page ${i}: ${pageTitle} - ${pageUrl}`);
              
              // Check if this page has event-related content
              if (pageUrl.includes('DualMatches') || pageUrl.includes('Event') || pageUrl.includes('event') || pageTitle.includes('Event') || pageTitle.includes('Dual')) {
                console.log(`🎯 Found potential event page: ${pageTitle} - ${pageUrl}`);
                eventPage = newPages[i];
                
                // Try to get content from this page
                const eventContent = await newPages[i].evaluate(() => {
                  return {
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body.innerText.substring(0, 200),
                    hasTeamsFrame: !!document.querySelector('#teamsFrame'),
                    hasEventTeamFrame: !!document.querySelector('#eventTeamFrame'),
                    hasDataGrid: !!document.querySelector('.dataGrid'),
                    linkCount: document.querySelectorAll('a').length
                  };
                });
                console.log(`📋 Event page content:`, eventContent);
                break; // Found the event page, no need to check others
              }
            } catch (error) {
              console.log(`⚠️  Could not access page ${i}: ${error.message}`);
            }
          }
          
          // If we found an event page, switch to it
          if (eventPage) {
            console.log(`🔄 Switching to event page: ${await eventPage.title()}`);
            this.page = eventPage;
            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update iframeContent to point to the new page's main frame
            const frames = await this.page.frames();
            // Find the main frame (not tracking frames)
            let mainFrame = null;
            for (const frame of frames) {
              const frameUrl = frame.url();
              if (!frameUrl.includes('googletagmanager.com') && 
                  !frameUrl.includes('doubleclick.net') && 
                  !frameUrl.includes('google.com') &&
                  frameUrl !== 'about:blank') {
                mainFrame = frame;
                break;
              }
            }
            
            if (mainFrame) {
              this.iframeContent = mainFrame;
              console.log(`✅ Switched to event page and updated iframeContent to: ${mainFrame.url()}`);
            } else {
              console.log(`⚠️  Could not find main frame, using first frame`);
              this.iframeContent = frames[0];
            }
          } else {
            console.log(`⚠️  No event page found, continuing with original page`);
          }
          
          // Check if the current iframe content has changed (modal might have opened)
          const currentContent = await this.iframeContent.evaluate(() => {
            return {
              title: document.title,
              url: window.location.href,
              bodyText: document.body.innerText.substring(0, 300),
              hasTeamsFrame: !!document.querySelector('#teamsFrame'),
              hasEventTeamFrame: !!document.querySelector('#eventTeamFrame'),
              hasDataGrid: !!document.querySelector('.dataGrid'),
              linkCount: document.querySelectorAll('a').length,
              hasModal: !!document.querySelector('.modal, [class*="modal"], [id*="modal"]'),
              hasPopup: !!document.querySelector('.popup, [class*="popup"], [id*="popup"]'),
              modalCount: document.querySelectorAll('.modal, [class*="modal"], [id*="modal"]').length,
              iframeCount: document.querySelectorAll('iframe').length
            };
          });
          
          console.log(`📋 Current iframe content after JavaScript:`, currentContent);
          
          // Check for new frames (modal/popup windows)
          const newFrames = await this.page.frames();
          const newFrameCount = newFrames.length;
          console.log(`📊 Frames after JavaScript: ${newFrameCount} (${newFrameCount - initialFrameCount} new)`);
          
          // Look for a modal/popup frame with event details
          let eventFrame = null;
          for (const frame of newFrames) {
            try {
              const frameUrl = frame.url();
              console.log(`🔍 Checking frame: ${frameUrl}`);
              
              // Skip blank frames, main page frames, and error frames
              if (frameUrl === 'about:blank' || 
                  frameUrl.includes('MainFrame.jsp') || 
                  frameUrl.includes('Results.jsp') ||
                  frameUrl.includes('chrome-error://') ||
                  frameUrl.includes('MethodCaller.jsp') ||
                  frameUrl.includes('googletagmanager.com') ||
                  frameUrl.includes('doubleclick.net') ||
                  frameUrl.includes('amazon-adsystem.com') ||
                  frameUrl.includes('adnxs.com') ||
                  frameUrl.includes('pubmatic.com') ||
                  frameUrl.includes('tappx.com') ||
                  frameUrl.includes('rubiconproject.com') ||
                  frameUrl.includes('adform.net') ||
                  frameUrl.includes('google.com')) {
                continue;
              }
              
              // Try to access the frame content
              const frameContent = await frame.evaluate(() => {
                return {
                  title: document.title,
                  url: window.location.href,
                  bodyText: document.body.innerText.substring(0, 200),
                  hasTeamsFrame: !!document.querySelector('#teamsFrame'),
                  hasEventTeamFrame: !!document.querySelector('#eventTeamFrame'),
                  hasDataGrid: !!document.querySelector('.dataGrid'),
                  linkCount: document.querySelectorAll('a').length
                };
              });
              
              console.log(`📋 Frame content:`, frameContent);
              
              // If this frame has team-related content, use it
              if (frameContent.hasTeamsFrame || frameContent.hasEventTeamFrame || 
                  (frameContent.linkCount > 5 && frameContent.bodyText.length > 100)) {
                console.log(`✅ Found event detail frame: ${frameUrl}`);
                console.log(`📋 Frame details: links=${frameContent.linkCount}, text=${frameContent.bodyText.length} chars, teams=${frameContent.hasTeamsFrame}, eventTeams=${frameContent.hasEventTeamFrame}`);
                eventFrame = frame;
                break;
              }
            } catch (error) {
              console.log(`⚠️  Could not access frame: ${error.message}`);
              continue;
            }
          }
          
          // If we found an event frame, switch to it
          if (eventFrame) {
            console.log(`🔄 Switching to event detail frame`);
            this.iframeContent = eventFrame;
          } else {
            console.log(`⚠️  No event detail frame found, continuing with main iframe`);
            // Wait for teams frame to load in main iframe
            try {
              await this.iframeContent.waitForSelector('#teamsFrame', { timeout: 5000 });
            } catch (e) {
              console.log(`⚠️  Teams frame not found in main iframe either`);
            }
          }
        } else {
          // Regular URL navigation
          await this.iframeContent.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for teams frame to load in iframe
          try {
            await this.iframeContent.waitForSelector('#eventTeamFrame', { timeout: 10000 });
          } catch (e) {
            // Fallback to old selector
            await this.iframeContent.waitForSelector('#teamsFrame', { timeout: 10000 });
          }
        }
        
        // Get teams with pagination handling
        let allTeams = [];
        let pageNumber = 1;
        let hasNextPage = true;
        
        while (hasNextPage) {
          console.log(`📄 Processing teams page ${pageNumber}...`);
          
          const teams = await this.iframeContent.evaluate(() => {
            console.log('🔍 DEBUG: Starting team extraction...');
            
            // Look for teams in multiple possible locations
            let links = [];
            
            // Method 1: Look for specific team frame selectors (old structure)
            const teamsFrame = document.querySelector('#eventTeamFrame') || document.querySelector('#teamsFrame');
            console.log('🔍 DEBUG: Teams frame found:', !!teamsFrame);
            
            if (teamsFrame) {
              links = teamsFrame.querySelectorAll('a');
              console.log('🔍 DEBUG: Found', links.length, 'links in teams frame');
            } else {
              // Method 2: Look for teams in data grid (new structure)
              const dataGrid = document.querySelector('.dataGrid');
              console.log('🔍 DEBUG: Data grid found:', !!dataGrid);
              
              if (dataGrid) {
                links = dataGrid.querySelectorAll('a');
                console.log('🔍 DEBUG: Found', links.length, 'links in data grid');
              } else {
                // Method 3: Look for teams anywhere on the page
                const allLinks = document.querySelectorAll('a');
                console.log('🔍 DEBUG: Total links on page:', allLinks.length);
                
                links = Array.from(allLinks).filter(link => {
                  const text = link.textContent.trim();
                  // Filter for team-like links (not navigation, not empty)
                  return text.length > 0 && 
                         !text.toLowerCase().includes('next') && 
                         !text.toLowerCase().includes('previous') &&
                         !text.toLowerCase().includes('page') &&
                         !text.toLowerCase().includes('back') &&
                         !text.toLowerCase().includes('home') &&
                         !text.includes('javascript:') &&
                         text.length < 100; // Reasonable team name length
                });
                
                console.log('🔍 DEBUG: Filtered links:', links.length);
                console.log('🔍 DEBUG: Sample links:', Array.from(links).slice(0, 5).map(link => link.textContent.trim()));
              }
            }
            
            const result = Array.from(links).map((link, index) => ({
              index: index,
              text: link.textContent.trim(),
              href: link.href,
              onclick: link.getAttribute('onclick')
            }));
            
            console.log('🔍 DEBUG: Final team result:', result.length, 'teams');
            return result;
          });
          
          allTeams = allTeams.concat(teams);
          console.log(`✅ Found ${teams.length} teams on page ${pageNumber} (total: ${allTeams.length})`);
          
          // Check if there's a next page for teams
          const nextPageInfo = await this.iframeContent.evaluate(() => {
            const nextButton = document.querySelector('a.icon-arrow_r.dgNext');
            return {
              hasNext: !!nextButton,
              nextHref: nextButton ? nextButton.getAttribute('href') : null
            };
          });
          
          if (nextPageInfo.hasNext && nextPageInfo.nextHref) {
            console.log(`➡️  Found next teams page, navigating...`);
            
            // Click the next page button
            await this.iframeContent.evaluate(() => {
              const nextButton = document.querySelector('a.icon-arrow_r.dgNext');
              if (nextButton) {
                nextButton.click();
              }
            });
            
            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Wait for teams frame to load
            try {
              await this.iframeContent.waitForSelector('#eventTeamFrame', { timeout: 10000 });
            } catch (e) {
              await this.iframeContent.waitForSelector('#teamsFrame', { timeout: 10000 });
            }
            
            pageNumber++;
          } else {
            hasNextPage = false;
            console.log(`📄 No more team pages found. Total teams: ${allTeams.length}`);
          }
        }
        
        const teams = allTeams;
        
        console.log(`✅ Found ${teams.length} team links in iframe`);
        return teams;
      } else {
        // Fallback to main page navigation
        await this.page.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for teams frame to load
        await this.page.waitForSelector('#teamsFrame', { timeout: 10000 });
        
        const teams = await this.page.evaluate(() => {
          const teamsFrame = document.querySelector('#teamsFrame');
          if (!teamsFrame) return [];
          
          const links = teamsFrame.querySelectorAll('a');
          return Array.from(links).map(link => ({
            text: link.textContent.trim(),
            href: link.href
          }));
        });
        
        console.log(`✅ Found ${teams.length} team links`);
        return teams;
      }
    } catch (error) {
      console.error('❌ Failed to get team links:', error);
      throw error;
    }
  }

  /**
   * Get match data from current view (individual matches) and optionally click team links
   * @param {number} teamIndex - Index of the team link to click (optional)
   * @returns {Promise<Array>} Array of match data
   */
  async getMatchDataFromCurrentView(teamIndex = null) {
    try {
      if (!this.iframeContent) {
        throw new Error('No iframe content available');
      }
      
      // First, check if there are individual matches visible in the current view
      console.log('🔍 Checking for individual matches in current view...');
      
      const currentMatches = await this.iframeContent.evaluate(() => {
        const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
        const matchData = [];
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const weightClass = cells[1].textContent.trim();
            const matchCell = cells[2];
            
            // Get all text content from the match cell
            const matchText = matchCell.textContent.trim();
            const matchHtml = matchCell.innerHTML;
            
            // Check if this looks like an individual match (more specific patterns)
            const isIndividualMatch = (
              // MUST contain 'over' or 'vs' to be a match
              (matchText.toLowerCase().includes(' over ') || matchText.toLowerCase().includes(' vs ')) &&
              // Must have parentheses with result type
              (matchText.includes('(') && matchText.includes(')')) &&
              // Must not be tournament/event names (more comprehensive check)
              !matchText.toLowerCase().includes('tournament') &&
              !matchText.toLowerCase().includes('championship') &&
              !matchText.toLowerCase().includes('districts') &&
              !matchText.toLowerCase().includes('regionals') &&
              !matchText.toLowerCase().includes('state') &&
              !matchText.toLowerCase().includes('conference') &&
              !matchText.toLowerCase().includes('division') &&
              !matchText.toLowerCase().includes('uhsaa') &&
              !matchText.toLowerCase().includes('boys') &&
              !matchText.toLowerCase().includes('girls') &&
              !matchText.toLowerCase().includes('high school') &&
              !matchText.toLowerCase().includes('meet') &&
              !matchText.toLowerCase().includes('invitational')
            );
            
            matchData.push({
              weightClass: weightClass,
              matchText: matchText,
              matchHtml: matchHtml,
              isIndividualMatch: isIndividualMatch
            });
          }
        });
        
        return matchData;
      });
      
      console.log(`📊 Found ${currentMatches.length} rows in current view`);
      
      // Filter for individual matches
      const individualMatches = currentMatches.filter(match => match.isIndividualMatch);
      console.log(`🥊 Found ${individualMatches.length} individual matches in current view`);
      
      // Check if we found actual wrestling matches (not just tournament names)
      const actualWrestlingMatches = individualMatches.filter(match => {
        const text = match.matchText.toLowerCase();
        // Look for actual match patterns, not tournament names
        return (
          text.includes(' over ') || 
          text.includes(' by ') ||
          text.includes(' vs ') ||
          text.includes(' defeated ') ||
          text.includes(' def ') ||
          /\d+-\d+/.test(match.matchText) ||
          text.includes('decision') ||
          text.includes('major decision') ||
          text.includes('technical fall') ||
          text.includes('fall') ||
          text.includes('pin') ||
          text.includes('forfeit') ||
          text.includes('default') ||
          // Look for wrestler names (usually have first and last names)
          (text.includes(' ') && text.length > 10 && text.length < 200)
        );
      });
      
      if (actualWrestlingMatches.length > 0) {
        console.log(`✅ Found ${actualWrestlingMatches.length} actual wrestling matches in current view`);
        
        // Debug: Log first few matches to see the format
        console.log('🔍 Sample wrestling match data:');
        actualWrestlingMatches.slice(0, 3).forEach((match, index) => {
          console.log(`  Match ${index + 1}:`);
          console.log(`    Weight: ${match.weightClass}`);
          console.log(`    Text: ${match.matchText.substring(0, 100)}...`);
        });
        
        // Check if these are actually wrestling matches or still tournament info
        const hasRealMatches = actualWrestlingMatches.some(match => {
          const text = match.matchText.toLowerCase();
          return text.includes(' over ') || text.includes(' by ') || text.includes(' vs ') || /\d+-\d+/.test(match.matchText);
        });
        
        if (hasRealMatches) {
          console.log('✅ Found real wrestling matches in current view');
          return actualWrestlingMatches;
        } else {
          console.log('⚠️  Matches found but still tournament info, will need to click team links');
        }
      } else {
        console.log('⚠️  No actual wrestling matches found in current view, will need to click team links');
      }
      
      // If no individual matches found and teamIndex is provided, click on team link
      if (teamIndex !== null) {
        console.log(`🥊 No individual matches found, clicking team link at index: ${teamIndex}`);
        
        // Click on the team link by index
        await this.iframeContent.evaluate((index) => {
          let links = [];
          
          // Use the same logic as team extraction to find links
          const teamsFrame = document.querySelector('#eventTeamFrame') || document.querySelector('#teamsFrame');
          if (teamsFrame) {
            links = teamsFrame.querySelectorAll('a');
          } else {
            const dataGrid = document.querySelector('.dataGrid');
            if (dataGrid) {
              links = dataGrid.querySelectorAll('a');
            } else {
              const allLinks = document.querySelectorAll('a');
              links = Array.from(allLinks).filter(link => {
                const text = link.textContent.trim();
                return text.length > 0 && 
                       !text.toLowerCase().includes('next') && 
                       !text.toLowerCase().includes('previous') &&
                       !text.toLowerCase().includes('page') &&
                       !text.toLowerCase().includes('back') &&
                       !text.toLowerCase().includes('home') &&
                       !text.includes('javascript:') &&
                       text.length < 100;
              });
            }
          }
          
          if (index >= links.length) throw new Error(`Team index ${index} out of range, found ${links.length} links`);
          
          const link = links[index];
          console.log(`Clicking team link: ${link.textContent.trim()}`);
          link.click();
        }, teamIndex);
        
        // Wait for the page to load after clicking
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take a screenshot to see what we got after clicking team
        await this.screenshot(`after-clicking-team-${teamIndex}.png`);
        
        // Wait for data grid to load
        await this.iframeContent.waitForSelector('.dataGrid', { timeout: 10000 });
        
        // Debug: Check what's on the page after clicking team
        const pageInfoAfterClick = await this.iframeContent.evaluate(() => {
          const dataGrid = document.querySelector('.dataGrid');
          const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
          const allText = document.body.textContent.substring(0, 1000);
          
          return {
            hasDataGrid: !!dataGrid,
            rowCount: rows.length,
            pageTitle: document.title,
            currentUrl: window.location.href,
            sampleText: allText
          };
        });
        
        console.log('📊 Page info after clicking team:', pageInfoAfterClick);
        
        // Check if we're on a team selection page (need to click individual teams)
        const isTeamSelectionPage = await this.iframeContent.evaluate(() => {
          const bodyText = document.body.textContent.toLowerCase();
          return bodyText.includes('click on the team you would like to view results for') ||
                 bodyText.includes('select a team') ||
                 bodyText.includes('choose a team');
        });
        
        if (isTeamSelectionPage) {
          console.log('🔄 On team selection page, looking for individual team links...');
          
          // Look for individual team links in the page
          const individualTeamLinks = await this.iframeContent.evaluate(() => {
            const links = document.querySelectorAll('a');
            const teamLinks = [];
            
            links.forEach((link, index) => {
              const text = link.textContent.trim();
              const href = link.href;
              const onclick = link.getAttribute('onclick');
              
              // Look for team names (usually contain state abbreviations or school names)
              if (text.length > 0 && text.length < 100 && 
                  (text.includes(',') || text.includes('High School') || text.includes('Academy'))) {
                teamLinks.push({
                  index: index,
                  text: text,
                  href: href,
                  onclick: onclick,
                  hasJavaScript: onclick && onclick.startsWith('javascript:'),
                  hasHref: href && href !== 'javascript:void(0)'
                });
              }
            });
            
            return teamLinks;
          });
          
          // Also look for any JavaScript links that might navigate to matches
          const javascriptLinks = await this.iframeContent.evaluate(() => {
            const links = document.querySelectorAll('a');
            const jsLinks = [];
            
            links.forEach((link, index) => {
              const onclick = link.getAttribute('onclick');
              const text = link.textContent.trim();
              
              if (onclick && onclick.startsWith('javascript:')) {
                jsLinks.push({
                  index: index,
                  text: text,
                  onclick: onclick,
                  href: link.href
                });
              }
            });
            
            return jsLinks;
          });
          
          console.log(`🔗 Found ${javascriptLinks.length} JavaScript links`);
          if (javascriptLinks.length > 0) {
            console.log('🔗 Sample JavaScript links:');
            javascriptLinks.slice(0, 3).forEach((link, index) => {
              console.log(`  JS Link ${index + 1}: ${link.text} -> ${link.onclick.substring(0, 50)}...`);
            });
          }
          
          console.log(`🔗 Found ${individualTeamLinks.length} individual team links`);
          
          if (individualTeamLinks.length > 0) {
            // Click on the first individual team link
            const firstTeam = individualTeamLinks[0];
            console.log(`🏫 Clicking on individual team: ${firstTeam.text}`);
            
            // Click on the team link (this opens a new tab)
            try {
              console.log('🔄 Clicking team link (will open new tab)...');
              
              // Get current page count before clicking
              const pagesBefore = await this.browser.pages();
              const initialPageCount = pagesBefore.length;
              
              // Click on the team link
              await this.iframeContent.evaluate((index) => {
                const links = document.querySelectorAll('a');
                if (index < links.length) {
                  links[index].click();
                }
              }, firstTeam.index);
              
              // Wait for new tab to open
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Check if new tab opened
              const pagesAfter = await this.browser.pages();
              const newPageCount = pagesAfter.length;
              
              if (newPageCount > initialPageCount) {
                console.log(`✅ New tab opened! (${initialPageCount} -> ${newPageCount} pages)`);
                
                // Switch to the new tab (last opened tab)
                const newPage = pagesAfter[pagesAfter.length - 1];
                await newPage.bringToFront();
                
                // Wait for the new page to load
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Take a screenshot of the new tab
                await newPage.screenshot({ path: 'new-tab-matches.png' });
                
                // Get match data from the new tab
                const newTabMatches = await newPage.evaluate(() => {
                  const rows = document.querySelectorAll('.dataGrid tr.dataGridRow, table tr');
                  const matchData = [];
                  
                  rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                      const weightClass = cells[1]?.textContent.trim() || 'Unknown';
                      const matchCell = cells[2];
                      
                      const matchText = matchCell.textContent.trim();
                      
                      // Check if this looks like an individual match (more specific patterns)
                      const isIndividualMatch = (
                        // MUST contain 'over' or 'vs' to be a match
                        (matchText.toLowerCase().includes(' over ') || matchText.toLowerCase().includes(' vs ')) &&
                        // Must have parentheses with result type
                        (matchText.includes('(') && matchText.includes(')')) &&
                        // Must not be tournament/event names (more comprehensive check)
                        !matchText.toLowerCase().includes('tournament') &&
                        !matchText.toLowerCase().includes('championship') &&
                        !matchText.toLowerCase().includes('districts') &&
                        !matchText.toLowerCase().includes('regionals') &&
                        !matchText.toLowerCase().includes('state') &&
                        !matchText.toLowerCase().includes('conference') &&
                        !matchText.toLowerCase().includes('division') &&
                        !matchText.toLowerCase().includes('uhsaa') &&
                        !matchText.toLowerCase().includes('boys') &&
                        !matchText.toLowerCase().includes('girls') &&
                        !matchText.toLowerCase().includes('high school') &&
                        !matchText.toLowerCase().includes('meet') &&
                        !matchText.toLowerCase().includes('invitational')
                      );
                      
                      if (isIndividualMatch) {
                        matchData.push({
                          weightClass: weightClass,
                          matchText: matchText,
                          isIndividualMatch: true
                        });
                      }
                    }
                  });
                  
                  return matchData;
                });
                
                console.log(`🎯 Found ${newTabMatches.length} individual matches in new tab!`);
                
                if (newTabMatches.length > 0) {
                  console.log('🔍 Sample matches from new tab:');
                  newTabMatches.slice(0, 3).forEach((match, index) => {
                    console.log(`  Match ${index + 1}: ${match.weightClass} - ${match.matchText.substring(0, 100)}...`);
                  });
                  
                  // Close the new tab and return to original
                  await newPage.close();
                  
                  // Return the matches from the new tab
                  return newTabMatches;
                } else {
                  console.log('⚠️  No individual matches found in new tab');
                  await newPage.close();
                }
              } else {
                console.log('⚠️  No new tab opened, page might have changed in place');
              }
              
            } catch (error) {
              console.log('⚠️  Error handling new tab:', error.message);
            }
            
            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Take a screenshot to see what we got
            await this.screenshot(`after-clicking-individual-team.png`);
            
            // Wait for data grid to load
            await this.iframeContent.waitForSelector('.dataGrid', { timeout: 10000 });
            
            // Check if the page content has changed
            const pageAfterClick = await this.iframeContent.evaluate(() => {
              const bodyText = document.body.textContent;
              return {
                hasTeamSelection: bodyText.toLowerCase().includes('click on the team you would like to view results for'),
                hasMatchData: bodyText.toLowerCase().includes('over') || bodyText.toLowerCase().includes('by') || bodyText.toLowerCase().includes('vs'),
                currentUrl: window.location.href,
                pageTitle: document.title
              };
            });
            
            console.log('📊 Page status after clicking individual team:', pageAfterClick);
          }
        }
        
        // Get match data from the current page (individual matches should be visible)
        const teamMatches = await this.iframeContent.evaluate(() => {
          const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
          const matchData = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const weightClass = cells[1].textContent.trim();
              const matchCell = cells[2];
              
              // Get all text content from the match cell
              const matchText = matchCell.textContent.trim();
              const matchHtml = matchCell.innerHTML;
              
              // Check if this looks like an individual match (more specific patterns)
              const isIndividualMatch = (
                // MUST contain 'over' or 'vs' to be a match
                (matchText.toLowerCase().includes(' over ') || matchText.toLowerCase().includes(' vs ')) &&
                // Must have parentheses with result type
                (matchText.includes('(') && matchText.includes(')')) &&
                // Must not be tournament/event names (more comprehensive check)
                !matchText.toLowerCase().includes('tournament') &&
                !matchText.toLowerCase().includes('championship') &&
                !matchText.toLowerCase().includes('districts') &&
                !matchText.toLowerCase().includes('regionals') &&
                !matchText.toLowerCase().includes('state') &&
                !matchText.toLowerCase().includes('conference') &&
                !matchText.toLowerCase().includes('division') &&
                !matchText.toLowerCase().includes('uhsaa') &&
                !matchText.toLowerCase().includes('boys') &&
                !matchText.toLowerCase().includes('girls') &&
                !matchText.toLowerCase().includes('high school') &&
                !matchText.toLowerCase().includes('meet') &&
                !matchText.toLowerCase().includes('invitational')
              );
              
              matchData.push({
                weightClass: weightClass,
                matchText: matchText,
                matchHtml: matchHtml,
                isIndividualMatch: isIndividualMatch
              });
            }
          });
          
          return matchData;
        });
        
        // Also try to find matches in other possible locations
        const additionalMatches = await this.iframeContent.evaluate(() => {
          const allText = document.body.textContent;
          const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          const potentialMatches = [];
          
          lines.forEach((line, index) => {
            // Look for lines that contain match patterns
            if (line.toLowerCase().includes(' over ') || 
                line.toLowerCase().includes(' by ') ||
                line.toLowerCase().includes(' vs ') ||
                line.toLowerCase().includes(' defeated ') ||
                /\d+-\d+/.test(line)) {
              potentialMatches.push({
                lineNumber: index,
                text: line,
                isPotentialMatch: true
              });
            }
          });
          
          return potentialMatches;
        });
        
        // Look for matches in all possible table structures
        const allTableMatches = await this.iframeContent.evaluate(() => {
          const tables = document.querySelectorAll('table');
          const allMatches = [];
          
          tables.forEach((table, tableIndex) => {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
              const cells = row.querySelectorAll('td, th');
              cells.forEach((cell, cellIndex) => {
                const text = cell.textContent.trim();
                if (text.length > 0) {
                  allMatches.push({
                    tableIndex: tableIndex,
                    rowIndex: rowIndex,
                    cellIndex: cellIndex,
                    text: text,
                    hasMatchPattern: text.toLowerCase().includes(' over ') || 
                                   text.toLowerCase().includes(' by ') ||
                                   text.toLowerCase().includes(' vs ') ||
                                   text.toLowerCase().includes(' defeated ') ||
                                   /\d+-\d+/.test(text)
                  });
                }
              });
            });
          });
          
          return allMatches;
        });
        
        console.log(`🔍 Found ${allTableMatches.length} total table cells`);
        const matchCells = allTableMatches.filter(match => match.hasMatchPattern);
        console.log(`🔍 Found ${matchCells.length} cells with match patterns`);
        
        if (matchCells.length > 0) {
          console.log('🔍 Sample match cells:');
          matchCells.slice(0, 5).forEach((match, index) => {
            console.log(`  Match Cell ${index + 1}: ${match.text.substring(0, 100)}...`);
          });
        }
        
        // Look for matches in all possible divs and elements
        const allElementMatches = await this.iframeContent.evaluate(() => {
          const allElements = document.querySelectorAll('*');
          const elementMatches = [];
          
          allElements.forEach((element, index) => {
            const text = element.textContent.trim();
            if (text.length > 0 && text.length < 500) {
              const hasMatchPattern = text.toLowerCase().includes(' over ') || 
                                     text.toLowerCase().includes(' by ') ||
                                     text.toLowerCase().includes(' vs ') ||
                                     text.toLowerCase().includes(' defeated ') ||
                                     /\d+-\d+/.test(text);
              
              if (hasMatchPattern) {
                elementMatches.push({
                  tagName: element.tagName,
                  className: element.className,
                  id: element.id,
                  text: text,
                  hasMatchPattern: hasMatchPattern
                });
              }
            }
          });
          
          return elementMatches;
        });
        
        console.log(`🔍 Found ${allElementMatches.length} elements with match patterns`);
        
        if (allElementMatches.length > 0) {
          console.log('🔍 Sample elements with match patterns:');
          allElementMatches.slice(0, 5).forEach((match, index) => {
            console.log(`  Element ${index + 1}: <${match.tagName}> ${match.text.substring(0, 100)}...`);
          });
        }
        
        console.log(`🔍 Found ${additionalMatches.length} potential matches in page text`);
        if (additionalMatches.length > 0) {
          console.log('🔍 Sample potential matches:');
          additionalMatches.slice(0, 3).forEach((match, index) => {
            console.log(`  Potential Match ${index + 1}: ${match.text.substring(0, 100)}...`);
          });
        }
        
        console.log(`✅ Found ${teamMatches.length} rows after clicking team`);
        
        // Filter for individual matches
        const individualTeamMatches = teamMatches.filter(match => match.isIndividualMatch);
        console.log(`🥊 Found ${individualTeamMatches.length} individual matches after clicking team`);
        
        // Check if we found actual wrestling matches (not just tournament names)
        const actualWrestlingTeamMatches = individualTeamMatches.filter(match => {
          const text = match.matchText.toLowerCase();
          // Look for actual match patterns, not tournament names
          return (
            text.includes(' over ') || 
            text.includes(' by ') ||
            text.includes(' vs ') ||
            text.includes(' defeated ') ||
            text.includes(' def ') ||
            /\d+-\d+/.test(match.matchText) ||
            text.includes('decision') ||
            text.includes('major decision') ||
            text.includes('technical fall') ||
            text.includes('fall') ||
            text.includes('pin') ||
            text.includes('forfeit') ||
            text.includes('default') ||
            // Look for wrestler names (usually have first and last names)
            (text.includes(' ') && text.length > 10 && text.length < 200)
          );
        });
        
        console.log(`✅ Found ${actualWrestlingTeamMatches.length} actual wrestling matches after clicking team`);
        
        // Debug: Log first few matches to see the format
        if (actualWrestlingTeamMatches.length > 0) {
          console.log('🔍 Sample actual wrestling match data:');
          actualWrestlingTeamMatches.slice(0, 3).forEach((match, index) => {
            console.log(`  Match ${index + 1}:`);
            console.log(`    Weight: ${match.weightClass}`);
            console.log(`    Text: ${match.matchText.substring(0, 100)}...`);
          });
        }
        
        // Additional debugging: Check what's actually on the page
        const pageContent = await this.iframeContent.evaluate(() => {
          const allText = document.body.textContent;
          const tables = document.querySelectorAll('table');
          const dataGrids = document.querySelectorAll('.dataGrid');
          const rows = document.querySelectorAll('tr');
          
          return {
            totalTextLength: allText.length,
            tableCount: tables.length,
            dataGridCount: dataGrids.length,
            rowCount: rows.length,
            sampleText: allText.substring(0, 2000),
            hasMatchKeywords: allText.toLowerCase().includes('over') || allText.toLowerCase().includes('by') || allText.toLowerCase().includes('vs')
          };
        });
        
        console.log('📊 Detailed page analysis:', pageContent);
        
        return actualWrestlingTeamMatches;
      }
      
      // If no individual matches found and no team clicked, return empty array
      console.log('⚠️  No individual matches found in current view');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to get match data from current view:', error);
      throw error;
    }
  }

  /**
   * Get match data from a team page
   * @param {string} teamUrl - Team URL
   * @returns {Promise<Array>} Array of match data
   */
  async getMatchData(teamUrl) {
    try {
      console.log(`🥊 Getting match data from: ${teamUrl}`);
      
      // If we have iframe content, handle JavaScript links
      if (this.iframeContent) {
        // Check if this is a JavaScript link or empty URL
        if (teamUrl.startsWith('javascript:') || teamUrl === '') {
          console.log(`🔄 Team URL is JavaScript or empty: ${teamUrl}`);
          
          // For empty URLs, we might already be on the team page
          // Just wait for the data grid to load
          await this.iframeContent.waitForSelector('.dataGrid', { timeout: 10000 });
        } else {
          // Regular URL navigation
          await this.iframeContent.goto(teamUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for data grid to load in iframe
          await this.iframeContent.waitForSelector('.dataGrid', { timeout: 10000 });
        }
        
        const matches = await this.iframeContent.evaluate(() => {
          const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
          const matchData = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const weightClass = cells[1].textContent.trim();
              const matchCell = cells[2];
              
              // Get all text content from the match cell
              const matchText = matchCell.textContent.trim();
              const matchHtml = matchCell.innerHTML;
              
              matchData.push({
                weightClass: weightClass,
                matchText: matchText,
                matchHtml: matchHtml
              });
            }
          });
          
          return matchData;
        });
        
        console.log(`✅ Found ${matches.length} matches in iframe`);
        return matches;
      } else {
        // Fallback to main page navigation
        await this.page.goto(teamUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for data grid to load
        await this.page.waitForSelector('.dataGrid', { timeout: 10000 });
        
        const matches = await this.page.evaluate(() => {
          const rows = document.querySelectorAll('.dataGrid tr.dataGridRow');
          const matchData = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const weightClass = cells[1].textContent.trim();
              const matchCell = cells[2];
              
              // Get all text content from the match cell
              const matchText = matchCell.textContent.trim();
              const matchHtml = matchCell.innerHTML;
              
              matchData.push({
                weightClass: weightClass,
                matchText: matchText,
                matchHtml: matchHtml
              });
            }
          });
          
          return matchData;
        });
        
        console.log(`✅ Found ${matches.length} matches`);
        return matches;
      }
    } catch (error) {
      console.error('❌ Failed to get match data:', error);
      throw error;
    }
  }

  /**
   * Close browser
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Browser closed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to close browser:', error);
    }
  }

  /**
   * Take a screenshot for debugging
   * @param {string} filename - Screenshot filename
   * @returns {Promise<void>}
   */
  async screenshot(filename = 'debug.png') {
    try {
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error);
    }
  }
}

module.exports = new TrackWrestlingBrowserService();
