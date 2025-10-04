const puppeteer = require('puppeteer');

async function captureBrowserHeaders() {
    console.log('🔍 Capturing exact browser headers from TrackWrestling...');
    
    const browser = await puppeteer.launch({
        headless: false, // Keep visible to see what's happening
        devtools: true
    });
    
    const page = await browser.newPage();
    
    // Capture all network requests
    const requests = [];
    
    page.on('request', request => {
        if (request.url().includes('trackwrestling.com')) {
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
        await page.goto('https://www.trackwrestling.com/seasons/Results.jsp', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('⏳ Waiting for requests to complete...');
        await page.waitForTimeout(5000);
        
        console.log(`📊 Captured ${requests.length} requests:`);
        
        requests.forEach((req, index) => {
            console.log(`\n${index + 1}. ${req.method} ${req.url}`);
            console.log('   Headers:');
            Object.entries(req.headers).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
            });
            
            if (req.postData) {
                console.log(`   POST Data: ${req.postData}`);
            }
        });
        
        // Also check what headers the page is currently sending
        console.log('\n🔍 Current page headers:');
        const currentHeaders = await page.evaluate(() => {
            return {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            };
        });
        
        console.log('   Browser Info:', JSON.stringify(currentHeaders, null, 2));
        
        // Check if we successfully loaded the page
        const pageTitle = await page.title();
        console.log(`\n📄 Page Title: ${pageTitle}`);
        
        const pageContent = await page.content();
        const hasContent = pageContent.length > 1000;
        console.log(`📊 Page loaded successfully: ${hasContent ? 'Yes' : 'No'}`);
        console.log(`📏 Page content length: ${pageContent.length} characters`);
        
        if (hasContent) {
            console.log('\n✅ SUCCESS! Browser can access TrackWrestling');
            console.log('🎯 Now we can replicate these exact headers in our HTTP requests');
            
            // Extract the working headers
            if (requests.length > 0) {
                const workingRequest = requests[0];
                console.log('\n📋 Working headers to use:');
                console.log(JSON.stringify(workingRequest.headers, null, 2));
            }
        } else {
            console.log('\n❌ Browser also failed to load content');
        }
        
    } catch (error) {
        console.error('❌ Browser navigation failed:', error.message);
    } finally {
        console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

captureBrowserHeaders().catch(console.error);


