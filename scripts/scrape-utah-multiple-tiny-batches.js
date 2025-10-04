const { spawn } = require('child_process');
const path = require('path');

class TinyBatchRunner {
    constructor() {
        this.totalBatches = 10; // Run 10 tiny batches
        this.delayBetweenBatches = 30000; // 30 seconds between batches
        this.results = [];
        this.startTime = Date.now();
    }

    async runMultipleTinyBatches() {
        console.log('🏆 Utah 2024-25 High School Boys - Multiple Tiny Batches');
        console.log(`📊 Running ${this.totalBatches} tiny batches (1 event, 2 teams each)`);
        console.log(`⏱️ Delay between batches: ${this.delayBetweenBatches / 1000} seconds`);
        console.log(`🎯 Estimated total time: ~${Math.round((this.totalBatches * this.delayBetweenBatches) / 60000)} minutes`);
        console.log('');

        for (let batchNum = 1; batchNum <= this.totalBatches; batchNum++) {
            console.log(`\n🚀 Starting Tiny Batch ${batchNum}/${this.totalBatches}`);
            console.log('📊 Processing: 1 event, 2 teams maximum');
            
            const batchStartTime = Date.now();
            
            try {
                const result = await this.runSingleTinyBatch(batchNum);
                const batchDuration = Math.round((Date.now() - batchStartTime) / 1000);
                
                this.results.push({
                    batchNumber: batchNum,
                    success: true,
                    duration: batchDuration,
                    result: result
                });
                
                console.log(`✅ Tiny Batch ${batchNum} completed in ${batchDuration} seconds`);
                
                if (result && result.processedMatches > 0) {
                    console.log(`🎯 Found ${result.processedMatches} new matches!`);
                } else {
                    console.log(`ℹ️ No new matches (likely duplicates or no data)`);
                }
                
                // Delay before next batch (except for last batch)
                if (batchNum < this.totalBatches) {
                    console.log(`⏳ Waiting ${this.delayBetweenBatches / 1000} seconds before next batch...`);
                    await this.sleep(this.delayBetweenBatches);
                }
                
            } catch (error) {
                console.error(`❌ Tiny Batch ${batchNum} failed:`, error.message);
                
                this.results.push({
                    batchNumber: batchNum,
                    success: false,
                    duration: Math.round((Date.now() - batchStartTime) / 1000),
                    error: error.message
                });
                
                // Shorter delay before retry
                console.log(`⏳ Waiting 10 seconds before next batch...`);
                await this.sleep(10000);
            }
        }
        
        await this.generateFinalReport();
    }

    async runSingleTinyBatch(batchNumber) {
        return new Promise((resolve, reject) => {
            const child = spawn('node', ['scripts/scrape-utah-tiny-batch.js'], {
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
                    // Parse the result from stdout
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
            
            // Set a timeout for each batch
            setTimeout(() => {
                if (!child.killed) {
                    child.kill();
                    reject(new Error('Batch timed out after 5 minutes'));
                }
            }, 300000); // 5 minute timeout per batch
        });
    }

    parseBatchResult(stdout) {
        // Parse the stdout to extract results
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
        
        console.log('\n📊 FINAL REPORT - Multiple Tiny Batches');
        console.log('=' * 50);
        
        const successfulBatches = this.results.filter(r => r.success);
        const failedBatches = this.results.filter(r => !r.success);
        
        console.log(`📈 Total Batches: ${this.totalBatches}`);
        console.log(`✅ Successful Batches: ${successfulBatches.length}`);
        console.log(`❌ Failed Batches: ${failedBatches.length}`);
        console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 60)} minutes`);
        
        if (successfulBatches.length > 0) {
            const totalMatches = successfulBatches.reduce((sum, batch) => sum + (batch.result?.processedMatches || 0), 0);
            const totalEvents = successfulBatches.reduce((sum, batch) => sum + (batch.result?.totalEvents || 0), 0);
            const totalTeams = successfulBatches.reduce((sum, batch) => sum + (batch.result?.totalTeams || 0), 0);
            
            console.log(`🥊 Total Matches Processed: ${totalMatches}`);
            console.log(`📅 Total Events Processed: ${totalEvents}`);
            console.log(`🏫 Total Teams Processed: ${totalTeams}`);
            
            const avgDuration = successfulBatches.reduce((sum, batch) => sum + batch.duration, 0) / successfulBatches.length;
            console.log(`📊 Average Batch Duration: ${avgDuration.toFixed(1)} seconds`);
        }
        
        if (failedBatches.length > 0) {
            console.log('\n❌ Failed Batches:');
            failedBatches.forEach(batch => {
                console.log(`   Batch ${batch.batchNumber}: ${batch.error}`);
            });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        if (successfulBatches.length > 0) {
            console.log('✅ Tiny batch strategy is working!');
            console.log('🔄 You can:');
            console.log('   1. Run this script again to process more events');
            console.log('   2. Increase batch size gradually (try 3-5 teams)');
            console.log('   3. Reduce delays between batches if stable');
        } else {
            console.log('⚠️ All batches failed. The issue is likely in the browser automation itself.');
            console.log('💡 Consider:');
            console.log('   1. Checking browser/network issues');
            console.log('   2. Using a different scraping approach');
            console.log('   3. Running during off-peak hours');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            totalBatches: this.totalBatches,
            successfulBatches: successfulBatches.length,
            failedBatches: failedBatches.length,
            totalDuration: totalDuration,
            results: this.results
        };
        
        require('fs').writeFileSync(
            path.join(__dirname, 'tiny-batches-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: tiny-batches-report.json');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function runMultipleTinyBatches() {
    const runner = new TinyBatchRunner();
    await runner.runMultipleTinyBatches();
}

if (require.main === module) {
    runMultipleTinyBatches().then(() => {
        console.log('✅ Multiple tiny batches completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { TinyBatchRunner, runMultipleTinyBatches };


