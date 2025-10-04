const axios = require('axios');
const cheerio = require('cheerio');

class CorrectHeadersTrackWrestlingScraper {
    constructor() {
        this.baseUrl = 'https://www.trackwrestling.com';
        this.session = axios.create({
            headers: {
                // Match exactly what Chrome sends
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive'
            },
            timeout: 30000
        });
    }

    async testCorrectHeaders() {
        console.log('🔍 Testing with correct browser headers...');
        
        const testUrls = [
            this.baseUrl,
            `${this.baseUrl}/seasons/Results.jsp`,
            `${this.baseUrl}/seasons/MainFrame.jsp`
        ];
        
        for (const url of testUrls) {
            try {
                console.log(`\n🔗 Testing: ${url}`);
                
                const response = await this.session.get(url);
                
                console.log(`✅ Success! Status: ${response.status}`);
                console.log(`📄 Content-Type: ${response.headers['content-type']}`);
                console.log(`📏 Content-Length: ${response.headers['content-length'] || 'Unknown'}`);
                
                // Check if we got actual content
                const $ = cheerio.load(response.data);
                const title = $('title').text().trim();
                console.log(`📋 Page Title: ${title}`);
                
                // Look for specific TrackWrestling elements
                const hasTrackWrestlingContent = response.data.includes('trackwrestling') || 
                                               response.data.includes('TrackWrestling') ||
                                               $('body').text().includes('wrestling');
                console.log(`🥊 Has wrestling content: ${hasTrackWrestlingContent ? 'Yes' : 'No'}`);
                
                // Look for forms or login requirements
                const hasLoginForm = $('form[action*="login"], input[name*="password"], input[type="password"]').length > 0;
                console.log(`🔐 Requires login: ${hasLoginForm ? 'Yes' : 'No'}`);
                
                // Look for navigation or data
                const linkCount = $('a[href]').length;
                const formCount = $('form').length;
                const tableCount = $('table').length;
                
                console.log(`📊 Page elements: ${linkCount} links, ${formCount} forms, ${tableCount} tables`);
                
                // If this is the results page, look for event/team data
                if (url.includes('Results')) {
                    await this.analyzeResultsPage($, response.data);
                }
                
                return response; // Return successful response
                
            } catch (error) {
                console.log(`❌ Failed: ${error.response?.status || error.message}`);
                if (error.response?.status === 406) {
                    console.log('   🔧 Still getting 406 - headers might need more adjustment');
                }
            }
        }
        
        return null;
    }

    async analyzeResultsPage($, html) {
        console.log('\n📊 Analyzing results page structure...');
        
        // Look for event links
        const eventLinks = [];
        $('a[href*="event"], a[href*="Event"]').each((i, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text && href && text.length > 5) {
                eventLinks.push({ text, href });
            }
        });
        
