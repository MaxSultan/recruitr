const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function debugScraperHang() {
    console.log('🔍 Debugging scraper hang issue...');
    
    try {
        console.log('1. Testing scraper service import...');
        console.log('✅ Scraper service imported successfully');
        
        console.log('2. Testing scraper method availability...');
        console.log('✅ scrapeMatches method exists:', typeof trackwrestlingScraperService.scrapeMatches);
        
        console.log('3. Testing minimal scraper call with timeout...');
        
        // Create a promise that resolves after 10 seconds
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.log('⏰ 10 second timeout reached - scraper is hanging');
                resolve({ timeout: true });
            }, 10000);
        });
        
        // Create the scraper promise
        const scraperPromise = trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50',
            headless: true,
            maxEvents: 1, // Just 1 event
            maxTeams: 5   // Only 5 teams for quick test
        });
        
        // Race between scraper and timeout
        const result = await Promise.race([scraperPromise, timeoutPromise]);
        
        if (result.timeout) {
            console.log('❌ Scraper is hanging - likely browser or database issue');
        } else {
            console.log('✅ Scraper completed successfully:', result);
        }
        
    } catch (error) {
        console.error('❌ Error during debug:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

debugScraperHang().then(() => {
    console.log('🔍 Debug completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
});


