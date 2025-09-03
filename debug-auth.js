const puppeteer = require('puppeteer');

async function testAuth() {
  let browser;
  let page;
  
  try {
    console.log('Starting debug auth test...');
    
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    const tournamentId = '854866132';
    const url = `https://www.trackwrestling.com/predefinedtournaments/VerifyPassword.jsp?tournamentId=${tournamentId}`;
    
    console.log('Navigating to:', url);
    
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('Response status:', response.status());
    console.log('Response URL:', response.url());
    
    // Wait a bit and check what happened
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log('Current URL after wait:', currentUrl);
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page content to see what we're dealing with
    const content = await page.content();
    console.log('Page contains "twSessionId":', content.includes('twSessionId'));
    console.log('Page contains "tournament":', content.includes('tournament'));
    console.log('Page contains "error":', content.includes('error'));
    
    // Check for any error messages
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text (first 500 chars):', bodyText.substring(0, 500));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      // Keep browser open for 10 seconds to see what happened
      console.log('Keeping browser open for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

testAuth();
