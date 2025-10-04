const trackwrestlingBrowserService = require('../services/browser/trackwrestlingBrowserService');

async function investigatePagination() {
    console.log('🔍 Investigating TrackWrestling pagination system');
    console.log('📊 Looking for all possible ways to access more events');
    console.log('');
    
    try {
        await trackwrestlingBrowserService.initialize({ headless: false }); // Show browser for debugging
        await trackwrestlingBrowserService.navigateToSeasons();
        await trackwrestlingBrowserService.selectSeason('2024-25 High School Boys');
        await trackwrestlingBrowserService.selectState('50');
        
        // Wait for user to manually inspect
        console.log('🔍 Browser is now open for manual inspection');
        console.log('📋 Please check:');
        console.log('   1. Are there pagination controls at the bottom?');
        console.log('   2. Are there filters that might limit results?');
        console.log('   3. Is there a "Show All" or "View All" option?');
        console.log('   4. Are there different views (list, grid, etc.)?');
        console.log('   5. Check the URL for pagination parameters');
        console.log('');
        console.log('⏳ Browser will stay open for 60 seconds for inspection...');
        
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Now let's programmatically investigate
        console.log('\n🔍 Programmatically investigating pagination...');
        
        const pageInfo = await trackwrestlingBrowserService.page.evaluate(() => {
            // Get all pagination-related elements
            const paginationElements = document.querySelectorAll('.pagination, .dgPagination, .pager, .page-nav, [class*="page"], [class*="pagination"]');
            
            // Get all links that might be pagination
            const allLinks = Array.from(document.querySelectorAll('a'));
            const possiblePaginationLinks = allLinks.filter(link => {
                const text = link.textContent.toLowerCase();
                const href = link.href || '';
                const onclick = link.getAttribute('onclick') || '';
                
                return text.includes('next') || 
                       text.includes('more') || 
                       text.includes('page') ||
                       text.includes('all') ||
                       href.includes('page') ||
                       onclick.includes('next') ||
                       onclick.includes('page');
            });
            
            // Check for any filters or dropdowns
            const filters = document.querySelectorAll('select, input[type="checkbox"], .filter, [class*="filter"]');
            
            // Check for "Show All" or similar options
            const showAllElements = allLinks.filter(link => {
                const text = link.textContent.toLowerCase();
                return text.includes('show all') || 
                       text.includes('view all') || 
                       text.includes('all events') ||
                       text.includes('expand');
            });
            
            // Get current URL and check for parameters
            const currentUrl = window.location.href;
            
            // Count total rows in the data grid
            const dataRows = document.querySelectorAll('.dataGrid tr.dataGridRow');
            
            return {
                currentUrl,
                totalDataRows: dataRows.length,
                paginationElements: Array.from(paginationElements).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    textContent: el.textContent.substring(0, 100),
                    innerHTML: el.innerHTML.substring(0, 200)
                })),
                possiblePaginationLinks: possiblePaginationLinks.map(link => ({
                    text: link.textContent,
                    href: link.href,
                    onclick: link.getAttribute('onclick'),
                    className: link.className
                })),
                filters: Array.from(filters).map(filter => ({
                    tagName: filter.tagName,
                    type: filter.type,
                    className: filter.className,
                    name: filter.name,
                    options: filter.tagName === 'SELECT' ? Array.from(filter.options).map(opt => ({
                        value: opt.value,
                        text: opt.textContent
                    })) : null
                })),
                showAllElements: showAllElements.map(el => ({
                    text: el.textContent,
                    href: el.href,
                    onclick: el.getAttribute('onclick')
                }))
            };
        });
        
        console.log('\n📊 Investigation Results:');
        console.log(`   Current URL: ${pageInfo.currentUrl}`);
        console.log(`   Total data rows: ${pageInfo.totalDataRows}`);
        
        console.log('\n🔗 Pagination Elements:');
        pageInfo.paginationElements.forEach((el, index) => {
            console.log(`   ${index + 1}. ${el.tagName}.${el.className}: ${el.textContent}`);
        });
        
        console.log('\n➡️ Possible Pagination Links:');
        pageInfo.possiblePaginationLinks.forEach((link, index) => {
            console.log(`   ${index + 1}. "${link.text}" - ${link.href || link.onclick}`);
        });
        
        console.log('\n🔧 Filters:');
        pageInfo.filters.forEach((filter, index) => {
            console.log(`   ${index + 1}. ${filter.tagName} ${filter.type || ''} ${filter.name || ''}`);
            if (filter.options) {
                filter.options.forEach(opt => {
                    console.log(`      - ${opt.value}: ${opt.text}`);
                });
            }
        });
        
        console.log('\n📋 Show All Elements:');
        pageInfo.showAllElements.forEach((el, index) => {
            console.log(`   ${index + 1}. "${el.text}" - ${el.href || el.onclick}`);
        });
        
        // Try to find and click "Show All" if it exists
        if (pageInfo.showAllElements.length > 0) {
            console.log('\n🔄 Attempting to click "Show All" element...');
            try {
                await trackwrestlingBrowserService.page.evaluate(() => {
                    const showAllLinks = Array.from(document.querySelectorAll('a')).filter(link => {
                        const text = link.textContent.toLowerCase();
                        return text.includes('show all') || text.includes('view all') || text.includes('all events');
                    });
                    
                    if (showAllLinks.length > 0) {
                        showAllLinks[0].click();
                        return true;
                    }
                    return false;
                });
                
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check new row count
                const newRowCount = await trackwrestlingBrowserService.page.evaluate(() => {
                    return document.querySelectorAll('.dataGrid tr.dataGridRow').length;
                });
                
                console.log(`📊 New row count after "Show All": ${newRowCount}`);
                
            } catch (error) {
                console.log('❌ Failed to click "Show All":', error.message);
            }
        }
        
        await trackwrestlingBrowserService.close();
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
        await trackwrestlingBrowserService.close();
    }
}

investigatePagination().then(() => {
    console.log('✅ Pagination investigation completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


