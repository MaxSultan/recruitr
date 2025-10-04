// Athlete Management Application
class AthleteApp {
    constructor() {
        this.athletes = [];
        this.filteredAthletes = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentView = 'cards';
        this.currentSort = { field: 'lastName', order: 'asc' }; // Current sort state
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            search: '',
            state: '',
            team: '',
            year: '',
            weightClass: '',
            division: '',
            grade: '',
            favorites: '',
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.initializeView();
        this.showLoading();
        await this.loadAthletes();
        this.populateFilters();
        this.renderAthletes();
        this.updateStats();
    }
    
    initializeView() {
        // Set initial view button states
        document.getElementById('cardViewBtn').classList.add('active');
        document.getElementById('tableViewBtn').classList.remove('active');
        
        // Set initial view visibility
        document.getElementById('cardView').style.display = 'grid';
        document.getElementById('tableView').style.display = 'none';
    }

    bindEvents() {
        // Search
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce((e) => this.handleSearch(e.target.value), 300));
        document.getElementById('searchBtn').addEventListener('click', 
            () => this.handleSearch(document.getElementById('searchInput').value));

        // Filters
        document.getElementById('stateFilter').addEventListener('change', (e) => this.handleFilter('state', e.target.value));
        document.getElementById('teamFilter').addEventListener('change', (e) => this.handleFilter('team', e.target.value));
        document.getElementById('yearFilter').addEventListener('change', (e) => this.handleFilter('year', e.target.value));
        document.getElementById('weightClassFilter').addEventListener('change', (e) => this.handleFilter('weightClass', e.target.value));
        document.getElementById('divisionFilter').addEventListener('change', (e) => this.handleFilter('division', e.target.value));
        document.getElementById('gradeFilter').addEventListener('change', (e) => this.handleFilter('grade', e.target.value));
        document.getElementById('favoritesFilter').addEventListener('change', (e) => this.handleFilter('favorites', e.target.value));
        document.getElementById('clearFiltersBtn').addEventListener('click', async () => await this.clearFilters());

        // Sorting
        document.getElementById('sortBy').addEventListener('change', (e) => this.handleSort(e.target.value, this.sortOrder));
        document.getElementById('sortOrder').addEventListener('change', (e) => this.handleSort(this.sortBy, e.target.value));

        // View toggle
        document.getElementById('cardViewBtn').addEventListener('click', () => this.switchView('cards'));
        document.getElementById('tableViewBtn').addEventListener('click', () => this.switchView('table'));

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPageBtn').addEventListener('click', () => this.changePage(1));
        document.getElementById('pageSizeSelect').addEventListener('change', (e) => this.changePageSize(parseInt(e.target.value)));

