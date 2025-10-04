const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const fs = require('fs');
const path = require('path');

// Progress tracking file
const PROGRESS_FILE = path.join(__dirname, 'utah-scraping-progress.json');

async function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('⚠️ Could not load progress file, starting fresh');
    }
    
    return {
        lastProcessedEventIndex: -1,
        totalEventsProcessed: 0,
        totalMatchesProcessed: 0,
        errors: [],
        startTime: new Date().toISOString()
    };
}

async function saveProgress(progress) {
    try {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        console.log(`💾 Progress saved: Event ${progress.lastProcessedEventIndex + 1} completed`);
    } catch (error) {
        console.error('❌ Failed to save progress:', error.message);
    }
}

async function scrapeUtahLimited() {
    console.log('🏆 Starting Limited Utah 2024-25 High School Boys Wrestling Scrape...');
    console.log('📊 Processing 5 events at a time with progress tracking');
    
    // Load previous progress
    const progress = await loadProgress();
    console.log(`📍 Starting from event index: ${progress.lastProcessedEventIndex + 1}`);
    console.log(`📈 Previously processed: ${progress.totalEventsProcessed} events, ${progress.totalMatchesProcessed} matches`);
    
    try {
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah state ID
            headless: true,
            maxEvents: 5, // Only process 5 events at a time
            maxTeams: 10, // Limit teams per event to prevent hanging
            startFromEventIndex: progress.lastProcessedEventIndex + 1 // Resume from where we left off
        });

        // Update progress
        progress.lastProcessedEventIndex += results.totalEvents;
        progress.totalEventsProcessed += results.totalEvents;
        progress.totalMatchesProcessed += results.processedMatches;
        progress.errors = [...progress.errors, ...results.errors];
        progress.lastUpdate = new Date().toISOString();

        // Save progress
        await saveProgress(progress);

        console.log('\n🎉 Batch Scraping Completed!');
        console.log('📊 Batch Results:');
        console.log(`   Events in this batch: ${results.totalEvents}`);
        console.log(`   Teams in this batch: ${results.totalTeams}`);
        console.log(`   Matches found: ${results.totalMatches}`);
        console.log(`   Matches processed: ${results.processedMatches}`);
        console.log(`   Errors in this batch: ${results.errors.length}`);

        console.log('\n📈 Overall Progress:');
        console.log(`   Total events processed: ${progress.totalEventsProcessed}`);
        console.log(`   Total matches processed: ${progress.totalMatchesProcessed}`);
        console.log(`   Total errors: ${progress.errors.length}`);
        console.log(`   Last event index: ${progress.lastProcessedEventIndex}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors in this batch:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
            });
        }

        if (results.processedMatches > 0) {
            console.log('\n✅ Successfully processed Utah wrestling data!');
            console.log('🏆 You can now view athlete rankings and audit trails in the web interface.');
            console.log('🌐 Open http://localhost:3000 to explore the data');
        }

        console.log('\n🔄 To continue scraping more events, run this script again.');
        console.log(`📝 Progress saved to: ${PROGRESS_FILE}`);

    } catch (error) {
        console.error('❌ Utah scraping failed:', error);
        console.error('Stack trace:', error.stack);
        
        // Save error to progress
        progress.errors.push({
            type: 'script_error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        await saveProgress(progress);
    }
}

// Run the scraper
scrapeUtahLimited().then(() => {
    console.log('✅ Utah limited scraping script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});

