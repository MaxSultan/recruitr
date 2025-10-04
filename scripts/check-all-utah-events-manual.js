const trackwrestlingBrowserService = require('../services/browser/trackwrestlingBrowserService');

async function checkAllUtahEventsManual() {
    console.log('🔍 Manual check of Utah 2024-25 events');
    console.log('📊 This will help us understand the actual number of events');
    console.log('');
    
    try {
        await trackwrestlingBrowserService.initialize({ headless: false }); // Show browser
        await trackwrestlingBrowserService.navigateToSeasons();
        await trackwrestlingBrowserService.selectSeason('2024-25 High School Boys');
        await trackwrestlingBrowserService.selectState('50');
        
        console.log('🔍 Browser is open for manual inspection');
        console.log('📋 Please manually check the following:');
        console.log('');
        console.log('1. Look at the events list in the browser');
        console.log('2. Count the total number of events visible');
        console.log('3. Check if there are pagination controls');
        console.log('4. Look for any "Show All" or "View All" options');
        console.log('5. Check if events are grouped by date or type');
        console.log('6. Note any filters or search options');
        console.log('');
        console.log('⏳ Browser will stay open for 2 minutes...');
        
        await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
        
        // After manual inspection, let's try to get the events programmatically
        console.log('\n🔍 Now trying to get events programmatically...');
        
        // Try to get events using the existing method
        const events = await trackwrestlingBrowserService.getEventLinks();
        
        console.log(`\n📊 Programmatic Results:`);
        console.log(`   Events found: ${events.length}`);
        
        if (events.length > 0) {
            console.log(`   First event: ${events[0].text}`);
            console.log(`   Last event: ${events[events.length - 1].text}`);
            
            // Group by date
            const eventsByDate = {};
            events.forEach(event => {
                const date = event.dateText;
                if (!eventsByDate[date]) {
                    eventsByDate[date] = [];
                }
                eventsByDate[date].push(event);
            });
            
            console.log(`\n📅 Events by date:`);
            Object.keys(eventsByDate).sort().forEach(date => {
                console.log(`   ${date}: ${eventsByDate[date].length} events`);
            });
        }
        
        // Try to check if there are more events by looking at the page source
        console.log('\n🔍 Checking page source for clues...');
        
        const pageSource = await trackwrestlingBrowserService.page.content();
        
        // Look for pagination indicators in the HTML
        const paginationMatches = pageSource.match(/page.*\d+.*of.*\d+/gi) || [];
        const totalMatches = pageSource.match(/total.*\d+/gi) || [];
        const countMatches = pageSource.match(/\d+.*events?/gi) || [];
        
        console.log(`   Pagination indicators: ${paginationMatches.join(', ')}`);
        console.log(`   Total indicators: ${totalMatches.join(', ')}`);
        console.log(`   Count indicators: ${countMatches.join(', ')}`);
        
        await trackwrestlingBrowserService.close();
        
        // Final assessment
        console.log('\n🎯 Assessment:');
        if (events.length >= 200) {
            console.log('✅ Found comprehensive event list (200+ events)');
        } else if (events.length >= 100) {
            console.log('⚠️ Found many events but may not be complete');
        } else if (events.length >= 50) {
            console.log('⚠️ Found moderate number of events, likely incomplete');
        } else {
            console.log('❌ Found very few events, likely an issue');
        }
        
        console.log('\n💡 Recommendations:');
        if (events.length < 200) {
            console.log('   - Check if there are filters limiting results');
            console.log('   - Look for "Show All" or "View All" options');
            console.log('   - Check if events are in different categories');
            console.log('   - Verify the season/state selection is correct');
        }
        
    } catch (error) {
        console.error('❌ Manual check failed:', error);
        await trackwrestlingBrowserService.close();
    }
}

checkAllUtahEventsManual().then(() => {
    console.log('✅ Manual check completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


