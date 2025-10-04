const browserService = require('../services/browser/trackwrestlingBrowserService');

async function debugMatchDetection() {
    console.log('🔍 Debugging match detection logic...');
    
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
        
        // Try to navigate to the first event
        const eventUrl = events[0].href;
        console.log(`🔗 Event URL: ${eventUrl}`);
        
        // Navigate to event (this method handles navigation internally)
        const teams = await browserService.getTeamLinks(eventUrl);
        console.log(`🏫 Found ${teams.length} teams`);
        
        if (teams.length > 0) {
            // Click on the first team to see what data we get
            console.log(`🏫 Clicking on first team: ${teams[0].text}`);
            
            // Get the raw page content to see what we're working with
            const rawContent = await browserService.iframeContent.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body.textContent.substring(0, 1000),
                    hasDataGrid: !!document.querySelector('.dataGrid'),
                    dataGridRows: document.querySelectorAll('.dataGrid tr').length,
                    sampleRows: Array.from(document.querySelectorAll('.dataGrid tr')).slice(0, 5).map(row => ({
                        html: row.innerHTML,
                        text: row.textContent
                    }))
                };
            });
            
            console.log('📊 Raw page content:', rawContent);
            
            // Try to extract matches with a more permissive approach
            const matches = await browserService.iframeContent.evaluate(() => {
                const rows = document.querySelectorAll('.dataGrid tr');
                const matches = [];
                
                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const weightClass = cells[1]?.textContent?.trim() || '';
                        const matchCell = cells[2];
                        const matchText = matchCell?.textContent?.trim() || '';
                        
                        // More permissive match detection
                        const isPotentialMatch = (
                            matchText.length > 10 && // Must have some content
                            !matchText.toLowerCase().includes('weight') && // Not a header
                            !matchText.toLowerCase().includes('summary') && // Not a header
                            (matchText.includes('(') || matchText.includes('over') || matchText.includes('vs') || matchText.includes('by'))
                        );
                        
                        if (isPotentialMatch) {
                            matches.push({
                                rowIndex: index,
                                weightClass: weightClass,
                                matchText: matchText,
                                isPotentialMatch: true
                            });
                        }
                    }
                });
                
                return matches;
            });
            
            console.log(`🥊 Found ${matches.length} potential matches:`);
            matches.forEach((match, index) => {
                console.log(`   ${index + 1}. ${match.weightClass}: ${match.matchText}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await browserService.close();
        console.log('✅ Browser closed');
    }
}

debugMatchDetection();


