const { spawn } = require('child_process');
const path = require('path');

class OptimalUtahRunner {
    constructor() {
        this.batchSize = 5; // 5 teams per batch (proven optimal)
        this.delayBetweenBatches = 15000; // 15 seconds between batches
        this.maxBatches = 50; // Process all 50 Utah events
        this.results = [];
        this.startTime = Date.now();
        this.totalMatchesProcessed = 0;
    }

    async runOptimalUtahScraping() {
        console.log('🏆 Utah 2024-25 High School Boys - OPTIMAL Strategy');
        console.log(`📊 Using proven optimal batch size: ${this.batchSize} teams per batch`);
        console.log(`⏱️ Delay between batches: ${this.delayBetweenBatches / 1000} seconds`);
        console.log(`🎯 Target: ${this.maxBatches} batches (all Utah events)`);
        console.log(`📈 Estimated total time: ~${Math.round((this.maxBatches * (78 + this.delayBetweenBatches / 1000)) / 60)} minutes`);
        console.log('');

        for (let batchNum = 1; batchNum <= this.maxBatches; batchNum++) {
            console.log(`\n🚀 Starting Optimal Batch ${batchNum}/${this.maxBatches}`);
            console.log(`📊 Processing: 1 event, ${this.batchSize} teams maximum`);
            
            const batchStartTime = Date.now();
            
            try {
                const result = await this.runSingleOptimalBatch(batchNum);
                const batchDuration = Math.round((Date.now() - batchStartTime) / 1000);
                
                this.results.push({
                    batchNumber: batchNum,
                    success: true,
                    duration: batchDuration,
                    result: result
                });
                
                this.totalMatchesProcessed += result?.processedMatches || 0;
                
                console.log(`✅ Optimal Batch ${batchNum} completed in ${batchDuration} seconds`);
                console.log(`🥊 New matches: ${result?.processedMatches || 0}`);
                console.log(`📊 Total matches so far: ${this.totalMatchesProcessed}`);
                
                // Performance tracking
                const totalTime = Math.round((Date.now() - this.startTime) / 1000);
                const avgTimePerBatch = Math.round(totalTime / batchNum);
                const estimatedRemaining = Math.round((this.maxBatches - batchNum) * avgTimePerBatch / 60);
                
                console.log(`⏱️ Average time per batch: ${avgTimePerBatch}s`);
                console.log(`🎯 Estimated remaining: ${estimatedRemaining} minutes`);
                
                // Delay before next batch (except for last batch)
                if (batchNum < this.maxBatches) {
                    console.log(`⏳ Waiting ${this.delayBetweenBatches / 1000} seconds before next batch...`);
                    await this.sleep(this.delayBetweenBatches);
                }
                
            } catch (error) {
                console.error(`❌ Optimal Batch ${batchNum} failed:`, error.message);
                
                this.results.push({
                    batchNumber: batchNum,
                    success: false,
                    duration: Math.round((Date.now() - batchStartTime) / 1000),
                    error: error.message
                });
                
                // Shorter delay before retry
                console.log(`⏳ Waiting 10 seconds before retry...`);
                await this.sleep(10000);
                
                // Try the batch again (only once)
                try {
                    console.log(`🔄 Retrying Batch ${batchNum}...`);
                    const retryResult = await this.runSingleOptimalBatch(batchNum);
                    const retryDuration = Math.round((Date.now() - batchStartTime) / 1000);
                    
                    this.results[this.results.length - 1] = {
                        batchNumber: batchNum,
                        success: true,
                        duration: retryDuration,
                        result: retryResult
                    };
                    
                    this.totalMatchesProcessed += retryResult?.processedMatches || 0;
                    console.log(`✅ Batch ${batchNum} retry successful!`);
                    
                } catch (retryError) {
                    console.error(`❌ Batch ${batchNum} retry also failed:`, retryError.message);
                }
            }
        }
        
        await this.generateFinalReport();
    }

