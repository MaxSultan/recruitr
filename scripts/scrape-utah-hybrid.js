const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const { Athlete, SeasonRanking, RankingMatch } = require('../models');

class HybridTrackWrestlingScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.session = null;
        this.cookies = null;
        this.processedMatches = new Set();
    }

    async initializeBrowser() {
        console.log('🚀 Initializing browser for session setup...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Keep visible for debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('✅ Browser initialized');
    }

    async establishSession() {
        console.log('🔐 Establishing authenticated session...');
        
        try {
            // Navigate to TrackWrestling
            await this.page.goto('https://www.trackwrestling.com/seasons/Results.jsp', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('✅ Navigated to TrackWrestling');
            
            // Wait a bit for any dynamic content
            await this.page.waitForTimeout(2000);
            
            // Extract cookies and session data
            this.cookies = await this.page.cookies();
            
            // Extract any CSRF tokens or session identifiers
            const pageContent = await this.page.content();
            const $ = cheerio.load(pageContent);
            
            // Look for session tokens, CSRF tokens, etc.
            const csrfToken = $('meta[name="csrf-token"], input[name="_token"], input[name="csrf_token"]').attr('content') || 
                             $('input[name="_token"], input[name="csrf_token"]').val();
            
            console.log(`🍪 Extracted ${this.cookies.length} cookies`);
            if (csrfToken) {
                console.log('🔑 Found CSRF token');
            }
            
            // Set up axios session with cookies
            this.session = axios.create({
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Referer': 'https://www.trackwrestling.com/seasons/Results.jsp'
                },
                timeout: 30000
            });
            
            // Add cookies to axios session
            const cookieString = this.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            this.session.defaults.headers['Cookie'] = cookieString;
            
            console.log('✅ Session established with HTTP client');
            
        } catch (error) {
            console.error('❌ Failed to establish session:', error.message);
            throw error;
        }
    }

    async navigateToSeason(seasonName = '2024-25 High School Boys', stateId = '50') {
        console.log(`📅 Navigating to season: ${seasonName}`);
        
        try {
            // Use browser to navigate to the specific season
            await this.page.evaluate((season, state) => {
                // Look for season selection
                const seasonLinks = Array.from(document.querySelectorAll('a')).find(link => 
                    link.textContent.includes(season)
                );
                
                if (seasonLinks) {
                    seasonLinks.click();
                    return true;
                }
                return false;
            }, seasonName, stateId);
            
            await this.page.waitForTimeout(3000);
            
            // Update cookies after navigation
            this.cookies = await this.page.cookies();
            const cookieString = this.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            this.session.defaults.headers['Cookie'] = cookieString;
            
            console.log('✅ Navigated to season');
            
        } catch (error) {
            console.error('❌ Failed to navigate to season:', error.message);
        }
    }

    async getEventsViaHTTP() {
        console.log('🔍 Getting events via HTTP...');
        
        try {
            // Try to get events using HTTP with our established session
            const response = await this.session.get('https://www.trackwrestling.com/seasons/Results.jsp');
            
            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                const events = [];
                
                // Extract event links
                $('a[href*="event"], a[href*="Event"]').each((i, element) => {
                    const $link = $(element);
                    const href = $link.attr('href');
                    const text = $link.text().trim();
                    
                    if (text && href && text.length > 5) {
                        events.push({
                            name: text,
                            href: href.startsWith('http') ? href : `https://www.trackwrestling.com${href}`
                        });
                    }
                });
                
                console.log(`✅ Found ${events.length} events via HTTP`);
                return events;
            }
            
        } catch (error) {
            console.log('⚠️ HTTP method failed, falling back to browser extraction');
        }
        
        // Fallback to browser extraction
        return await this.getEventsViaBrowser();
    }

    async getEventsViaBrowser() {
        console.log('🔍 Getting events via browser...');
        
        try {
            const events = await this.page.evaluate(() => {
                const eventLinks = Array.from(document.querySelectorAll('a[href*="event"], a[href*="Event"]'));
                return eventLinks.map(link => ({
                    name: link.textContent.trim(),
                    href: link.href
                })).filter(event => event.name.length > 5);
            });
            
            console.log(`✅ Found ${events.length} events via browser`);
            return events;
            
        } catch (error) {
            console.error('❌ Failed to get events via browser:', error.message);
            return [];
        }
    }

    async processEventHybrid(event, maxTeams = 10) {
        console.log(`🏆 Processing event: ${event.name}`);
        
        try {
            // Try HTTP first
            const eventData = await this.getEventDataViaHTTP(event.href);
            
            if (eventData.teams.length > 0) {
                console.log(`✅ Got ${eventData.teams.length} teams via HTTP`);
                return await this.processTeams(eventData.teams.slice(0, maxTeams), event);
            }
            
        } catch (error) {
            console.log('⚠️ HTTP failed, using browser for event processing');
        }
        
        // Fallback to browser processing
        return await this.processEventViaBrowser(event, maxTeams);
    }

    async getEventDataViaHTTP(eventUrl) {
        try {
            const response = await this.session.get(eventUrl);
            const $ = cheerio.load(response.data);
            
            const teams = [];
            $('a[href*="team"], .team-name, .school-name').each((i, element) => {
                const teamName = $(element).text().trim();
                if (teamName && teamName.length > 2 && teamName.length < 50) {
                    teams.push(teamName);
                }
            });
            
            return { teams };
            
        } catch (error) {
            throw error;
        }
    }

    async processEventViaBrowser(event, maxTeams) {
        console.log(`🌐 Processing event via browser: ${event.name}`);
        
        try {
            await this.page.goto(event.href, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const eventData = await this.page.evaluate(() => {
                const teamLinks = Array.from(document.querySelectorAll('a[href*="team"], .team-name'));
                return teamLinks.map(link => link.textContent.trim()).filter(name => name.length > 2);
            });
            
            console.log(`✅ Found ${eventData.length} teams via browser`);
            
            return await this.processTeams(eventData.slice(0, maxTeams), event);
            
        } catch (error) {
            console.error(`❌ Failed to process event via browser: ${error.message}`);
            return 0;
        }
    }

    async processTeams(teams, event) {
        console.log(`🏫 Processing ${teams.length} teams...`);
        
        let matchesProcessed = 0;
        
        for (const teamName of teams) {
            try {
                // Use browser to get team matches (this is still the bottleneck)
                const teamMatches = await this.getTeamMatchesViaBrowser(teamName);
                
                for (const match of teamMatches.slice(0, 5)) { // Limit matches per team
                    const matchHash = this.createMatchHash(match);
                    
                    if (!this.processedMatches.has(matchHash)) {
                        await this.saveMatch(match, event, teamName);
                        this.processedMatches.add(matchHash);
                        matchesProcessed++;
                    }
                }
                
                // Small delay between teams
                await this.sleep(500);
                
            } catch (error) {
                console.error(`❌ Failed to process team ${teamName}: ${error.message}`);
            }
        }
        
        return matchesProcessed;
    }

    async getTeamMatchesViaBrowser(teamName) {
        // This would use the browser to click on team and extract matches
        // Implementation would be similar to existing browser service
        console.log(`🥊 Getting matches for team: ${teamName}`);
        
        // Simplified - return empty array for now
        return [];
    }

    async saveMatch(match, event, teamName) {
        console.log(`💾 Saving match: ${match.winner} over ${match.loser}`);
        // Implementation would save to database
    }

    createMatchHash(match) {
        const crypto = require('crypto');
        const hashString = `${match.winner}-${match.loser}-${match.date}`;
        return crypto.createHash('md5').update(hashString).digest('hex');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrapeUtahSeason() {
        console.log('🏆 Starting Hybrid Utah Season Scraping...');
        
        try {
            await this.initializeBrowser();
            await this.establishSession();
            await this.navigateToSeason();
            
            const events = await this.getEventsViaHTTP();
            
            console.log(`🎯 Processing ${events.length} events...`);
            
            let totalMatches = 0;
            const eventsToProcess = events.slice(0, 3); // Process first 3 events
            
            for (const event of eventsToProcess) {
                const matchesProcessed = await this.processEventHybrid(event, 5); // 5 teams per event
                totalMatches += matchesProcessed;
                
                console.log(`✅ Event completed: ${matchesProcessed} matches processed`);
            }
            
            console.log(`\n🎉 Hybrid scraping completed! ${totalMatches} total matches processed`);
            
        } catch (error) {
            console.error('❌ Hybrid scraping failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution
async function runHybridScraping() {
    const scraper = new HybridTrackWrestlingScraper();
    await scraper.scrapeUtahSeason();
}

if (require.main === module) {
    runHybridScraping().then(() => {
        console.log('✅ Hybrid scraping completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { HybridTrackWrestlingScraper, runHybridScraping };


