const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function killPuppeteerInstances() {
    console.log('🔍 Looking for Puppeteer Chrome instances...');
    
    try {
        // Find Chrome processes with Puppeteer-specific flags
        const { stdout } = await execAsync('ps aux | grep -E "chrome.*--no-sandbox|chrome.*--disable-setuid-sandbox|chrome.*--disable-dev-shm-usage|chrome.*--remote-debugging" | grep -v grep');
        
        if (!stdout.trim()) {
            console.log('✅ No Puppeteer instances found running');
            return;
        }
        
        console.log('🎯 Found Puppeteer instances:');
        console.log(stdout);
        
        // Extract process IDs
        const lines = stdout.trim().split('\n');
        const pids = lines.map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[1]; // PID is the second column
        }).filter(pid => pid && !isNaN(pid));
        
        if (pids.length === 0) {
            console.log('⚠️ No valid PIDs found');
            return;
        }
        
        console.log(`🔫 Killing ${pids.length} Puppeteer processes...`);
        
        for (const pid of pids) {
            try {
                await execAsync(`kill -9 ${pid}`);
                console.log(`✅ Killed process ${pid}`);
            } catch (error) {
                console.log(`⚠️ Failed to kill process ${pid}: ${error.message}`);
            }
        }
        
        console.log('✅ Puppeteer cleanup completed');
        
    } catch (error) {
        console.log('✅ No Puppeteer instances found');
    }
}

// Also create a function to kill all Chrome processes with specific Puppeteer patterns
async function killAllPuppeteerChrome() {
    console.log('🔍 Looking for all Chrome processes that might be Puppeteer instances...');
    
    try {
        // More aggressive approach - look for Chrome processes with multiple flags that indicate Puppeteer
        const { stdout } = await execAsync('ps aux | grep -i chrome | grep -v grep');
        
        if (!stdout.trim()) {
            console.log('✅ No Chrome processes found');
            return;
        }
        
        const lines = stdout.trim().split('\n');
        const puppeteerProcesses = lines.filter(line => {
            // Look for Chrome processes with multiple Puppeteer-like flags
            const flags = line.toLowerCase();
            const hasMultipleFlags = (
                flags.includes('--no-sandbox') ||
                flags.includes('--disable-setuid-sandbox') ||
                flags.includes('--disable-dev-shm-usage') ||
                flags.includes('--remote-debugging') ||
                flags.includes('--disable-web-security') ||
                flags.includes('--disable-features')
            );
            
            // Also check for processes that seem to be automated (not user Chrome)
            const isAutomated = flags.includes('--disable-extensions') && flags.includes('--disable-plugins');
            
            return hasMultipleFlags || isAutomated;
        });
        
        if (puppeteerProcesses.length === 0) {
            console.log('✅ No Puppeteer-like Chrome processes found');
            return;
        }
        
        console.log('🎯 Found potentially automated Chrome processes:');
        puppeteerProcesses.forEach((process, index) => {
            console.log(`${index + 1}. ${process}`);
        });
        
        const pids = puppeteerProcesses.map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[1];
        }).filter(pid => pid && !isNaN(pid));
        
        console.log(`\n🔫 Killing ${pids.length} potentially automated Chrome processes...`);
        
        for (const pid of pids) {
            try {
                await execAsync(`kill -9 ${pid}`);
                console.log(`✅ Killed automated Chrome process ${pid}`);
            } catch (error) {
                console.log(`⚠️ Failed to kill process ${pid}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log('✅ No automated Chrome processes found');
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--aggressive')) {
        await killAllPuppeteerChrome();
    } else {
        await killPuppeteerInstances();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { killPuppeteerInstances, killAllPuppeteerChrome };