    async runSingleOptimalBatch(batchNumber) {
        return new Promise((resolve, reject) => {
            const child = spawn('node', ['scripts/scrape-utah-small-batch.js'], {
                cwd: __dirname,
                stdio: ['inherit', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = this.parseBatchResult(stdout);
                        resolve(result);
                    } catch (error) {
                        resolve({ processedMatches: 0, totalEvents: 0, totalTeams: 0 });
                    }
                } else {
                    reject(new Error(`Batch failed with exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
            
            // Set a timeout for each batch (5 minutes)
            setTimeout(() => {
                if (!child.killed) {
                    child.kill();
                    reject(new Error('Batch timed out after 5 minutes'));
                }
            }, 300000);
        });
    }

    parseBatchResult(stdout) {
        const lines = stdout.split('\n');
        const result = {
            processedMatches: 0,
            totalEvents: 0,
            totalTeams: 0,
            totalMatches: 0,
            errors: 0
        };
        
        lines.forEach(line => {
            if (line.includes('Events Processed:')) {
                const match = line.match(/Events Processed: (\d+)/);
                if (match) result.totalEvents = parseInt(match[1]);
            }
            if (line.includes('Teams Processed:')) {
                const match = line.match(/Teams Processed: (\d+)/);
                if (match) result.totalTeams = parseInt(match[1]);
            }
            if (line.includes('Matches Found:')) {
                const match = line.match(/Matches Found: (\d+)/);
                if (match) result.totalMatches = parseInt(match[1]);
            }
            if (line.includes('Matches Processed:')) {
                const match = line.match(/Matches Processed: (\d+)/);
                if (match) result.processedMatches = parseInt(match[1]);
            }
            if (line.includes('Errors:')) {
                const match = line.match(/Errors: (\d+)/);
                if (match) result.errors = parseInt(match[1]);
            }
        });
        
        return result;
    }

    async generateFinalReport() {
        const totalDuration = Math.round((Date.now() - this.startTime) / 1000);
        
        console.log('\n📊 FINAL REPORT - Optimal Utah Scraping');
        console.log('=' * 60);
        
        const successfulBatches = this.results.filter(r => r.success);
        const failedBatches = this.results.filter(r => !r.success);
        
        console.log(`📈 Total Batches: ${this.results.length}`);
        console.log(`✅ Successful Batches: ${successfulBatches.length}`);
        console.log(`❌ Failed Batches: ${failedBatches.length}`);
        console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 60)} minutes`);
        console.log(`🥊 Total Matches Processed: ${this.totalMatchesProcessed}`);
        
        if (successfulBatches.length > 0) {
            const totalEvents = successfulBatches.reduce((sum, batch) => sum + (batch.result?.totalEvents || 0), 0);
            const totalTeams = successfulBatches.reduce((sum, batch) => sum + (batch.result?.totalTeams || 0), 0);
            const totalMatchesFound = successfulBatches.reduce((sum, batch) => sum + (batch.result?.totalMatches || 0), 0);
            
            console.log(`📅 Total Events Processed: ${totalEvents}`);
            console.log(`🏫 Total Teams Processed: ${totalTeams}`);
            console.log(`🔍 Total Matches Found: ${totalMatchesFound}`);
            
            const avgDuration = successfulBatches.reduce((sum, batch) => sum + batch.duration, 0) / successfulBatches.length;
            console.log(`📊 Average Batch Duration: ${avgDuration.toFixed(1)} seconds`);
            
            const efficiency = (this.totalMatchesProcessed / totalDuration * 60).toFixed(1);
            console.log(`⚡ Processing Efficiency: ${efficiency} matches/minute`);
        }
        
        if (failedBatches.length > 0) {
            console.log('\n❌ Failed Batches:');
            failedBatches.forEach(batch => {
                console.log(`   Batch ${batch.batchNumber}: ${batch.error}`);
            });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        if (successfulBatches.length > this.maxBatches * 0.9) { // 90% success rate
            console.log('✅ Optimal strategy is highly successful!');
            console.log('🔄 You can:');
            console.log('   1. Run this script again to process remaining events');
            console.log('   2. Increase batch size to 10 teams if you want faster processing');
            console.log('   3. Reduce delays between batches for faster overall completion');
        } else if (successfulBatches.length > this.maxBatches * 0.5) { // 50% success rate
            console.log('⚠️ Moderate success rate. Consider:');
            console.log('   1. Reducing batch size back to 2-3 teams');
            console.log('   2. Increasing delays between batches');
            console.log('   3. Running during off-peak hours');
        } else {
            console.log('❌ Low success rate. The issue may be:');
            console.log('   1. Network/server issues');
            console.log('   2. Browser automation problems');
            console.log('   3. TrackWrestling rate limiting');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            strategy: 'Optimal Utah Scraping',
            batchSize: this.batchSize,
            totalBatches: this.results.length,
            successfulBatches: successfulBatches.length,
            failedBatches: failedBatches.length,
            totalDuration: totalDuration,
            totalMatchesProcessed: this.totalMatchesProcessed,
            results: this.results
        };
        
        require('fs').writeFileSync(
            path.join(__dirname, 'optimal-utah-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: optimal-utah-report.json');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function runOptimalUtahScraping() {
    const runner = new OptimalUtahRunner();
    await runner.runOptimalUtahScraping();
}

if (require.main === module) {
    runOptimalUtahScraping().then(() => {
        console.log('✅ Optimal Utah scraping completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { OptimalUtahRunner, runOptimalUtahScraping };


