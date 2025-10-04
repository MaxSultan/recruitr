const axios = require('axios');
const cheerio = require('cheerio');
const { Athlete, SeasonRanking, RankingMatch } = require('../models');

class DirectHTTPTrackWrestlingScraper {
    constructor() {
        this.baseUrl = 'https://www.trackwrestling.com';
        this.session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000
        });
        this.cookies = {};
    }

    async login() {
        console.log('🔐 Attempting direct login to TrackWrestling...');
        
        try {
            // First, get the login page to extract any CSRF tokens
            const loginPage = await this.session.get(`${this.baseUrl}/login.jsp`);
            const $ = cheerio.load(loginPage.data);
            
            // Look for login form and extract any hidden fields
            const form = $('form[name="loginForm"], form[action*="login"]').first();
            if (form.length === 0) {
                console.log('⚠️ No login form found - might be already logged in or different structure');
                return true;
            }
            
            // Extract form action and method
            const action = form.attr('action') || '/login';
            const method = form.attr('method') || 'post';
            
            console.log(`📋 Found login form: ${method.toUpperCase()} ${action}`);
            
            // For now, let's try to access the results page directly
            // Many sites allow public access to results
            console.log('🌐 Trying to access results page directly...');
            
            return true;
            
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            return false;
        }
    }

    async getSeasonResults(seasonName = '2024-25 High School Boys', stateId = '50') {
        console.log(`📅 Fetching results for ${seasonName} (State: ${stateId})`);
        
        try {
            // Try different possible URLs for the results
            const possibleUrls = [
                `${this.baseUrl}/seasons/Results.jsp`,
                `${this.baseUrl}/seasons/MainFrame.jsp`,
                `${this.baseUrl}/seasons/Results.jsp?seasonId=${stateId}`,
                `${this.baseUrl}/seasons/Results.jsp?stateId=${stateId}`,
                `${this.baseUrl}/seasons/Results.jsp?season=${encodeURIComponent(seasonName)}&stateId=${stateId}`
            ];
            
            for (const url of possibleUrls) {
                try {
                    console.log(`🔗 Trying URL: ${url}`);
                    const response = await this.session.get(url);
                    
                    if (response.status === 200 && response.data.includes('trackwrestling')) {
                        console.log(`✅ Successfully accessed: ${url}`);
                        return this.parseResultsPage(response.data, url);
                    }
                } catch (error) {
                    console.log(`❌ Failed to access ${url}: ${error.message}`);
                }
            }
            
            console.log('❌ Could not access any results URLs');
            return { events: [], teams: [], matches: [] };
            
        } catch (error) {
            console.error('❌ Error fetching season results:', error.message);
            return { events: [], teams: [], matches: [] };
        }
    }

    parseResultsPage(html, url) {
        console.log('🔍 Parsing results page...');
        const $ = cheerio.load(html);
        
        const results = {
            events: [],
            teams: [],
            matches: []
        };
        
        // Look for event links
        $('a[href*="event"], a[href*="Event"]').each((i, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text && href && text.length > 5) {
                results.events.push({
                    name: text,
                    href: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                    url: url
                });
            }
        });
        
        console.log(`📅 Found ${results.events.length} events`);
        console.log(`📋 Sample events:`, results.events.slice(0, 5));
        
        return results;
    }

    async getEventDetails(eventUrl) {
        console.log(`🏆 Fetching event details: ${eventUrl}`);
        
        try {
            const response = await this.session.get(eventUrl);
            const $ = cheerio.load(response.data);
            
            const eventData = {
                name: $('h1, h2, .event-title, .tournament-name').first().text().trim(),
                teams: [],
                matches: []
            };
            
            // Look for team links or team names
            $('a[href*="team"], a[href*="Team"], .team-name, .school-name').each((i, element) => {
                const $element = $(element);
                const teamName = $element.text().trim();
                
                if (teamName && teamName.length > 2 && teamName.length < 50) {
                    eventData.teams.push(teamName);
                }
            });
            
            // Look for match results
            $('.match-result, .match, tr').each((i, element) => {
                const $element = $(element);
                const text = $element.text().trim();
                
                // Look for patterns like "Name over Name (Result)"
                if (text.includes(' over ') && text.includes('(') && text.includes(')')) {
                    eventData.matches.push(text);
                }
            });
            
            console.log(`   Found ${eventData.teams.length} teams and ${eventData.matches.length} matches`);
            
            return eventData;
            
        } catch (error) {
            console.error(`❌ Error fetching event details: ${error.message}`);
            return { name: '', teams: [], matches: [] };
        }
    }

    async scrapeUtahSeason() {
        console.log('🏆 Starting Direct HTTP Utah Season Scraping...');
        
        try {
            // Try to login (or at least establish session)
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                console.log('⚠️ Login failed, trying to access public data...');
            }
            
            // Get season results
            const seasonResults = await this.getSeasonResults();
            
            if (seasonResults.events.length === 0) {
                console.log('❌ No events found. The site might require authentication or have changed structure.');
                console.log('💡 Suggestions:');
                console.log('   1. Check if TrackWrestling requires login for results');
                console.log('   2. Look for public API endpoints');
                console.log('   3. Use browser automation for initial session setup');
                return;
            }
            
            console.log(`🎯 Processing ${seasonResults.events.length} events...`);
            
            let totalMatches = 0;
            let processedMatches = 0;
            
            // Process first few events as a test
            const eventsToProcess = seasonResults.events.slice(0, 3);
            
            for (const event of eventsToProcess) {
                console.log(`\n📅 Processing event: ${event.name}`);
                
                const eventDetails = await this.getEventDetails(event.href);
                
                totalMatches += eventDetails.matches.length;
                
                // Process matches found in this event
                for (const matchText of eventDetails.matches.slice(0, 5)) { // Limit to 5 matches per event for testing
                    try {
                        const parsedMatch = this.parseMatchText(matchText);
                        if (parsedMatch) {
                            await this.saveMatch(parsedMatch, event);
                            processedMatches++;
                        }
                    } catch (error) {
                        console.error(`❌ Error processing match: ${error.message}`);
                    }
                }
                
                // Add delay between events
                await this.sleep(1000);
            }
            
            console.log(`\n🎉 Direct HTTP scraping completed!`);
            console.log(`📊 Results: ${processedMatches}/${totalMatches} matches processed`);
            
        } catch (error) {
            console.error('❌ Direct HTTP scraping failed:', error.message);
        }
    }

    parseMatchText(matchText) {
        // Simple regex to parse match text like "John Smith over Mike Johnson (Fall 1:30)"
        const matchRegex = /(.+?)\s+over\s+(.+?)\s+\((.+?)\)/;
        const match = matchText.match(matchRegex);
        
        if (match) {
            return {
                winner: match[1].trim(),
                loser: match[2].trim(),
                result: match[3].trim(),
                rawText: matchText
            };
        }
        
        return null;
    }

    async saveMatch(matchData, event) {
        // This would save to database - simplified for now
        console.log(`💾 Would save match: ${matchData.winner} over ${matchData.loser} (${matchData.result})`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function runDirectHTTPScraping() {
    const scraper = new DirectHTTPTrackWrestlingScraper();
    await scraper.scrapeUtahSeason();
}

if (require.main === module) {
    runDirectHTTPScraping().then(() => {
        console.log('✅ Direct HTTP scraping completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { DirectHTTPTrackWrestlingScraper, runDirectHTTPScraping };