        // Table header sorting
        const sortableHeaders = document.querySelectorAll('th.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.dataset.sort;
                this.sortTable(sortField);
            });
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('athleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'athleteModal') this.closeModal();
        });

        // Merge modal
        document.getElementById('mergeAthletesBtn').addEventListener('click', () => this.openMergeModal());
        document.getElementById('closeMergeModal').addEventListener('click', () => this.closeMergeModal());
        document.getElementById('cancelMergeBtn').addEventListener('click', () => this.closeMergeModal());
        document.getElementById('mergeModal').addEventListener('click', (e) => {
            if (e.target.id === 'mergeModal') this.closeMergeModal();
        });
        
        // Merge athlete search and selection
        document.getElementById('keepAthleteSearch').addEventListener('input', (e) => this.searchAthletes(e.target.value, 'keep'));
        document.getElementById('mergeAthleteSearch').addEventListener('input', (e) => this.searchAthletes(e.target.value, 'merge'));
        document.getElementById('executeMergeBtn').addEventListener('click', () => this.executeMerge());


        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => this.init());

        // Tournament scraper
        document.getElementById('scrapeDataBtn').addEventListener('click', () => this.viewNewData());
        document.getElementById('scrapeAnotherBtn').addEventListener('click', () => this.resetScraper());

        // Season management modals (with null checks)
        const closeAddSeasonModal = document.getElementById('closeAddSeasonModal');
        if (closeAddSeasonModal) closeAddSeasonModal.addEventListener('click', () => this.closeSeasonModals());
        
        const cancelAddSeason = document.getElementById('cancelAddSeason');
        if (cancelAddSeason) cancelAddSeason.addEventListener('click', () => this.closeSeasonModals());
        
        const closeEditSeasonModal = document.getElementById('closeEditSeasonModal');
        if (closeEditSeasonModal) closeEditSeasonModal.addEventListener('click', () => this.closeSeasonModals());
        
        const cancelEditSeason = document.getElementById('cancelEditSeason');
        if (cancelEditSeason) cancelEditSeason.addEventListener('click', () => this.closeSeasonModals());
        
        const closeDeleteSeasonModal = document.getElementById('closeDeleteSeasonModal');
        if (closeDeleteSeasonModal) closeDeleteSeasonModal.addEventListener('click', () => this.closeSeasonModals());
        
        const cancelDeleteSeason = document.getElementById('cancelDeleteSeason');
        if (cancelDeleteSeason) cancelDeleteSeason.addEventListener('click', () => this.closeSeasonModals());

        // Season form submissions (with null checks)
        const addSeasonForm = document.getElementById('addSeasonForm');
        if (addSeasonForm) {
            addSeasonForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const seasonData = {
                year: formData.get('year') || document.getElementById('addSeasonYear').value,
                weightClass: formData.get('weightClass') || document.getElementById('addSeasonWeightClass').value,
                wins: parseInt(document.getElementById('addSeasonWins').value) || 0,
                losses: parseInt(document.getElementById('addSeasonLosses').value) || 0,
                statePlacement: document.getElementById('addSeasonPlacement').value || '',
                pointsScored: parseFloat(document.getElementById('addSeasonPoints').value) || 0,
                team: document.getElementById('addSeasonTeam').value || '',
                division: document.getElementById('addSeasonDivision').value || '',
                grade: document.getElementById('addSeasonGrade').value || '',
                tournamentId: document.getElementById('addSeasonTournamentId').value || null
            };
            this.addSeason(seasonData);
            });
        }

        const editSeasonForm = document.getElementById('editSeasonForm');
        if (editSeasonForm) {
            editSeasonForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const seasonId = document.getElementById('editSeasonId').value;
            const seasonData = {
                year: document.getElementById('editSeasonYear').value,
                weightClass: document.getElementById('editSeasonWeightClass').value,
                wins: parseInt(document.getElementById('editSeasonWins').value) || 0,
                losses: parseInt(document.getElementById('editSeasonLosses').value) || 0,
                statePlacement: document.getElementById('editSeasonPlacement').value || '',
                pointsScored: parseFloat(document.getElementById('editSeasonPoints').value) || 0,
                team: document.getElementById('editSeasonTeam').value || '',
                division: document.getElementById('editSeasonDivision').value || '',
                grade: document.getElementById('editSeasonGrade').value || '',
                tournamentId: document.getElementById('editSeasonTournamentId').value || null
            };
            this.editSeason(seasonId, seasonData);
            });
        }

        const confirmDeleteSeason = document.getElementById('confirmDeleteSeason');
        if (confirmDeleteSeason) {
            confirmDeleteSeason.addEventListener('click', () => {
            if (this.seasonToDelete) {
                this.deleteSeason(this.seasonToDelete);
            }
            });
        }

        // Close modals on backdrop click (with null checks)
        ['addSeasonModal', 'editSeasonModal', 'deleteSeasonModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === modalId) this.closeSeasonModals();
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });

        // Audit trail controls
        document.getElementById('closeAuditTrailBtn')?.addEventListener('click', this.closeAuditTrail);
        document.getElementById('athleteSelect')?.addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.loadAthleteRankingMatches(parseInt(e.target.value));
            }
        });
        document.getElementById('seasonFilter')?.addEventListener('change', async (e) => {
            const athleteId = document.getElementById('athleteSelect').value;
            if (athleteId) {
                await this.loadAthleteRankingMatches(parseInt(athleteId), e.target.value || null);
            }
        });
        document.getElementById('showCharts')?.addEventListener('change', (e) => {
            const chartsContainer = document.getElementById('chartsContainer');
            chartsContainer.style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('showDetails')?.addEventListener('change', (e) => {
            const matchesTimeline = document.getElementById('matchesTimeline');
            matchesTimeline.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    async loadAthletes() {
        try {
            // Load all athletes with a high limit
            const response = await fetch('/api/athletes/search');
            if (!response.ok) throw new Error('Failed to load athletes');
            
            const data = await response.json();
            this.athletes = data.data || [];
            this.filteredAthletes = [...this.athletes];
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading athletes:', error);
            this.showError();
        }
    }

    async loadSearchResults(query) {
        try {
            this.showLoading();
            // Load search results from server
            const response = await fetch(`/api/athletes/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to search athletes');
            
            const data = await response.json();
            this.athletes = data.data || [];
            this.filteredAthletes = [...this.athletes];
            
            this.hideLoading();
        } catch (error) {
            console.error('Error searching athletes:', error);
            this.showError();
        }
    }

    populateFilters() {
        const states = [...new Set(this.athletes.map(a => a.state).filter(Boolean))].sort();
        const teams = [...new Set(this.athletes.flatMap(a => a.seasons.map(s => s.team)))].sort();
        const years = [...new Set(this.athletes.flatMap(a => a.seasons.map(s => s.year)))].sort((a, b) => b - a);
        const weightClasses = [...new Set(this.athletes.flatMap(a => a.seasons.map(s => s.weightClass).filter(Boolean)))].sort((a, b) => parseInt(a) - parseInt(b));
        const divisions = [...new Set(this.athletes.flatMap(a => a.seasons.map(s => s.division).filter(Boolean)))].sort();
        const grades = [...new Set(this.athletes.flatMap(a => a.seasons.map(s => s.grade).filter(Boolean)))].sort();

        this.populateSelect('stateFilter', states);
        this.populateSelect('teamFilter', teams);
        this.populateSelect('yearFilter', years);
        this.populateSelect('weightClassFilter', weightClasses);
        this.populateSelect('divisionFilter', divisions);
        this.populateSelect('gradeFilter', grades);
    }

    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        // Clear existing options except the first one
        select.innerHTML = select.children[0].outerHTML;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // Restore selected value if it still exists
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    async handleSearch(query) {
        this.filters.search = query.toLowerCase();
        
        // If there's a search query, fetch filtered results from server
        // Otherwise, reload all athletes
        if (query && query.trim()) {
            await this.loadSearchResults(query.trim());
        } else {
            await this.loadAthletes();
            this.populateFilters();
        }
        
        this.applyFilters();
    }

    handleFilter(filterType, value) {
        this.filters[filterType] = value;
        this.applyFilters();
    }




    async clearFilters() {
        this.filters = {
            search: '',
            state: '',
            team: '',
            year: '',
            weightClass: '',
            division: '',
            grade: '',
            favorites: '',
        };
        
        // Reset form elements
        document.getElementById('searchInput').value = '';
        document.getElementById('stateFilter').value = '';
        document.getElementById('teamFilter').value = '';
        document.getElementById('yearFilter').value = '';
        document.getElementById('weightClassFilter').value = '';
        document.getElementById('divisionFilter').value = '';
        document.getElementById('gradeFilter').value = '';
        document.getElementById('favoritesFilter').value = '';
        
        // Reload all athletes when clearing search
        await this.loadAthletes();
        this.populateFilters();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredAthletes = this.athletes.filter(athlete => {
            // Skip search filter - handled at server level in handleSearch()
            // Search results are already loaded into this.athletes

            // State filter
            if (this.filters.state && athlete.state !== this.filters.state) return false;

            // Season-based filters
            if (this.filters.team || this.filters.year || this.filters.weightClass || this.filters.division || this.filters.grade) {
                const hasMatchingSeason = athlete.seasons.some(season => {
                    return (!this.filters.team || season.team === this.filters.team) &&
                           (!this.filters.year || season.year === this.filters.year) &&
                           (!this.filters.weightClass || season.weightClass === this.filters.weightClass) &&
                           (!this.filters.division || season.division === this.filters.division) &&
                           (!this.filters.grade || season.grade === this.filters.grade);
                });
                if (!hasMatchingSeason) return false;
            }
            
            // Favorites filter
            if (this.filters.favorites) {
                if (this.filters.favorites === 'favorites' && !athlete.isFavorite) return false;
                if (this.filters.favorites === 'non-favorites' && athlete.isFavorite) return false;
            }


            return true;
        });

        this.currentPage = 1;
        this.sortAthletes();
        this.renderAthletes();
        this.updateStats();
    }

    handleSort(sortBy, sortOrder) {
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        
        // Update UI
        document.getElementById('sortBy').value = sortBy;
        document.getElementById('sortOrder').value = sortOrder;
        
        this.sortAthletes();
        this.renderAthletes();
        this.updateTableHeaders();
    }

    sortAthletes() {
        this.filteredAthletes.sort((a, b) => {
            let aValue, bValue;
            const aStats = this.calculateAthleteStats(a);
            const bStats = this.calculateAthleteStats(b);
            const aImprovement = this.calculateImprovementRate(a);
            const bImprovement = this.calculateImprovementRate(b);

            switch (this.sortBy) {
                case 'name':
                    aValue = `${a.lastName} ${a.firstName}`;
                    bValue = `${b.lastName} ${b.firstName}`;
                    break;
                case 'overallWinRate':
                    aValue = parseFloat(aStats.overallWinRate);
                    bValue = parseFloat(bStats.overallWinRate);
                    break;
                case 'totalWins':
                    aValue = aStats.totalWins;
                    bValue = bStats.totalWins;
                    break;
                case 'totalSeasons':
                    aValue = aStats.totalSeasons;
                    bValue = bStats.totalSeasons;
                    break;
                case 'bestPlacement':
                    // For placement, lower numbers are better, so we reverse the logic
                    aValue = aStats.bestPlacement === 'N/A' ? 999 : parseInt(aStats.bestPlacement.match(/\d+/)?.[0] || 999);
                    bValue = bStats.bestPlacement === 'N/A' ? 999 : parseInt(bStats.bestPlacement.match(/\d+/)?.[0] || 999);
                    break;
                case 'winRateImprovement':
                    aValue = parseFloat(aImprovement.winRateImprovement);
                    bValue = parseFloat(bImprovement.winRateImprovement);
                    break;
                case 'placementImprovement':
                    aValue = parseFloat(aImprovement.placementImprovement);
                    bValue = parseFloat(bImprovement.placementImprovement);
                    break;
                case 'improvementTrend':
                    const trendOrder = { 'improving': 3, 'stable': 2, 'declining': 1, 'insufficient-data': 0 };
                    aValue = trendOrder[aImprovement.improvementTrend] || 0;
                    bValue = trendOrder[bImprovement.improvementTrend] || 0;
                    break;
                case 'totalPoints':
                    aValue = parseFloat(aStats.totalPoints);
                    bValue = parseFloat(bStats.totalPoints);
                    break;
                case 'averagePoints':
                    aValue = parseFloat(aStats.averagePoints);
                    bValue = parseFloat(bStats.averagePoints);
                    break;
                case 'mostRecentYear':
                    aValue = aStats.mostRecentYear;
                    bValue = bStats.mostRecentYear;
                    break;
                default:
                    aValue = a[this.sortBy] || '';
                    bValue = b[this.sortBy] || '';
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update buttons
        document.getElementById('cardViewBtn').classList.toggle('active', view === 'cards');
        document.getElementById('tableViewBtn').classList.toggle('active', view === 'table');
        
        // Show/hide views
        document.getElementById('cardView').style.display = view === 'cards' ? 'grid' : 'none';
        document.getElementById('tableView').style.display = view === 'table' ? 'block' : 'none';
        
        this.renderAthletes();
    }

    renderAthletes() {
        if (this.filteredAthletes.length === 0) {
            this.showEmpty();
            this.hidePagination();
            return;
        }

        this.hideStates();

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageAthletes = this.filteredAthletes.slice(startIndex, endIndex);

        if (this.currentView === 'cards') {
            this.renderCardView(pageAthletes);
        } else {
            this.renderTableView(pageAthletes);
        }

        this.updatePagination();
    }

    renderCardView(athletes) {
        const container = document.getElementById('cardView');
        container.innerHTML = '';

        athletes.forEach(athlete => {
            const card = this.createAthleteCard(athlete);
            container.appendChild(card);
        });
    }

    renderTableView(athletes) {
        const tbody = document.getElementById('athletesTableBody');
        tbody.innerHTML = '';

        athletes.forEach(athlete => {
            const latestSeason = this.getLatestSeason(athlete);
            const row = this.createAthleteRow(athlete, latestSeason);
            tbody.appendChild(row);
        });
    }

    createAthleteCard(athlete) {
        const card = document.createElement('div');
        card.className = 'athlete-card fade-in';
        card.onclick = () => this.showAthleteDetails(athlete);

        const stats = this.calculateAthleteStats(athlete);
        const improvement = this.calculateImprovementRate(athlete);

        // Get improvement trend styling
        const getTrendClass = (trend) => {
            switch(trend) {
                case 'improving': return 'trend-improving';
                case 'declining': return 'trend-declining';
                case 'stable': return 'trend-stable';
                default: return 'trend-unknown';
            }
        };

        const getTrendIcon = (trend) => {
            switch(trend) {
                case 'improving': return 'fas fa-arrow-trend-up';
                case 'declining': return 'fas fa-arrow-trend-down';
                case 'stable': return 'fas fa-minus';
                default: return 'fas fa-question';
            }
        };

        card.innerHTML = `
            <div class="athlete-header">
                <div>
                    <div class="athlete-name">${athlete.firstName} ${athlete.lastName}</div>
                    <div class="athlete-state">${athlete.state || 'N/A'}</div>
                </div>
                <div class="athlete-summary-badge">
                    <div class="seasons-count">${stats.totalSeasons} season${stats.totalSeasons !== 1 ? 's' : ''}</div>
                    <div class="improvement-trend ${getTrendClass(improvement.improvementTrend)}">
                        <i class="${getTrendIcon(improvement.improvementTrend)}"></i>
                        ${improvement.improvementTrend.charAt(0).toUpperCase() + improvement.improvementTrend.slice(1).replace('-', ' ')}
                    </div>
                </div>
            </div>
            
            <div class="athlete-summary">
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="summary-stat-label">Overall Record</div>
                        <div class="summary-stat-value">${stats.totalWins}-${stats.totalLosses} (${stats.overallWinRate}%)</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-label">Best Placement</div>
                        <div class="summary-stat-value ${this.getPlacementClass(stats.bestPlacement)}">${stats.bestPlacement}</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-label">Total Points</div>
                        <div class="summary-stat-value">${stats.totalPoints} pts</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-label">ELO Rating</div>
                        <div class="summary-stat-value">${athlete.elo || 1500}</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-stat-label">Glicko Rating</div>
                        <div class="summary-stat-value">${Math.round(athlete.glickoRating || 1500)}</div>
                    </div>
                </div>
                
                ${improvement.seasonsAnalyzed >= 2 ? `
                <div class="improvement-metrics">
                    <div class="improvement-metric">
                        <span class="metric-label">Win Rate Trend:</span>
                        <span class="metric-value ${parseFloat(improvement.winRateImprovement) > 0 ? 'positive' : parseFloat(improvement.winRateImprovement) < 0 ? 'negative' : 'neutral'}">
                            ${parseFloat(improvement.winRateImprovement) > 0 ? '+' : ''}${improvement.winRateImprovement}%/season
                        </span>
                    </div>
                    <div class="improvement-metric">
                        <span class="metric-label">Placement Trend:</span>
                        <span class="metric-value ${parseFloat(improvement.placementImprovement) > 0 ? 'positive' : parseFloat(improvement.placementImprovement) < 0 ? 'negative' : 'neutral'}">
                            ${parseFloat(improvement.placementImprovement) > 0 ? '+' : ''}${improvement.placementImprovement} places/season
                        </span>
                    </div>
                </div>
                ` : ''}
                
                <div class="teams-summary">
                    <div class="summary-label">Teams: ${stats.teams.slice(0, 2).join(', ')}${stats.teams.length > 2 ? ` +${stats.teams.length - 2} more` : ''}</div>
                    <div class="summary-label">Weight Classes: ${stats.weightClasses.slice(0, 3).join(', ')}${stats.weightClasses.length > 3 ? '...' : ''}</div>
                </div>
            </div>
            
            <div class="card-footer">
                <small class="text-muted">Click to view detailed season history</small>
            </div>
        `;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';  
        
        // Add favorite button
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = `favorite-btn ${athlete.isFavorite ? 'favorited' : ''}`;
        favoriteBtn.innerHTML = '<i class="fas fa-star"></i>';
        favoriteBtn.title = 'Toggle Favorite';
        favoriteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleFavorite(athlete.id);
        };
        actionsContainer.appendChild(favoriteBtn);
        
        // Add chart button next to favorite button
        const chartBtn = document.createElement('button');
        chartBtn.className = 'chart-btn';
        chartBtn.innerHTML = '<i class="fas fa-chart-line"></i>';
        chartBtn.title = 'View Rating Chart';
        chartBtn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = `/athletes/${athlete.id}/ranking_audit`;
        };
        actionsContainer.appendChild(chartBtn);
        card.appendChild(actionsContainer);

        return card;
    }

    createAthleteRow(athlete, season) {
        const row = document.createElement('tr');
        row.onclick = () => this.showAthleteDetails(athlete);
        row.style.cursor = 'pointer';

        const stats = this.calculateAthleteStats(athlete);
        const improvement = this.calculateImprovementRate(athlete);
        
        const getTrendDisplay = (trend) => {
            const icons = {
                'improving': '📈',
                'declining': '📉',
                'stable': '➡️',
                'insufficient-data': '❓'
            };
            return `${icons[trend] || '❓'} ${trend.charAt(0).toUpperCase() + trend.slice(1).replace('-', ' ')}`;
        };

        const getTrendValue = (value, isPositive) => {
            const num = parseFloat(value);
            if (num === 0) return '0';
            const prefix = num > 0 ? '+' : '';
            const className = num > 0 ? (isPositive ? 'positive' : 'negative') : (isPositive ? 'negative' : 'positive');
            return `<span class="${className}">${prefix}${value}</span>`;
        };
        
        row.innerHTML = `
            <td>
                <strong>${athlete.firstName} ${athlete.lastName}</strong>
                <button class="favorite-btn ${athlete.isFavorite ? 'favorited' : ''}" 
                        onclick="event.stopPropagation(); app.toggleFavorite(${athlete.id})">
                    <i class="fas fa-star"></i>
                </button>
            </td>
            <td>${athlete.state || 'N/A'}</td>
            <td>${stats.teams.length > 0 ? stats.teams[0] : 'N/A'}</td>
            <td><span class="badge badge-info">${stats.totalSeasons}</span></td>
            <td><span class="${this.getPlacementClass(stats.bestPlacement)}">${stats.bestPlacement}</span></td>
            <td><span class="rating-badge elo">${athlete.elo || 1500}</span></td>
            <td><span class="rating-badge glicko">${Math.round(athlete.glickoRating || 1500)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); app.showAthleteDetails(${JSON.stringify(athlete).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); window.location.href='/athletes/${athlete.id}/ranking_audit'" title="View Rating Audit Trail">
                        <i class="fas fa-chart-line"></i> Graph
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    showAthleteDetails(athlete) {
        const modal = document.getElementById('athleteModal');
        const title = document.getElementById('modalAthleteTitle');
        const body = document.getElementById('modalAthleteDetails');

        title.textContent = `${athlete.firstName} ${athlete.lastName}`;

        const totalWins = athlete.seasons.reduce((sum, s) => sum + s.wins, 0);
        const totalLosses = athlete.seasons.reduce((sum, s) => sum + s.losses, 0);
        const totalPoints = athlete.seasons.reduce((sum, s) => sum + parseFloat(s.pointsScored), 0);
        const overallWinRate = totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1) : 0;

        body.innerHTML = `
            <div class="athlete-overview">
                <h3>Overview</h3>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-number">${athlete.state || 'N/A'}</div>
                        <div class="stat-label">State</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${athlete.seasons.length}</div>
                        <div class="stat-label">Seasons</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalWins}-${totalLosses}</div>
                        <div class="stat-label">Overall Record</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${overallWinRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalPoints.toFixed(1)}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                </div>
            </div>
            
            <div class="seasons-details">
                <div class="seasons-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Season History</h3>
                    <button class="btn btn-primary btn-small" onclick="app.openAddSeasonModal(${athlete.id})">
                        <i class="fas fa-plus"></i> Add Season
                    </button>
                </div>
                <div class="seasons-list">
                    ${athlete.seasons.map(season => `
                        <div class="season-item" style="margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; position: relative;">
                            <div class="season-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                <div class="season-title">
                                    <span class="season-team" style="font-size: 1.1rem; font-weight: 600;">${season.team}</span>
                                    <span class="season-year" style="background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; margin-left: 0.75rem;">${season.year}</span>
                                </div>
                                <div class="season-actions" style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                                    <button class="btn btn-small btn-secondary" onclick="app.openEditSeasonModal(${season.id})" title="Edit Season">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-small btn-danger" onclick="app.openDeleteSeasonModal(${season.id}, '${season.year}', '${season.weightClass}', '${season.team}')" title="Delete Season">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="season-details" style="margin-top: 0.5rem;">
                                <div class="season-stat">
                                    <div class="season-stat-label">Record</div>
                                    <div class="season-stat-value">${season.wins}-${season.losses}</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Win Rate</div>
                                    <div class="season-stat-value">${this.calculateWinRate(season)}%</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Points</div>
                                    <div class="season-stat-value">${parseFloat(season.pointsScored).toFixed(1)}</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Weight Class</div>
                                    <div class="season-stat-value">${season.weightClass || 'N/A'}</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Division</div>
                                    <div class="season-stat-value">${season.division || 'N/A'}</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Placement</div>
                                    <div class="season-stat-value ${this.getPlacementClass(season.statePlacement)}">${season.statePlacement}</div>
                                </div>
                                <div class="season-stat">
                                    <div class="season-stat-label">Grade</div>
                                    <div class="season-stat-value">${season.grade || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('athleteModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Season management methods
    openAddSeasonModal(athleteId) {
        this.currentAthleteId = athleteId;
        const modal = document.getElementById('addSeasonModal');
        
        // Reset form
        document.getElementById('addSeasonForm').reset();
        
        // Set default year to current year
        document.getElementById('addSeasonYear').value = new Date().getFullYear();
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    async openEditSeasonModal(seasonId) {
        try {
            // Fetch season data
            const response = await fetch(`/api/seasons/${seasonId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch season data');
            }
            
            const season = data.data;
            
            // Populate form with season data
            document.getElementById('editSeasonId').value = season.id;
            document.getElementById('editSeasonYear').value = season.year;
            document.getElementById('editSeasonWeightClass').value = season.weightClass || '';
            document.getElementById('editSeasonWins').value = season.wins || 0;
            document.getElementById('editSeasonLosses').value = season.losses || 0;
            document.getElementById('editSeasonPlacement').value = season.statePlacement || '';
            document.getElementById('editSeasonPoints').value = season.pointsScored || 0;
            document.getElementById('editSeasonTeam').value = season.team || '';
            document.getElementById('editSeasonDivision').value = season.division || '';
            document.getElementById('editSeasonGrade').value = season.grade || '';
            document.getElementById('editSeasonTournamentId').value = season.tournamentId || '';
            
            const modal = document.getElementById('editSeasonModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error fetching season data:', error);
            alert('Failed to load season data: ' + error.message);
        }
    }

    openDeleteSeasonModal(seasonId, year, weightClass, team) {
        this.seasonToDelete = seasonId;
        
        // Populate delete confirmation info
        document.getElementById('deleteSeasonInfo').innerHTML = `
            <div class="season-summary">
                <strong>${year} - ${weightClass}lbs</strong><br>
                <span style="color: #666;">${team}</span>
            </div>
        `;
        
        const modal = document.getElementById('deleteSeasonModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeSeasonModals() {
        const modals = ['addSeasonModal', 'editSeasonModal', 'deleteSeasonModal'];
        modals.forEach(modalId => {
            document.getElementById(modalId).style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    async addSeason(formData) {
        try {
            const response = await fetch(`/api/athletes/${this.currentAthleteId}/seasons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to add season');
            }
            
            console.log('Season added successfully:', data.data);
            this.closeSeasonModals();
            
            // Refresh the athlete data and update the modal
            await this.refreshAthleteInModal(this.currentAthleteId);
            
            // Show success message
            this.showNotification('Season added successfully!', 'success');
            
        } catch (error) {
            console.error('Error adding season:', error);
            alert('Failed to add season: ' + error.message);
        }
    }

    async editSeason(seasonId, formData) {
        try {
            const response = await fetch(`/api/seasons/${seasonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to update season');
            }
            
            console.log('Season updated successfully:', data.data);
            this.closeSeasonModals();
            
            // Refresh the athlete data and update the modal
            await this.refreshAthleteInModal(data.data.athlete.id);
            
            // Show success message
            this.showNotification('Season updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error updating season:', error);
            alert('Failed to update season: ' + error.message);
        }
    }

    async deleteSeason(seasonId) {
        try {
            const response = await fetch(`/api/seasons/${seasonId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete season');
            }
            
            console.log('Season deleted successfully:', data.data);
            this.closeSeasonModals();
            
            // Refresh athlete data - we need to get the athlete ID from the current modal
            const athleteTitle = document.getElementById('modalAthleteTitle').textContent;
            const athlete = this.athletes.find(a => `${a.firstName} ${a.lastName}` === athleteTitle);
            if (athlete) {
                await this.refreshAthleteInModal(athlete.id);
            }
            
            // Show success message
            this.showNotification('Season deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting season:', error);
            alert('Failed to delete season: ' + error.message);
        }
    }

    async refreshAthleteInModal(athleteId) {
        try {
            const response = await fetch(`/api/athletes/${athleteId}`);
            const data = await response.json();
            
            if (data.success) {
                const updatedAthlete = data.data;
                
                // Update the athlete in our local array
                const index = this.athletes.findIndex(a => a.id === athleteId);
                if (index !== -1) {
                    this.athletes[index] = updatedAthlete;
                }
                
                // Refresh the modal display
                this.showAthleteDetails(updatedAthlete);
                
                // Also refresh the main view
                this.renderAthletes();
            }
        } catch (error) {
            console.error('Error refreshing athlete data:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Manual merge interface
    openMergeModal() {
        this.selectedKeepAthlete = null;
        this.selectedMergeAthlete = null;
        
        const modal = document.getElementById('mergeModal');
        modal.style.display = 'block';
        
        // Populate both athlete lists initially
        this.populateAthleteList('keep', this.athletes);
        this.populateAthleteList('merge', this.athletes);
        
        // Clear search inputs
        document.getElementById('keepAthleteSearch').value = '';
        document.getElementById('mergeAthleteSearch').value = '';
        
        // Hide selected athlete displays
        document.getElementById('selectedKeepAthlete').style.display = 'none';
        document.getElementById('selectedMergeAthlete').style.display = 'none';
        
        // Disable merge button
        document.getElementById('executeMergeBtn').disabled = true;
    }

    closeMergeModal() {
        document.getElementById('mergeModal').style.display = 'none';
        this.selectedKeepAthlete = null;
        this.selectedMergeAthlete = null;
    }

    searchAthletes(query, type) {
        const filteredAthletes = query ? 
            this.athletes.filter(athlete => 
                `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(query.toLowerCase())
            ) : this.athletes;
            
        this.populateAthleteList(type, filteredAthletes);
    }

    populateAthleteList(type, athletes) {
        const listId = type === 'keep' ? 'keepAthleteList' : 'mergeAthleteList';
        const list = document.getElementById(listId);
        
        if (athletes.length === 0) {
            list.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">No athletes found</div>';
            return;
        }
        
        list.innerHTML = athletes.map(athlete => `
            <div class="athlete-item" 
                 style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;"
                 onmouseover="this.style.background='#f8f9fa'"
                 onmouseout="this.style.background='white'"
                 onclick="app.selectAthlete(${athlete.id}, '${type}')">
                <div style="font-weight: 500;">${athlete.firstName} ${athlete.lastName}</div>
                <div style="font-size: 0.85rem; color: #666;">
                    ${athlete.state || 'N/A'} • ${athlete.seasons.length} season${athlete.seasons.length !== 1 ? 's' : ''}
                </div>
            </div>
        `).join('');
    }

    selectAthlete(athleteId, type) {
        const athlete = this.athletes.find(a => a.id === athleteId);
        if (!athlete) return;

        if (type === 'keep') {
            this.selectedKeepAthlete = athlete;
            this.displaySelectedAthlete(athlete, 'selectedKeepAthlete');
        } else {
            this.selectedMergeAthlete = athlete;
            this.displaySelectedAthlete(athlete, 'selectedMergeAthlete');
        }
        
        // Enable merge button if both athletes are selected and different
        const mergeBtn = document.getElementById('executeMergeBtn');
        mergeBtn.disabled = !(this.selectedKeepAthlete && 
                             this.selectedMergeAthlete && 
                             this.selectedKeepAthlete.id !== this.selectedMergeAthlete.id);
    }

    displaySelectedAthlete(athlete, containerId) {
        const container = document.getElementById(containerId);
        const stats = this.calculateAthleteStats(athlete);
        
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem;">${athlete.firstName} ${athlete.lastName}</div>
                    <div style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                        ${athlete.state || 'N/A'} • ${athlete.seasons.length} seasons • ${stats.totalWins}-${stats.totalLosses} record
                    </div>
                </div>
                <button onclick="app.${containerId === 'selectedKeepAthlete' ? 'clearKeepSelection' : 'clearMergeSelection'}()" 
                        style="background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.style.display = 'block';
    }

    clearKeepSelection() {
        this.selectedKeepAthlete = null;
        document.getElementById('selectedKeepAthlete').style.display = 'none';
        document.getElementById('executeMergeBtn').disabled = true;
    }

    clearMergeSelection() {
        this.selectedMergeAthlete = null;
        document.getElementById('selectedMergeAthlete').style.display = 'none';
        document.getElementById('executeMergeBtn').disabled = true;
    }

    async executeMerge() {
        if (!this.selectedKeepAthlete || !this.selectedMergeAthlete) {
            alert('Please select both athletes to merge.');
            return;
        }

        if (this.selectedKeepAthlete.id === this.selectedMergeAthlete.id) {
            alert('Cannot merge an athlete with themselves. Please select two different athletes.');
            return;
        }

        const keepName = `${this.selectedKeepAthlete.firstName} ${this.selectedKeepAthlete.lastName}`;
        const mergeName = `${this.selectedMergeAthlete.firstName} ${this.selectedMergeAthlete.lastName}`;

        if (!confirm(`Are you sure you want to merge "${mergeName}" into "${keepName}"?\n\nThis will:\n• Move all ${this.selectedMergeAthlete.seasons.length} seasons from ${mergeName} to ${keepName}\n• Delete the ${mergeName} athlete record\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch('/api/athletes/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keepAthleteId: this.selectedKeepAthlete.id,
                    mergeAthleteId: this.selectedMergeAthlete.id
                })
            });

            if (!response.ok) throw new Error('Failed to merge athletes');
            
            const result = await response.json();
            
            alert(`✅ Successfully merged athletes!\n\nMoved ${result.data.mergedSeasons} seasons from "${result.data.deletedAthlete.firstName} ${result.data.deletedAthlete.lastName}" to "${result.data.athlete.firstName} ${result.data.athlete.lastName}".`);
            
            // Close the modal
            this.closeMergeModal();
            
            // Refresh the main athlete list
            await this.loadAthletes();
            this.populateFilters();
            this.renderAthletes();
            this.updateStats();
            
        } catch (error) {
            console.error('Error merging athletes:', error);
            alert('❌ Failed to merge athletes. Please try again.');
        }
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredAthletes.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderAthletes();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    changePageSize(newSize) {
        this.itemsPerPage = newSize;
        this.currentPage = 1; // Reset to first page when changing page size
        this.renderAthletes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredAthletes.length / this.itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }

        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredAthletes.length);
        
        pageInfo.innerHTML = `
            <div>Page ${this.currentPage} of ${totalPages}</div>
            <div class="pagination-info">Showing ${startItem}-${endItem} of ${this.filteredAthletes.length} athletes</div>
        `;
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        
        // Update button text with page numbers
        if (this.currentPage > 1) {
            prevBtn.innerHTML = `<i class="fas fa-chevron-left"></i> Page ${this.currentPage - 1}`;
        } else {
            prevBtn.innerHTML = `<i class="fas fa-chevron-left"></i> Previous`;
        }
        
        if (this.currentPage < totalPages) {
            nextBtn.innerHTML = `Page ${this.currentPage + 1} <i class="fas fa-chevron-right"></i>`;
        } else {
            nextBtn.innerHTML = `Next <i class="fas fa-chevron-right"></i>`;
        }
        
        // Generate page number buttons
        this.generatePageNumbers(totalPages);
        
        // Show pagination (only when we have multiple pages)
        this.showPagination();
    }
    
    generatePageNumbers(totalPages) {
        const paginationPages = document.getElementById('paginationPages');
        if (!paginationPages) return; // Skip if element doesn't exist
        
        paginationPages.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const maxVisiblePages = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.createPageButton(1, paginationPages);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationPages.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (let page = startPage; page <= endPage; page++) {
            this.createPageButton(page, paginationPages);
        }
        
        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationPages.appendChild(ellipsis);
            }
            this.createPageButton(totalPages, paginationPages);
        }
    }
    
    createPageButton(pageNum, container) {
        const button = document.createElement('button');
        button.className = `btn btn-small pagination-page ${pageNum === this.currentPage ? 'active' : ''}`;
        button.textContent = pageNum;
        button.onclick = () => this.goToPage(pageNum);
        container.appendChild(button);
    }
    
    goToPage(pageNum) {
        const totalPages = Math.ceil(this.filteredAthletes.length / this.itemsPerPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            this.currentPage = pageNum;
            this.renderAthletes();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showPagination() {
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'block';
    }

    hidePagination() {
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'none';
    }

    updateStats() {
        const totalSeasons = this.athletes.reduce((sum, athlete) => sum + athlete.seasons.length, 0);
        
        const totalAthletes = document.getElementById('totalAthletes');
        if (totalAthletes) totalAthletes.textContent = this.athletes.length;
        
        const totalSeasonsEl = document.getElementById('totalSeasons');
        if (totalSeasonsEl) totalSeasonsEl.textContent = totalSeasons;
        
        const displayedAthletes = document.getElementById('displayedAthletes');
        if (displayedAthletes) displayedAthletes.textContent = this.filteredAthletes.length;
    }

    updateTableHeaders() {
        document.querySelectorAll('th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        const currentHeader = document.querySelector(`th[data-sort="${this.sortBy}"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'}`;
        }
    }

    sortTable(sortField) {
        // Toggle sort order if clicking the same field
        if (this.currentSort.field === sortField) {
            this.currentSort.order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = sortField;
            this.currentSort.order = 'asc';
        }

        // Update the dropdowns to match
        const sortBySelect = document.getElementById('sortBy');
        const sortOrderSelect = document.getElementById('sortOrder');
        if (sortBySelect) sortBySelect.value = sortField;
        if (sortOrderSelect) sortOrderSelect.value = this.currentSort.order;

        // Use the existing handleSort method
        this.handleSort(sortField, this.currentSort.order);
    }

    // Utility functions
    getLatestSeason(athlete) {
        return athlete.seasons.length > 0 ? athlete.seasons[0] : null;
    }

    calculateWinRate(season) {
        if (!season || (season.wins + season.losses) === 0) return 0;
        return ((season.wins / (season.wins + season.losses)) * 100).toFixed(1);
    }

    getPlacementClass(placement) {
        if (!placement) return '';
        if (placement.includes('1st')) return 'placement-1st';
        if (placement.includes('2nd')) return 'placement-2nd';
        if (placement.includes('3rd')) return 'placement-3rd';
        return '';
    }

    // Multi-season analysis functions
    calculateAthleteStats(athlete) {
        if (!athlete.seasons || athlete.seasons.length === 0) {
            return {
                totalSeasons: 0,
                totalWins: 0,
                totalLosses: 0,
                overallWinRate: 0,
                totalPoints: 0,
                averagePoints: 0,
                bestPlacement: 'N/A',
                mostRecentYear: 'N/A',
                teams: [],
                weightClasses: [],
                divisions: []
            };
        }

        const seasons = [...athlete.seasons].sort((a, b) => parseInt(b.year) - parseInt(a.year));
        const totalWins = seasons.reduce((sum, s) => sum + (s.wins || 0), 0);
        const totalLosses = seasons.reduce((sum, s) => sum + (s.losses || 0), 0);
        const totalPoints = seasons.reduce((sum, s) => sum + (parseFloat(s.pointsScored) || 0), 0);
        const overallWinRate = totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100) : 0;
        
        // Find best placement (lowest number or highest ranking)
        const placements = seasons.map(s => s.statePlacement).filter(p => p && p !== 'N/A' && p.match(/\d/));
        const bestPlacement = placements.length > 0 ? 
            placements.reduce((best, current) => {
                const bestNum = parseInt(best.match(/\d+/)[0]);
                const currentNum = parseInt(current.match(/\d+/)[0]);
                return currentNum < bestNum ? current : best;
            }) : 'N/A';

        return {
            totalSeasons: seasons.length,
            totalWins,
            totalLosses,
            overallWinRate: overallWinRate.toFixed(1),
            totalPoints: totalPoints.toFixed(1),
            averagePoints: (totalPoints / seasons.length).toFixed(1),
            bestPlacement,
            mostRecentYear: seasons[0]?.year || 'N/A',
            teams: [...new Set(seasons.map(s => s.team))],
            weightClasses: [...new Set(seasons.map(s => s.weightClass).filter(Boolean))],
            divisions: [...new Set(seasons.map(s => s.division).filter(Boolean))]
        };
    }

    calculateImprovementRate(athlete) {
        if (!athlete.seasons || athlete.seasons.length < 2) {
            return {
                winRateImprovement: 0,
                placementImprovement: 0,
                pointsImprovement: 0,
                seasonsAnalyzed: athlete.seasons?.length || 0,
                improvementTrend: 'insufficient-data'
            };
        }

        const seasons = [...athlete.seasons].sort((a, b) => parseInt(a.year) - parseInt(b.year));
        
        // Calculate win rate improvement
        const winRates = seasons.map(s => {
            const total = s.wins + s.losses;
            return total > 0 ? (s.wins / total) * 100 : 0;
        });
        
        const winRateImprovement = winRates.length > 1 ? 
            ((winRates[winRates.length - 1] - winRates[0]) / (seasons.length - 1)) : 0;

        // Calculate placement improvement (lower numbers are better)
        const placements = seasons.map(s => {
            if (!s.statePlacement || s.statePlacement === 'N/A') return null;
            const match = s.statePlacement.match(/\d+/);
            return match ? parseInt(match[0]) : null;
        }).filter(p => p !== null);

        const placementImprovement = placements.length > 1 ? 
            ((placements[0] - placements[placements.length - 1]) / (placements.length - 1)) : 0;

        // Calculate points improvement
        const points = seasons.map(s => parseFloat(s.pointsScored) || 0);
        const pointsImprovement = points.length > 1 ? 
            ((points[points.length - 1] - points[0]) / (seasons.length - 1)) : 0;

        // Determine overall trend
        let improvementTrend = 'stable';
        const improvementScore = (winRateImprovement > 2 ? 1 : 0) + 
                               (placementImprovement > 1 ? 1 : 0) + 
                               (pointsImprovement > 5 ? 1 : 0);
        
        if (improvementScore >= 2) improvementTrend = 'improving';
        else if (improvementScore <= -2) improvementTrend = 'declining';

        return {
            winRateImprovement: winRateImprovement.toFixed(1),
            placementImprovement: placementImprovement.toFixed(1),
            pointsImprovement: pointsImprovement.toFixed(1),
            seasonsAnalyzed: seasons.length,
            improvementTrend
        };
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // State management
    showLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'block';
        this.hideOtherStates(['loadingState']);
    }

    showError() {
        const errorState = document.getElementById('errorState');
        if (errorState) errorState.style.display = 'block';
        this.hideOtherStates(['errorState']);
    }

    showEmpty() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'block';
        this.hideOtherStates(['emptyState']);
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }

    hideStates() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
        
        const errorState = document.getElementById('errorState');
        if (errorState) errorState.style.display = 'none';
        
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
        
        // Show the appropriate view
        const cardView = document.getElementById('cardView');
        if (cardView) cardView.style.display = this.currentView === 'cards' ? 'grid' : 'none';
        
        const tableView = document.getElementById('tableView');
        if (tableView) tableView.style.display = this.currentView === 'table' ? 'block' : 'none';
    }

    hideOtherStates(except) {
        const states = ['loadingState', 'errorState', 'emptyState'];
        states.forEach(state => {
            if (!except.includes(state)) {
                const element = document.getElementById(state);
                if (element) {
                    element.style.display = 'none';
                }
            }
        });
        
        const cardView = document.getElementById('cardView');
        if (cardView) cardView.style.display = 'none';
        
        const tableView = document.getElementById('tableView');
        if (tableView) tableView.style.display = 'none';
        
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'none';
    }

    // Favorites functionality
    async toggleFavorite(athleteId) {
        try {
            const response = await fetch(`/api/athletes/${athleteId}/favorite`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to toggle favorite');
            }

            const result = await response.json();
            
            // Update the athlete in our local data
            const athlete = this.athletes.find(a => a.id === athleteId);
            if (athlete) {
                athlete.isFavorite = result.data.isFavorite;
            }
            
            // Re-render to update favorite buttons
            this.renderAthletes();
            
            // If currently filtering by favorites, update the filtered list
            if (this.filters.favorites) {
                this.applyFilters();
            }
            
            console.log(`✅ Toggled favorite for ${result.data.firstName} ${result.data.lastName}: ${result.data.isFavorite}`);
        } catch (error) {
            console.error('❌ Error toggling favorite:', error);
            // You could add a toast notification here
        }
    }
    
    // Tournament scraper toggle
    toggleScraperSection() {
        const section = document.getElementById('scraperSection');
        const button = document.getElementById('toggleScraperBtn');
        const isVisible = section.style.display !== 'none';
        
        if (isVisible) {
            section.style.display = 'none';
            button.innerHTML = '<i class="fas fa-plus"></i> Add Tournament Data';
            button.classList.remove('active');
        } else {
            section.style.display = 'block';
            button.innerHTML = '<i class="fas fa-times"></i> Hide Tournament Data';
            button.classList.add('active');
        }
    }

    // Tournament scraping functionality
    async scrapeTournament() {
        const tournamentId = document.getElementById('tournamentId').value.trim();
        const year = document.getElementById('tournamentYear').value.trim() || new Date().getFullYear().toString();
        const state = document.getElementById('tournamentState').value.trim().toUpperCase();

        // Validation
        if (!tournamentId) {
            alert('Please enter a Tournament ID');
            document.getElementById('tournamentId').focus();
            return;
        }

        if (state && state.length !== 2) {
            alert('State code must be exactly 2 letters (e.g., UT, CA, TX)');
            document.getElementById('tournamentState').focus();
            return;
        }

        // Disable form and show progress
        this.setScrapeFormEnabled(false);
        this.showScrapingProgress();

        try {
            this.updateProgress(10, 'Validating tournament data...');
            
            // Prepare request data
            const requestData = { tournamentId, year };
            if (state) requestData.state = state;

            this.updateProgress(25, 'Connecting to Track Wrestling...');

            // Make the scraping request
            const response = await fetch('/api/tournament/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            this.updateProgress(50, 'Scraping tournament participants...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            this.updateProgress(75, 'Processing and saving data...');

            const result = await response.json();
            
            this.updateProgress(100, 'Scraping complete!');
            
            // Show results after a brief delay
            setTimeout(() => {
                this.showScrapingResults(result, true);
            }, 500);

        } catch (error) {
            console.error('Scraping error:', error);
            this.showScrapingResults({
                error: error.message,
                tournamentId,
                year,
                state
            }, false);
        }
    }

    setScrapeFormEnabled(enabled) {
        document.getElementById('tournamentId').disabled = !enabled;
        document.getElementById('tournamentYear').disabled = !enabled;
        document.getElementById('tournamentState').disabled = !enabled;
        document.getElementById('scrapeTournamentBtn').disabled = !enabled;
        
        if (enabled) {
            document.getElementById('scrapeTournamentBtn').innerHTML = '<i class="fas fa-download"></i> Scrape Tournament';
        } else {
            document.getElementById('scrapeTournamentBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scraping...';
        }
    }

    showScrapingProgress() {
        document.getElementById('scrapingProgress').style.display = 'block';
        document.getElementById('scrapingResults').style.display = 'none';
        this.updateProgress(0, 'Initializing scraper...');
    }

    updateProgress(percentage, message) {
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = message;
        
        // Add some detail messages based on progress
        let details = '';
        if (percentage >= 25 && percentage < 50) {
            details = 'Authenticating with Track Wrestling servers...';
        } else if (percentage >= 50 && percentage < 75) {
            details = 'Parsing tournament data and participant information...';
        } else if (percentage >= 75 && percentage < 100) {
            details = 'Saving athletes and seasons to database...';
        } else if (percentage >= 100) {
            details = 'All data successfully processed!';
        }
        
        document.getElementById('progressDetails').textContent = details;
    }

    showScrapingResults(result, success) {
        document.getElementById('scrapingProgress').style.display = 'none';
        document.getElementById('scrapingResults').style.display = 'block';
        
        const resultsDiv = document.getElementById('scrapingResults');
        const iconElement = document.getElementById('resultsIcon');
        const titleElement = document.getElementById('resultsTitle');
        const contentElement = document.getElementById('resultsContent');

        if (success) {
            resultsDiv.className = 'scraping-results success';
            iconElement.className = 'fas fa-check-circle';
            iconElement.style.color = '#38a169';
            titleElement.textContent = 'Tournament Scraped Successfully!';
            
            const stats = result.stats || {};
            const scraped = result.scraped || {};
            
            contentElement.innerHTML = `
                <p><strong>Tournament:</strong> ${scraped.tournamentId} (${scraped.year}${scraped.state ? `, ${scraped.state}` : ''})</p>
                <div class="results-stats">
                    <div class="results-stat">
                        <div class="results-stat-number">${scraped.count || 0}</div>
                        <div class="results-stat-label">Participants Scraped</div>
                    </div>
                    <div class="results-stat">
                        <div class="results-stat-number">${stats.createdAthletes || 0}</div>
                        <div class="results-stat-label">New Athletes</div>
                    </div>
                    <div class="results-stat">
                        <div class="results-stat-number">${stats.createdSeasons || 0}</div>
                        <div class="results-stat-label">New Seasons</div>
                    </div>
                    <div class="results-stat">
                        <div class="results-stat-number">${stats.updatedSeasons || 0}</div>
                        <div class="results-stat-label">Updated Seasons</div>
                    </div>
                </div>
                <p><em>The data has been successfully added to your database and is ready to view!</em></p>
            `;
        } else {
            resultsDiv.className = 'scraping-results error';
            iconElement.className = 'fas fa-exclamation-circle';
            iconElement.style.color = '#e53e3e';
            titleElement.textContent = 'Scraping Failed';
            
            contentElement.innerHTML = `
                <p><strong>Error:</strong> ${result.error}</p>
                <p><strong>Tournament ID:</strong> ${result.tournamentId}</p>
                <p><strong>Year:</strong> ${result.year}</p>
                ${result.state ? `<p><strong>State:</strong> ${result.state}</p>` : ''}
                <p><em>Please check the tournament ID and try again. Make sure the tournament exists on Track Wrestling.</em></p>
            `;
            
            // Hide the "View New Data" button on error
            document.getElementById('viewNewDataBtn').style.display = 'none';
        }
        
        this.setScrapeFormEnabled(true);
    }

    async viewNewData() {
        // Refresh the athlete data to include newly scraped athletes
        this.showLoading();
        await this.loadAthletes();
        this.populateFilters();
        this.renderAthletes();
        this.updateStats();
        
        // Clear any existing filters to show all data
        await this.clearFilters();
        
        // Scroll to the results section
        document.querySelector('.results-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    resetScraper() {
        // Clear form
        document.getElementById('tournamentId').value = '';
        document.getElementById('tournamentYear').value = '';
        document.getElementById('tournamentState').value = '';
        
        // Hide progress and results
        document.getElementById('scrapingProgress').style.display = 'none';
        document.getElementById('scrapingResults').style.display = 'none';
        
        // Re-enable form
        this.setScrapeFormEnabled(true);
        
        // Show the "View New Data" button again
        document.getElementById('viewNewDataBtn').style.display = 'inline-flex';
        
        // Focus on tournament ID input
        document.getElementById('tournamentId').focus();
    }

    // Audit Trail Methods
    async showAuditTrail(athlete) {
        try {
            console.log(`📊 Showing audit trail for ${athlete.firstName} ${athlete.lastName}`);
            
            // Show the audit trail section
            document.getElementById('auditTrailSection').style.display = 'block';
            
            // Set the athlete in the selector
            document.getElementById('athleteSelect').value = athlete.id;
            
            // Load the athlete's ranking matches
            await this.loadAthleteRankingMatches(athlete.id);
            
            // Scroll to the audit trail section
            document.getElementById('auditTrailSection').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
        } catch (error) {
            console.error('❌ Error showing audit trail:', error);
            this.showError('Failed to load audit trail. Please try again.');
        }
    }

    async loadAthleteRankingMatches(athleteId, seasonId = null) {
        try {
            console.log(`📊 Loading ranking matches for athlete ${athleteId}`);
            
            const url = `/api/athletes/${athleteId}/ranking-matches${seasonId ? `?seasonId=${seasonId}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.displayAthleteInfo(result.data[0]?.season?.athlete || {});
                this.displayRankingMatches(result.data);
                this.createCharts(result.data);
            } else {
                throw new Error(result.error || 'Failed to load ranking matches');
            }
            
        } catch (error) {
            console.error('❌ Error loading ranking matches:', error);
            this.showError('Failed to load ranking matches. Please try again.');
        }
    }

    displayAthleteInfo(athlete) {
        const athleteInfo = document.getElementById('athleteInfo');
        const athleteName = document.getElementById('athleteName');
        
        if (athlete && athlete.firstName && athlete.lastName) {
            athleteName.textContent = `${athlete.firstName} ${athlete.lastName}`;
            athleteInfo.style.display = 'block';
        } else {
            athleteInfo.style.display = 'none';
        }
    }

    displayRankingMatches(matches) {
        const timelineContainer = document.getElementById('timelineContainer');
        const totalMatches = document.getElementById('totalMatches');
        
        totalMatches.textContent = matches.length;
        
        if (matches.length === 0) {
            timelineContainer.innerHTML = '<p class="text-muted">No ranking matches found for this athlete.</p>';
            return;
        }
        
        timelineContainer.innerHTML = '';
        
        matches.forEach(match => {
            const timelineItem = this.createTimelineItem(match);
            timelineContainer.appendChild(timelineItem);
        });
    }

    createTimelineItem(match) {
        const item = document.createElement('div');
        item.className = `timeline-item ${match.matchResult}`;
        
        const matchDate = new Date(match.matchDate).toLocaleDateString();
        const resultClass = match.matchResult === 'win' ? 'win' : 'loss';
        const resultText = match.matchResult === 'win' ? 'W' : 'L';
        
        const eloChange = match.elo.change;
        const glickoChange = match.glicko.rating.change;
        
        const eloChangeClass = eloChange > 0 ? 'positive' : eloChange < 0 ? 'negative' : 'neutral';
        const glickoChangeClass = glickoChange > 0 ? 'positive' : glickoChange < 0 ? 'negative' : 'neutral';
        
        item.innerHTML = `
            <div class="match-date">${matchDate}</div>
            <div class="match-opponent">
                <div class="opponent-name">${match.opponent.name}</div>
                <div class="opponent-details">
                    ${match.opponent.state} • ${match.resultType} • ${match.weight}lbs
                </div>
            </div>
            <div class="match-result ${resultClass}">${resultText}</div>
            <div class="rating-changes">
                <div class="rating-change ${eloChangeClass}">
                    <span class="rating-label">ELO:</span>
                    <span class="rating-value">${eloChange > 0 ? '+' : ''}${eloChange}</span>
                </div>
                <div class="rating-change ${glickoChangeClass}">
                    <span class="rating-label">Glicko:</span>
                    <span class="rating-value">${glickoChange > 0 ? '+' : ''}${glickoChange.toFixed(1)}</span>
                </div>
            </div>
        `;
        
        return item;
    }

    createCharts(matches) {
        if (matches.length === 0) return;
        
        // Sort matches by date
        const sortedMatches = [...matches].sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
        
        // Prepare data for charts
        const labels = sortedMatches.map(match => new Date(match.matchDate).toLocaleDateString());
        const eloData = sortedMatches.map(match => match.elo.after);
        const glickoData = sortedMatches.map(match => match.glicko.rating.after);
        
        // Create ELO chart
        this.createEloChart(labels, eloData);
        
        // Create Glicko chart
        this.createGlickoChart(labels, glickoData);
    }

    createEloChart(labels, data) {
        const ctx = document.getElementById('eloChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.eloChart) {
            this.eloChart.destroy();
        }
        
        this.eloChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ELO Rating',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'ELO Rating'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Match Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createGlickoChart(labels, data) {
        const ctx = document.getElementById('glickoChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.glickoChart) {
            this.glickoChart.destroy();
        }
        
        this.glickoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Glicko Rating',
                    data: data,
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Glicko Rating'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Match Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    closeAuditTrail() {
        document.getElementById('auditTrailSection').style.display = 'none';
        
        // Destroy charts to free memory
        if (this.eloChart) {
            this.eloChart.destroy();
            this.eloChart = null;
        }
        if (this.glickoChart) {
            this.glickoChart.destroy();
            this.glickoChart = null;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AthleteApp();
});
