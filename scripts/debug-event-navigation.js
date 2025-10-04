const browserService = require('../services/browser/trackwrestlingBrowserService');

async function debugEventNavigation() {
    console.log('🔍 Debugging event navigation...');
    
    try {
        await browserService.initialize();
        console.log('✅ Browser initialized');
        
        // Navigate to seasons page
        await browserService.navigateToSeasons();
        console.log('✅ Navigated to seasons');
        
        // Find and click the season
        await browserService.selectSeason('2024-25 High School Boys');
        console.log('✅ Found and clicked season');
        
        // Select state
        await browserService.selectState('50');
        console.log('✅ Selected state 50');
        
        // Get events
        const events = await browserService.getEventLinks();
        
        if (events.length === 0) {
            console.log('❌ No events found');
            return;
        }
        
        console.log(`📅 Found ${events.length} events`);
        console.log(`🎯 Testing navigation with first event: ${events[0].text}`);
        
        // Try to navigate to the first event
        const eventUrl = events[0].href;
        console.log(`🔗 Event URL: ${eventUrl}`);
        
        // Navigate to event (this method handles navigation internally)
        const teams = await browserService.getTeamLinks(eventUrl);
        console.log('✅ Navigated to event and got teams');
        
        // Take a screenshot to see what we're looking at
        await browserService.screenshot('debug-event-page.png');
        
        // Check what's on the current page
        const pageInfo = await browserService.iframeContent.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 500),
                hasTeamsFrame: !!document.querySelector('#teamsFrame'),
                hasEventTeamFrame: !!document.querySelector('#eventTeamFrame'),
                hasDataGrid: !!document.querySelector('.dataGrid'),
                linkCount: document.querySelectorAll('a').length,
                tableCount: document.querySelectorAll('table').length,
                modalCount: document.querySelectorAll('.modal, [class*="modal"]').length,
                iframeCount: document.querySelectorAll('iframe').length
            };
        });
        
        console.log('📊 Page info after navigation:');
        console.log(JSON.stringify(pageInfo, null, 2));
        
        // Check if there are any new iframes or windows
        const frames = await browserService.page.frames();
        console.log(`🪟 Total frames: ${frames.length}`);
        frames.forEach((frame, index) => {
            console.log(`   Frame ${index}: ${frame.url()}`);
        });
        
        // Wait a bit to see if anything loads
        console.log('⏳ Waiting 10 seconds to see if anything loads...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Take another screenshot
        await browserService.screenshot('debug-event-page-after-wait.png');
        
        // Check page info again
        const pageInfoAfter = await browserService.iframeContent.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                bodyText: document.body.innerText.substring(0, 500),
                hasTeamsFrame: !!document.querySelector('#teamsFrame'),
                hasEventTeamFrame: !!document.querySelector('#eventTeamFrame'),
                hasDataGrid: !!document.querySelector('.dataGrid'),
                linkCount: document.querySelectorAll('a').length,
                tableCount: document.querySelectorAll('table').length,
                modalCount: document.querySelectorAll('.modal, [class*="modal"]').length,
                iframeCount: document.querySelectorAll('iframe').length
            };
        });
        
        console.log('📊 Page info after waiting:');
        console.log(JSON.stringify(pageInfoAfter, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await browserService.close();
        console.log('✅ Browser closed');
    }
}

debugEventNavigation();
