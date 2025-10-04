const axios = require('axios');
const cheerio = require('cheerio');

class TrackWrestlingAnalyzer {
    constructor() {
        this.baseUrl = 'https://www.trackwrestling.com';
        this.session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            },
            timeout: 30000
        });
    }

    async analyzeSiteStructure() {
        console.log('🔍 Analyzing TrackWrestling site structure...');
        
        try {
            // 1. Check main site accessibility
            console.log('\n1️⃣ Checking main site accessibility...');
            await this.checkMainSite();
            
            // 2. Look for API endpoints
            console.log('\n2️⃣ Looking for API endpoints...');
            await this.findAPIEndpoints();
            
            // 3. Check public data access
            console.log('\n3️⃣ Checking public data access...');
            await this.checkPublicDataAccess();
            
            // 4. Analyze URL patterns
            console.log('\n4️⃣ Analyzing URL patterns...');
            await this.analyzeURLPatterns();
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
        }
    }

    async checkMainSite() {
        try {
            const response = await this.session.get(this.baseUrl);
            console.log(`✅ Main site accessible (Status: ${response.status})`);
            
            const $ = cheerio.load(response.data);
            const title = $('title').text();
            console.log(`📄 Page title: ${title}`);
            
            // Look for login requirements
            const hasLoginForm = $('form[action*="login"], input[name*="password"]').length > 0;
            console.log(`🔐 Requires login: ${hasLoginForm ? 'Yes' : 'No'}`);
            
            // Look for navigation links
            const navLinks = $('nav a, .navigation a, .menu a').map((i, el) => $(el).attr('href')).get();
            console.log(`🔗 Navigation links found: ${navLinks.length}`);
            navLinks.slice(0, 10).forEach(link => {
                if (link && link.startsWith('/')) {
                    console.log(`   - ${link}`);
                }
            });
            
        } catch (error) {
            console.log(`❌ Main site check failed: ${error.message}`);
        }
    }

    async findAPIEndpoints() {
        const possibleAPIPaths = [
            '/api',
            '/api/v1',
            '/rest',
            '/data',
            '/ajax',
            '/json',
            '/seasons/api',
            '/results/api'
        ];
        
        for (const path of possibleAPIPaths) {
            try {
                const url = `${this.baseUrl}${path}`;
                const response = await this.session.get(url);
                
                if (response.status === 200) {
                    console.log(`✅ Found potential API: ${url} (Status: ${response.status})`);
                    
                    // Check if response is JSON
                    try {
                        JSON.parse(response.data);
                        console.log(`   📊 Returns JSON data`);
                    } catch (e) {
                        console.log(`   📄 Returns HTML/text`);
                    }
                }
            } catch (error) {
                // API endpoint doesn't exist or requires auth
            }
        }
    }

    async checkPublicDataAccess() {
        const publicPaths = [
            '/seasons/Results.jsp',
            '/seasons/MainFrame.jsp',
            '/public/results',
            '/results',
            '/seasons/public'
        ];
        
        for (const path of publicPaths) {
            try {
                const url = `${this.baseUrl}${path}`;
                const response = await this.session.get(url);
                
                if (response.status === 200) {
                    console.log(`✅ Public access: ${url} (Status: ${response.status})`);
                    
                    const $ = cheerio.load(response.data);
                    const hasData = $('table, .results, .matches, .events').length > 0;
                    console.log(`   📊 Contains data tables: ${hasData ? 'Yes' : 'No'}`);
                    
                    if (hasData) {
                        const tableCount = $('table').length;
                        const linkCount = $('a[href*="event"], a[href*="team"]').length;
                        console.log(`   📋 Tables: ${tableCount}, Event/Team links: ${linkCount}`);
                    }
                }
            } catch (error) {
                console.log(`❌ No public access: ${path} - ${error.message}`);
            }
        }
    }

    async analyzeURLPatterns() {
        console.log('🔍 Analyzing URL patterns for data access...');
        
        // Try different URL patterns that might give us direct access to data
        const urlPatterns = [
            // Direct results URLs
            `${this.baseUrl}/seasons/Results.jsp?seasonId=50`,
            `${this.baseUrl}/seasons/Results.jsp?stateId=50`,
            `${this.baseUrl}/seasons/Results.jsp?season=2024-25%20High%20School%20Boys`,
            
            // JSON/API-like URLs
            `${this.baseUrl}/seasons/Results.jsp?format=json`,
            `${this.baseUrl}/seasons/api/results`,
            `${this.baseUrl}/data/seasons/50/results`,
            
            // Export URLs
            `${this.baseUrl}/seasons/Results.jsp?export=csv`,
            `${this.baseUrl}/seasons/Results.jsp?export=json`
        ];
        
        for (const url of urlPatterns) {
            try {
                const response = await this.session.get(url);
                
                if (response.status === 200) {
                    console.log(`✅ Accessible URL pattern: ${url}`);
                    
                    // Analyze response type
                    const contentType = response.headers['content-type'] || '';
                    if (contentType.includes('json')) {
                        console.log(`   📊 Returns JSON data`);
                        try {
                            const jsonData = JSON.parse(response.data);
                            console.log(`   📋 JSON keys: ${Object.keys(jsonData).join(', ')}`);
                        } catch (e) {
                            console.log(`   ⚠️ Invalid JSON`);
                        }
                    } else {
                        const $ = cheerio.load(response.data);
                        const hasData = $('table, .results, .data').length > 0;
                        console.log(`   📄 Contains data: ${hasData ? 'Yes' : 'No'}`);
                    }
                }
            } catch (error) {
                // URL pattern doesn't work
            }
        }
    }
}

// Main execution
async function analyzeTrackWrestling() {
    const analyzer = new TrackWrestlingAnalyzer();
    await analyzer.analyzeSiteStructure();
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. If public access works, use direct HTTP + Cheerio');
    console.log('2. If API endpoints found, use direct API calls');
    console.log('3. If login required, use browser automation only for session setup');
    console.log('4. If no direct access, stick with optimized browser automation');
}

if (require.main === module) {
    analyzeTrackWrestling().then(() => {
        console.log('✅ TrackWrestling analysis completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
}

module.exports = { TrackWrestlingAnalyzer, analyzeTrackWrestling };


