const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const fs = require('fs').promises;
const path = require('path');

class UtahSeasonScraper {
    constructor() {
        this.progressFile = path.join(__dirname, 'utah-full-season-progress.json');
        this.batchSize = 10; // Process 10 events per batch
        this.delayBetweenBatches = 30000; // 30 seconds between batches
        this.maxRetries = 3;
        this.totalEvents = 0;
        this.processedEvents = 0;
        this.totalMatches = 0;
        this.totalErrors = 0;
        this.batches = [];
    }

    async initialize() {
        console.log('🏆 Utah 2024-25 High School Boys Full Season Scraper');
        console.log('📊 Initializing comprehensive scraping job queue...');
        
        try {
            // Load existing progress if available
            await this.loadProgress();
            
            // Get total event count
            console.log('🔍 Discovering total events in Utah 2024-25 season...');
            const discoveryResult = await trackwrestlingScraperService.scrapeMatches({
                targetSeason: '2024-25 High School Boys',
                stateId: '50', // Utah
                headless: true,
                maxEvents: 1, // Just for discovery
                maxTeams: 1,
                discoveryMode: true
            });
            
            // Estimate total events (we'll discover more as we go)
            this.totalEvents = 200; // Conservative estimate
            console.log(`📈 Estimated ${this.totalEvents} events to process`);
            
            // Create batch jobs
            await this.createBatchJobs();
            
            console.log(`✅ Created ${this.batches.length} batch jobs`);
            console.log(`📋 Each batch processes ${this.batchSize} events`);
            
        } catch (error) {
            console.error('❌ Failed to initialize scraper:', error);
            throw error;
        }
    }

    async createBatchJobs() {
        console.log('🔧 Creating batch processing jobs...');
        
        // Create batches of events
        for (let i = 0; i < this.totalEvents; i += this.batchSize) {
            const batchNumber = Math.floor(i / this.batchSize) + 1;
            const startEvent = i;
            const endEvent = Math.min(i + this.batchSize - 1, this.totalEvents - 1);
            
            this.batches.push({
                batchNumber,
                startEvent,
                endEvent,
                status: 'pending', // pending, running, completed, failed
                eventsProcessed: 0,
                matchesFound: 0,
                matchesProcessed: 0,
                errors: 0,
                startTime: null,
                endTime: null,
                retryCount: 0
            });
        }
        
        console.log(`📦 Created ${this.batches.length} batches:`);
        this.batches.forEach(batch => {
            console.log(`   Batch ${batch.batchNumber}: Events ${batch.startEvent}-${batch.endEvent}`);
        });
    }

    async executeBatches() {
        console.log('\n🚀 Starting batch execution...');
        console.log(`⏱️  Delay between batches: ${this.delayBetweenBatches / 1000} seconds`);
        
        for (const batch of this.batches) {
            if (batch.status === 'completed') {
                console.log(`⏭️  Skipping completed batch ${batch.batchNumber}`);
                continue;
            }
            
            console.log(`\n📦 Executing Batch ${batch.batchNumber}/${this.batches.length}`);
            console.log(`   Events: ${batch.startEvent}-${batch.endEvent}`);
            
            batch.status = 'running';
            batch.startTime = new Date();
            
            try {
                const result = await this.executeBatch(batch);
                batch.status = 'completed';
                batch.endTime = new Date();
                
                // Update totals
                this.processedEvents += result.eventsProcessed;
                this.totalMatches += result.matchesProcessed;
                this.totalErrors += result.errors;
                
                console.log(`✅ Batch ${batch.batchNumber} completed successfully`);
                console.log(`   Events processed: ${result.eventsProcessed}`);
                console.log(`   Matches processed: ${result.matchesProcessed}`);
                console.log(`   Errors: ${result.errors}`);
                
                // Save progress
                await this.saveProgress();
                
                // Delay before next batch (except for last batch)
                if (batch.batchNumber < this.batches.length) {
                    console.log(`⏳ Waiting ${this.delayBetweenBatches / 1000} seconds before next batch...`);
                    await this.sleep(this.delayBetweenBatches);
                }
                
            } catch (error) {
                console.error(`❌ Batch ${batch.batchNumber} failed:`, error.message);
                batch.status = 'failed';
                batch.endTime = new Date();
                batch.retryCount++;
                
                if (batch.retryCount < this.maxRetries) {
                    console.log(`🔄 Retrying batch ${batch.batchNumber} (attempt ${batch.retryCount + 1}/${this.maxRetries})`);
                    batch.status = 'pending';
                    
                    // Longer delay before retry
                    await this.sleep(this.delayBetweenBatches * 2);
                    
                    // Re-execute this batch
                    const batchIndex = this.batches.indexOf(batch);
                    this.batches[batchIndex] = batch;
                    
                    // Re-run this batch
                    const retryResult = await this.executeBatch(batch);
                    batch.status = 'completed';
                    batch.endTime = new Date();
                    
                    this.processedEvents += retryResult.eventsProcessed;
                    this.totalMatches += retryResult.matchesProcessed;
                    this.totalErrors += retryResult.errors;
                    
                    console.log(`✅ Batch ${batch.batchNumber} retry successful`);
                } else {
                    console.error(`💥 Batch ${batch.batchNumber} failed after ${this.maxRetries} attempts`);
                }
                
                await this.saveProgress();
            }
        }
        
        await this.generateFinalReport();
    }

