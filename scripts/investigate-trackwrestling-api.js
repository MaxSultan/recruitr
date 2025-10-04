const puppeteer = require('puppeteer');

async function investigateTrackWrestlingAPI() {
    console.log('🔍 Investigating TrackWrestling for undocumented APIs...');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Keep visible to see network requests
        devtools: true  // Open dev tools automatically
    });
    
    const page = await browser.newPage();
    
    // Listen for network requests
    const requests = [];
    page.on('request', request => {
        if (request.url().includes('trackwrestling.com') && 
            (request.url().includes('api') || 
             request.url().includes('ajax') || 
             request.url().includes('json') ||
             request.url().includes('data'))) {
            requests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData()
            });
        }
    });
    
    try {
        console.log('🌐 Navigating to TrackWrestling...');
        await page.goto('https://www.trackwrestling.com/seasons/Results.jsp');
        
        console.log('📋 Looking for season selection...');
        await page.waitForTimeout(3000);
        
        // Try to find and click season
        const seasonLinks = await page.$$eval('a', links => 
            links.map(link => ({
                text: link.textContent.trim(),
                href: link.href
            })).filter(link => link.text.includes('2024-25'))
        );
        
        console.log('📅 Found seasons:', seasonLinks);
        
        if (seasonLinks.length > 0) {
            console.log('🖱️ Clicking on season...');
            await page.click(`a[href="${seasonLinks[0].href}"]`);
            await page.waitForTimeout(3000);
        }
        
        console.log('📊 Network requests captured:', requests.length);
        requests.forEach((req, index) => {
            console.log(`\n${index + 1}. ${req.method} ${req.url}`);
            if (req.postData) {
                console.log(`   POST Data: ${req.postData}`);
            }
            if (req.headers) {
                console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
            }
        });
        
        // Also check for any JavaScript variables that might contain data
        console.log('\n🔍 Checking for JavaScript data objects...');
        const jsData = await page.evaluate(() => {
            const data = {};
            
            // Check for common data variable names
            const dataVars = ['data', 'results', 'events', 'matches', 'teams', 'seasonData'];
            dataVars.forEach(varName => {
                try {
                    if (window[varName]) {
                        data[varName] = window[varName];
                    }
                } catch (e) {
                    // Variable doesn't exist
                }
            });
            
            // Check for data in script tags
            const scripts = Array.from(document.querySelectorAll('script')).map(script => script.textContent);
            data.scripts = scripts.filter(script => 
                script.includes('trackwrestling') || 
                script.includes('events') || 
                script.includes('matches')
            );
            
            return data;
        });
        
        console.log('📄 JavaScript data found:', JSON.stringify(jsData, null, 2));
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
    } finally {
        console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        await browser.close();
    }
}

investigateTrackWrestlingAPI().catch(console.error);