        console.log(`📅 Found ${eventLinks.length} event links`);
        if (eventLinks.length > 0) {
            console.log('   Sample events:');
            eventLinks.slice(0, 5).forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.text} -> ${event.href}`);
            });
        }
        
        // Look for team links
        const teamLinks = [];
        $('a[href*="team"], a[href*="Team"]').each((i, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text && href && text.length > 2 && text.length < 50) {
                teamLinks.push({ text, href });
            }
        });
        
        console.log(`🏫 Found ${teamLinks.length} team links`);
        if (teamLinks.length > 0) {
            console.log('   Sample teams:');
            teamLinks.slice(0, 5).forEach((team, i) => {
                console.log(`   ${i + 1}. ${team.text} -> ${team.href}`);
            });
        }
        
        // Look for JavaScript that might contain data
        const scripts = $('script').map((i, script) => $(script).html()).get();
        const dataScripts = scripts.filter(script => 
            script.includes('events') || 
            script.includes('teams') || 
            script.includes('matches') ||
            script.includes('trackwrestling')
        );
        
        console.log(`📜 Found ${dataScripts.length} scripts with potential data`);
        
        // Look for hidden form fields that might contain session data
        const hiddenInputs = $('input[type="hidden"]').map((i, input) => ({
            name: $(input).attr('name'),
            value: $(input).attr('value')
        })).get();
        
        if (hiddenInputs.length > 0) {
            console.log(`🔑 Found ${hiddenInputs.length} hidden form fields:`);
            hiddenInputs.forEach(input => {
                console.log(`   ${input.name}: ${input.value}`);
            });
        }
    }

    async testSeasonAccess(seasonName = '2024-25 High School Boys', stateId = '50') {
        console.log(`\n🎯 Testing season-specific access...`);
        
        const seasonUrls = [
            `${this.baseUrl}/seasons/Results.jsp?season=${encodeURIComponent(seasonName)}`,
            `${this.baseUrl}/seasons/Results.jsp?stateId=${stateId}`,
            `${this.baseUrl}/seasons/Results.jsp?season=${encodeURIComponent(seasonName)}&stateId=${stateId}`,
            `${this.baseUrl}/seasons/MainFrame.jsp?season=${encodeURIComponent(seasonName)}`,
            `${this.baseUrl}/seasons/Results.jsp?seasonId=${stateId}`
        ];
        
        for (const url of seasonUrls) {
            try {
                console.log(`\n🔗 Testing season URL: ${url}`);
                
                const response = await this.session.get(url);
                
                if (response.status === 200) {
                    console.log(`✅ Success! Status: ${response.status}`);
                    
                    const $ = cheerio.load(response.data);
                    
                    // Check if we got the right season data
                    const hasSeasonData = response.data.includes(seasonName) || 
                                        response.data.includes('2024-25') ||
                                        response.data.includes('High School Boys');
                    
                    console.log(`📅 Contains season data: ${hasSeasonData ? 'Yes' : 'No'}`);
                    
                    if (hasSeasonData) {
                        await this.analyzeResultsPage($, response.data);
                        return response; // Return the successful response
                    }
                }
                
            } catch (error) {
                console.log(`❌ Failed: ${error.response?.status || error.message}`);
            }
        }
        
        return null;
    }

    async scrapeUtahWithCorrectHeaders() {
        console.log('🏆 Starting TrackWrestling scraping with correct headers...');
        
        try {
            // Test basic access
            const basicResponse = await this.testCorrectHeaders();
            
            if (!basicResponse) {
                console.log('❌ Could not access TrackWrestling with corrected headers');
                return;
            }
            
            console.log('\n🎉 Basic access successful! Testing season-specific access...');
            
            // Test season-specific access
            const seasonResponse = await this.testSeasonAccess();
            
            if (seasonResponse) {
                console.log('\n🎉 SUCCESS! We can access Utah season data directly!');
                console.log('💡 This means we can use fast HTTP requests instead of slow browser automation');
                
                // Now we can implement fast scraping
                await this.implementFastScraping(seasonResponse);
                
            } else {
                console.log('⚠️ Could not access season data directly - might need browser automation for navigation');
            }
            
        } catch (error) {
            console.error('❌ Scraping failed:', error.message);
        }
    }

    async implementFastScraping(seasonResponse) {
        console.log('\n🚀 Implementing fast HTTP-based scraping...');
        
        const $ = cheerio.load(seasonResponse.data);
        
        // Extract all event links
        const events = [];
        $('a[href*="event"], a[href*="Event"]').each((i, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text && href && text.length > 5) {
                events.push({
                    name: text,
                    href: href.startsWith('http') ? href : `${this.baseUrl}${href}`
                });
            }
        });
        
        console.log(`📅 Found ${events.length} events to process`);
        
        // Process first few events as a test
        const eventsToProcess = events.slice(0, 3);
        
        for (const event of eventsToProcess) {
            console.log(`\n🏆 Processing event: ${event.name}`);
            
            try {
                const eventResponse = await this.session.get(event.href);
                
                if (eventResponse.status === 200) {
                    const $event = cheerio.load(eventResponse.data);
                    
                    // Extract teams and matches from this event
                    const teams = [];
                    $event('a[href*="team"], .team-name, .school-name').each((i, element) => {
                        const teamName = $event(element).text().trim();
                        if (teamName && teamName.length > 2 && teamName.length < 50) {
                            teams.push(teamName);
                        }
                    });
                    
                    console.log(`   🏫 Found ${teams.length} teams`);
                    
                    // This is where we'd process each team's matches
                    // For now, just show the structure
                    if (teams.length > 0) {
                        console.log(`   📋 Sample teams: ${teams.slice(0, 5).join(', ')}`);
                    }
                }
                
                // Small delay between events
                await this.sleep(1000);
                
            } catch (error) {
                console.error(`   ❌ Failed to process event: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Fast scraping test completed!');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function testCorrectHeaders() {
    const scraper = new CorrectHeadersTrackWrestlingScraper();
    await scraper.scrapeUtahWithCorrectHeaders();
}

if (require.main === module) {
    testCorrectHeaders().then(() => {
        console.log('✅ Header testing completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { CorrectHeadersTrackWrestlingScraper, testCorrectHeaders };