    async executeBatch(batch) {
        console.log(`🏃‍♂️ Running batch ${batch.batchNumber}...`);
        
        const batchResult = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: this.batchSize,
            maxTeams: 50, // Limit teams per event to prevent hanging
            startFromEventIndex: batch.startEvent,
            batchMode: true,
            batchNumber: batch.batchNumber
        });
        
        // Update batch with results
        batch.eventsProcessed = batchResult.totalEvents || 0;
        batch.matchesFound = batchResult.totalMatches || 0;
        batch.matchesProcessed = batchResult.processedMatches || 0;
        batch.errors = batchResult.errors?.length || 0;
        
        return {
            eventsProcessed: batch.eventsProcessed,
            matchesProcessed: batch.matchesProcessed,
            errors: batch.errors
        };
    }

    async generateFinalReport() {
        console.log('\n📊 FINAL SCRAPING REPORT');
        console.log('=' * 50);
        
        const completedBatches = this.batches.filter(b => b.status === 'completed');
        const failedBatches = this.batches.filter(b => b.status === 'failed');
        
        console.log(`📈 Total Batches: ${this.batches.length}`);
        console.log(`✅ Completed Batches: ${completedBatches.length}`);
        console.log(`❌ Failed Batches: ${failedBatches.length}`);
        console.log(`📅 Total Events Processed: ${this.processedEvents}`);
        console.log(`🥊 Total Matches Processed: ${this.totalMatches}`);
        console.log(`⚠️  Total Errors: ${this.totalErrors}`);
        
        if (failedBatches.length > 0) {
            console.log('\n❌ Failed Batches:');
            failedBatches.forEach(batch => {
                console.log(`   Batch ${batch.batchNumber}: Events ${batch.startEvent}-${batch.endEvent}`);
            });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        if (this.totalMatches > 0) {
            console.log('✅ Scraping completed successfully!');
            console.log('🌐 Open http://localhost:3000 to view the data');
            console.log('📊 Use the audit trail feature to explore athlete rating evolution');
        } else {
            console.log('⚠️  No matches were processed. This could be due to:');
            console.log('   - Season not yet started');
            console.log('   - Data not yet available on TrackWrestling');
            console.log('   - Network or authentication issues');
        }
        
        // Save final report
        const report = {
            timestamp: new Date().toISOString(),
            totalBatches: this.batches.length,
            completedBatches: completedBatches.length,
            failedBatches: failedBatches.length,
            totalEventsProcessed: this.processedEvents,
            totalMatchesProcessed: this.totalMatches,
            totalErrors: this.totalErrors,
            batches: this.batches
        };
        
        await fs.writeFile(
            path.join(__dirname, 'utah-full-season-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: utah-full-season-report.json');
    }

    async loadProgress() {
        try {
            const data = await fs.readFile(this.progressFile, 'utf8');
            const progress = JSON.parse(data);
            
            this.batches = progress.batches || [];
            this.processedEvents = progress.processedEvents || 0;
            this.totalMatches = progress.totalMatches || 0;
            this.totalErrors = progress.totalErrors || 0;
            
            console.log(`📂 Loaded existing progress: ${this.processedEvents} events, ${this.totalMatches} matches`);
        } catch (error) {
            console.log('📝 No existing progress found, starting fresh');
        }
    }

    async saveProgress() {
        const progress = {
            timestamp: new Date().toISOString(),
            batches: this.batches,
            processedEvents: this.processedEvents,
            totalMatches: this.totalMatches,
            totalErrors: this.totalErrors
        };
        
        await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function scrapeUtahFullSeason() {
    const scraper = new UtahSeasonScraper();
    
    try {
        await scraper.initialize();
        await scraper.executeBatches();
        
        console.log('\n🎉 Utah 2024-25 Full Season Scraping Completed!');
        
    } catch (error) {
        console.error('💥 Scraping failed:', error);
        process.exit(1);
    }
}

// Run the scraper
if (require.main === module) {
    scrapeUtahFullSeason().then(() => {
        console.log('✅ Full season scraping script completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { UtahSeasonScraper, scrapeUtahFullSeason };

