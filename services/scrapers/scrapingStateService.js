const fs = require('fs');
const path = require('path');

/**
 * Service for managing scraping state and progress
 * Single Responsibility: Track and persist scraping progress
 */
class ScrapingStateService {
  
  constructor(seasonName, stateId) {
    this.seasonName = seasonName;
    this.stateId = stateId;
    this.stateFileName = `scraping-state-${seasonName.replace(/[^a-zA-Z0-9]/g, '-')}-${stateId}.json`;
    this.stateFilePath = path.join(__dirname, '..', '..', 'data', this.stateFileName);
    this.state = this.loadState();
  }

  /**
   * Load existing state from file
   * @returns {Object} Current scraping state
   */
  loadState() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const stateData = fs.readFileSync(this.stateFilePath, 'utf8');
        const state = JSON.parse(stateData);
        console.log(`📂 Loaded existing scraping state: ${state.processedEvents.length} events processed`);
        return state;
      }
    } catch (error) {
      console.warn(`⚠️  Could not load existing state: ${error.message}`);
    }

    // Return default state
    return {
      seasonName: this.seasonName,
      stateId: this.stateId,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      totalEvents: 0,
      processedEvents: [],
      skippedEvents: [],
      failedEvents: [],
      currentEventIndex: 0,
      totalMatches: 0,
      processedMatches: 0,
      errors: []
    };
  }

  /**
   * Save current state to file
   */
  saveState() {
    try {
      this.state.lastUpdate = new Date().toISOString();
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
      console.log(`💾 Saved scraping state to ${this.stateFileName}`);
    } catch (error) {
      console.error(`❌ Failed to save state: ${error.message}`);
    }
  }

  /**
   * Initialize state with event list
   * @param {Array} events - Array of events with dates
   */
  initializeEvents(events) {
    this.state.totalEvents = events.length;
    this.state.events = events;
    this.state.currentEventIndex = 0;
    
    // Find where we left off
    if (this.state.processedEvents.length > 0) {
      const lastProcessedEvent = this.state.processedEvents[this.state.processedEvents.length - 1];
      const lastProcessedIndex = events.findIndex(event => 
        event.text === lastProcessedEvent.text && 
        event.dateText === lastProcessedEvent.dateText
      );
      
      if (lastProcessedIndex >= 0) {
        this.state.currentEventIndex = lastProcessedIndex + 1;
        console.log(`🔄 Resuming from event ${this.state.currentEventIndex + 1}/${events.length}`);
      }
    }
    
    this.saveState();
  }

  /**
   * Get next event to process
   * @returns {Object|null} Next event or null if all processed
   */
  getNextEvent() {
    if (!this.state.events || this.state.currentEventIndex >= this.state.events.length) {
      return null;
    }
    
    return this.state.events[this.state.currentEventIndex];
  }

  /**
   * Mark event as processed
   * @param {Object} event - Event that was processed
   * @param {Object} result - Processing result
   */
  markEventProcessed(event, result) {
    const eventData = {
      ...event,
      processedAt: new Date().toISOString(),
      result: result
    };
    
    this.state.processedEvents.push(eventData);
    this.state.currentEventIndex++;
    this.state.totalMatches += result.totalMatches || 0;
    this.state.processedMatches += result.processedMatches || 0;
    
    console.log(`✅ Event processed: ${event.text} (${result.processedMatches || 0} matches)`);
    this.saveState();
  }

  /**
   * Mark event as skipped
   * @param {Object} event - Event that was skipped
   * @param {string} reason - Reason for skipping
   */
  markEventSkipped(event, reason) {
    const eventData = {
      ...event,
      skippedAt: new Date().toISOString(),
      reason: reason
    };
    
    this.state.skippedEvents.push(eventData);
    this.state.currentEventIndex++;
    
    console.log(`⏭️  Event skipped: ${event.text} (${reason})`);
    this.saveState();
  }

  /**
   * Mark event as failed
   * @param {Object} event - Event that failed
   * @param {string} error - Error message
   */
  markEventFailed(event, error) {
    const eventData = {
      ...event,
      failedAt: new Date().toISOString(),
      error: error
    };
    
    this.state.failedEvents.push(eventData);
    this.state.currentEventIndex++;
    this.state.errors.push({
      type: 'event_processing',
      event: event.text,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    console.log(`❌ Event failed: ${event.text} (${error})`);
    this.saveState();
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getStats() {
    const totalProcessed = this.state.processedEvents.length;
    const totalSkipped = this.state.skippedEvents.length;
    const totalFailed = this.state.failedEvents.length;
    const totalEvents = this.state.totalEvents;
    const remaining = totalEvents - (totalProcessed + totalSkipped + totalFailed);
    
    return {
      totalEvents,
      processed: totalProcessed,
      skipped: totalSkipped,
      failed: totalFailed,
      remaining,
      currentEventIndex: this.state.currentEventIndex,
      totalMatches: this.state.totalMatches,
      processedMatches: this.state.processedMatches,
      progressPercentage: totalEvents > 0 ? Math.round((totalProcessed / totalEvents) * 100) : 0
    };
  }

  /**
   * Check if scraping is complete
   * @returns {boolean} True if all events processed
   */
  isComplete() {
    return this.state.currentEventIndex >= this.state.totalEvents;
  }

  /**
   * Get progress summary
   * @returns {string} Progress summary text
   */
  getProgressSummary() {
    const stats = this.getStats();
    
    return `📊 Progress: ${stats.processed}/${stats.totalEvents} events (${stats.progressPercentage}%) | ` +
           `🥊 ${stats.processedMatches} matches | ` +
           `⏭️  ${stats.skipped} skipped | ` +
           `❌ ${stats.failed} failed | ` +
           `⏳ ${stats.remaining} remaining`;
  }

  /**
   * Clean up old state files (keep only last 5)
   */
  static cleanupOldStates() {
    try {
      const dataDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) return;
      
      const stateFiles = fs.readdirSync(dataDir)
        .filter(file => file.startsWith('scraping-state-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(dataDir, file),
          stats: fs.statSync(path.join(dataDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
      
      // Keep only the 5 most recent state files
      const filesToDelete = stateFiles.slice(5);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old state file: ${file.name}`);
      });
      
    } catch (error) {
      console.warn(`⚠️  Could not cleanup old state files: ${error.message}`);
    }
  }
}

module.exports = ScrapingStateService;


