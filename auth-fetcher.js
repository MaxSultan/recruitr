const puppeteer = require('puppeteer');
const { URL } = require('url');

class AuthFetcher {
  constructor(tournamentId) {
    this.tournamentId = tournamentId;
  }

  async call() {
    let browser;
    let page;
    
    try {
      console.log('Launching browser...');
      browser = await puppeteer.launch({ 
        headless: false,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('Visiting Trackwrestling');
      const url = `https://www.trackwrestling.com/predefinedtournaments/VerifyPassword.jsp?tournamentId=${this.tournamentId}`;
      
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
      }
      
      console.log('Waiting for page to fully load...');
      
      // Wait for the page content to load
      await page.waitForSelector('body', { timeout: 30000 });
      
      console.log('Page loaded, extracting session ID from HTML...');
      
      // Look for twSessionId in the HTML content (hidden input field)
      let twSessionId = await page.evaluate(() => {
        // Try to find the hidden input field first
        const sessionInput = document.getElementById('twSessionId');
        if (sessionInput && sessionInput.value) {
          return sessionInput.value;
        }
        
        // Fallback: search in page content
        const pageContent = document.body.innerHTML;
        const sessionMatch = pageContent.match(/twSessionId["\s]*[=:]["\s]*([^&\s"'<>]+)/);
        if (sessionMatch && sessionMatch[1]) {
          return sessionMatch[1];
        }
        
        return null;
      });
      
      if (!twSessionId) {
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // Last resort: check URL for session ID
        const parsedUrl = new URL(currentUrl);
        const urlSessionId = parsedUrl.searchParams.get('twSessionId');
        if (urlSessionId) {
          twSessionId = urlSessionId;
        } else {
          throw new Error(`Failed to extract twSessionId from page. URL: ${currentUrl}`);
        }
      }
      
      console.log('Found session ID:', twSessionId);
      
      console.log('Parsing Cookies');
      const cookies = await page.cookies();
      const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
      
      console.log('Auth Received - Session ID:', twSessionId);
      return {
        twSessionId: twSessionId,
        cookie: cookieString
      };
      
    } catch (error) {
      console.error('Error in AuthFetcher:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    } finally {
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
        if (browser) {
          console.log('Shutting down browser');
          await browser.close();
        }
      } catch (closeError) {
        console.error('Error closing browser:', closeError.message);
      }
    }
  }
}

module.exports = AuthFetcher;
