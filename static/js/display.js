// Enhanced Display Module
// Handles rendering analysis results with improved visualizations and interactive dashboard

class DisplayManager {
    constructor() {
        this.currentAnalysisId = null;
        this.charts = {}; // Store chart instances
    }

    // Main function to display analysis results with enhanced dashboard
    displayAnalysisResults(result) {
        const analysisResults = document.getElementById('analysisResults');
        if (!analysisResults) {
            console.error('Analysis results container not found');
            return;
        }
        
        analysisResults.classList.remove('hidden');
        analysisResults.dataset.currentId = result.id;
        this.currentAnalysisId = result.id;

        // Create enhanced dashboard layout
        this.createDashboardLayout(result);
        
        // Render each section with enhanced visuals
        this.renderOverviewCards(result);
        this.renderSentimentAnalysis(result);
        this.renderReadabilityMetrics(result);
        this.renderKeyPhrases(result);
        this.renderNamedEntities(result);
        this.renderLanguageInfo(result);
        this.renderContentCategory(result);
        this.renderSummary(result);
        this.renderInsightsPanel(result);
    }

    // Create enhanced dashboard layout
    createDashboardLayout(result) {
        const analysisResults = document.getElementById('analysisResults');
        
        analysisResults.innerHTML = `
            <div class="enhanced-dashboard">
                <!-- Dashboard Header -->
                <div class="dashboard-header mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-3xl font-bold text-primary flex items-center">
                                <i class="fas fa-chart-line mr-3 text-blue-600"></i>
                                Analysis Dashboard
                            </h2>
                            <p class="text-secondary mt-1">${result.title || 'Text Analysis Results'}</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button onclick="window.displayManager.exportDashboard()" class="btn-secondary px-4 py-2 rounded-lg">
                                <i class="fas fa-download mr-2"></i>Export
                            </button>
                            <button onclick="window.displayManager.toggleFullscreen()" class="btn-secondary px-4 py-2 rounded-lg">
                                <i class="fas fa-expand mr-2"></i>Fullscreen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Quick Stats Overview -->
                    <div id="overviewCards" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <!-- Will be populated by renderOverviewCards -->
                    </div>
                </div>

                <!-- Main Dashboard Grid -->
                <div class="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column - Primary Metrics -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Sentiment Analysis Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-semibold text-primary flex items-center">
                                    <i class="fas fa-heart mr-2 text-red-500"></i>
                                    Sentiment Analysis
                                </h3>
                                <div class="sentiment-score-badge px-3 py-1 rounded-full text-sm font-medium">
                                    <!-- Will be populated -->
                                </div>
                            </div>
                            <div id="sentimentResult" class="space-y-4">
                                <!-- Enhanced sentiment visualization -->
                            </div>
                        </div>

                        <!-- Readability Metrics Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-semibold text-primary flex items-center">
                                    <i class="fas fa-book-reader mr-2 text-green-500"></i>
                                    Readability Metrics
                                </h3>
                                <div class="readability-badge px-3 py-1 rounded-full text-sm font-medium">
                                    <!-- Will be populated -->
                                </div>
                            </div>
                            <div id="readabilityResult" class="space-y-4">
                                <!-- Enhanced readability visualization -->
                            </div>
                        </div>

                        <!-- Key Phrases Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-semibold text-primary flex items-center">
                                    <i class="fas fa-key mr-2 text-purple-500"></i>
                                    Key Phrases Analysis
                                </h3>
                                <div class="phrases-count-badge px-3 py-1 rounded-full text-sm font-medium">
                                    <!-- Will be populated -->
                                </div>
                            </div>
                            <div id="keyPhrasesResult" class="space-y-4">
                                <!-- Enhanced key phrases visualization -->
                            </div>
                        </div>
                    </div>

                    <!-- Right Column - Secondary Metrics -->
                    <div class="space-y-6">
                        <!-- Content Category Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                            <h3 class="text-lg font-semibold text-primary mb-4 flex items-center">
                                <i class="fas fa-tags mr-2 text-orange-500"></i>
                                Content Category
                            </h3>
                            <div id="categoryResult" class="space-y-3">
                                <!-- Enhanced category visualization -->
                            </div>
                        </div>

                        <!-- Named Entities Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                            <h3 class="text-lg font-semibold text-primary mb-4 flex items-center">
                                <i class="fas fa-sitemap mr-2 text-teal-500"></i>
                                Named Entities
                            </h3>
                            <div id="entitiesResult" class="space-y-3">
                                <!-- Enhanced entities visualization -->
                            </div>
                        </div>

                        <!-- Language Info Card -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200">
                            <h3 class="text-lg font-semibold text-primary mb-4 flex items-center">
                                <i class="fas fa-globe mr-2 text-pink-500"></i>
                                Language Information
                            </h3>
                            <div id="languageResult" class="space-y-2">
                                <!-- Enhanced language info -->
                            </div>
                        </div>

                        <!-- AI Insights Panel -->
                        <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
                            <h3 class="text-lg font-semibold text-primary mb-4 flex items-center">
                                <i class="fas fa-brain mr-2 text-gray-500"></i>
                                AI Insights
                            </h3>
                            <div id="insightsPanel" class="space-y-3">
                                <!-- AI-generated insights -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Section -->
                <div class="mt-8">
                    <div class="dashboard-card card rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                        <h3 class="text-xl font-semibold text-primary mb-4 flex items-center">
                            <i class="fas fa-file-alt mr-2 text-indigo-500"></i>
                            Executive Summary
                        </h3>
                        <div id="summaryResult" class="space-y-4">
                            <!-- Enhanced summary with insights -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render overview cards with key metrics
    renderOverviewCards(result) {
        const overviewCards = document.getElementById('overviewCards');
        if (!overviewCards) return;

        const cards = [
            {
                title: 'Sentiment Score',
                value: this.getSentimentScore(result.polarity),
                icon: 'fas fa-smile',
                color: this.getSentimentColor(result.polarity),
                subtitle: result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)
            },
            {
                title: 'Readability',
                value: result.flesch_score.toFixed(0),
                icon: 'fas fa-book',
                color: this.getReadabilityColor(result.flesch_score),
                subtitle: result.difficulty_level
            },
            {
                title: 'Word Count',
                value: result.word_count.toLocaleString(),
                icon: 'fas fa-font',
                color: 'text-blue-600',
                subtitle: `${result.sentence_count} sentences`
            },
            {
                title: 'Key Phrases',
                value: result.key_phrases ? result.key_phrases.length : 0,
                icon: 'fas fa-key',
                color: 'text-purple-600',
                subtitle: 'Extracted concepts'
            }
        ];

        overviewCards.innerHTML = cards.map(card => `
            <div class="overview-card bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <div class="text-sm font-medium text-secondary">${card.title}</div>
                    <i class="${card.icon} ${card.color}"></i>
                </div>
                <div class="text-2xl font-bold ${card.color} mb-1">${card.value}</div>
                <div class="text-xs text-secondary">${card.subtitle}</div>
            </div>
        `).join('');
    }

    // Enhanced sentiment analysis with circular progress and detailed metrics
    renderSentimentAnalysis(result) {
        const sentimentResult = document.getElementById('sentimentResult');
        if (!sentimentResult) return;

        const polarity = result.polarity;
        const normalizedPolarity = ((polarity + 1) / 2) * 100;
        const sentimentColor = this.getSentimentColor(polarity);
        const sentimentExplanation = this.getSentimentExplanation(polarity);

        // Update sentiment badge
        const badge = document.querySelector('.sentiment-score-badge');
        if (badge) {
            badge.textContent = result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1);
            badge.className = `sentiment-score-badge px-3 py-1 rounded-full text-sm font-medium ${this.getSentimentBadgeClass(polarity)}`;
        }

        sentimentResult.innerHTML = `
            <div class="space-y-6">
                <!-- Circular Sentiment Meter -->
                <div class="flex items-center justify-center mb-6">
                    <div class="relative w-32 h-32">
                        <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <!-- Background circle -->
                            <circle cx="60" cy="60" r="50" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                            <!-- Progress circle -->
                            <circle cx="60" cy="60" r="50" stroke="${sentimentColor}" stroke-width="8" fill="none"
                                    stroke-dasharray="314" stroke-dashoffset="${314 - (normalizedPolarity * 314 / 100)}"
                                    class="transition-all duration-1000 ease-out"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="text-center">
                                <div class="text-2xl font-bold" style="color: ${sentimentColor}">${polarity.toFixed(2)}</div>
                                <div class="text-xs text-secondary">${result.tone}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sentiment Explanation -->
                <div class="p-4 bg-white rounded-lg border border-gray-100">
                    <h4 class="text-sm font-medium text-primary mb-2 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                        Analysis Insight
                    </h4>
                    <p class="text-sm text-secondary">${sentimentExplanation}</p>
                </div>

                <!-- Detailed Metrics Grid -->
                <div class="grid grid-cols-3 gap-4">
                    ${this.createMetricCard('Polarity', polarity.toFixed(2), polarity * 100, sentimentColor, window.Utils.getPolarityExplanation(polarity))}
                    ${this.createMetricCard('Subjectivity', result.subjectivity.toFixed(2), result.subjectivity * 100, '#8B5CF6', window.Utils.getSubjectivityExplanation(result.subjectivity))}
                    ${this.createMetricCard('Confidence', result.sentiment_confidence.toFixed(2), result.sentiment_confidence * 100, '#3B82F6', window.Utils.getConfidenceExplanation(result.sentiment_confidence))}
                </div>

                <!-- Professional Writing Metrics -->
                <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <h4 class="text-sm font-medium text-primary mb-3 flex items-center">
                        <i class="fas fa-briefcase mr-2 text-gray-600"></i>
                        Professional Writing Analysis
                    </h4>
                    <div class="grid grid-cols-3 gap-4">
                        ${this.createProfessionalMetric('Passive Voice', result.professional_metrics.passive_voice_count, 'instances')}
                        ${this.createProfessionalMetric('Long Sentences', result.professional_metrics.long_sentences, 'instances')}
                        ${this.createProfessionalMetric('Complex Words', result.professional_metrics.complex_words, 'instances')}
                    </div>
                </div>

                <!-- Expandable Details -->
                <div class="border-t border-gray-200 pt-4">
                    <button onclick="window.uiManager.toggleSentimentDetails()" 
                            class="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <span class="text-sm font-medium text-secondary">Advanced Sentiment Metrics</span>
                        <i class="fas fa-chevron-down text-xs text-secondary"></i>
                    </button>
                    <div id="sentimentDetails" class="hidden mt-3 p-4 bg-white rounded-lg border border-gray-100">
                        <div class="text-sm text-secondary space-y-2">
                            <p><strong>Polarity Range:</strong> -1 (very negative) to +1 (very positive)</p>
                            <p><strong>Subjectivity Range:</strong> 0 (objective) to 1 (subjective)</p>
                            <p><strong>Confidence Level:</strong> Algorithm certainty in sentiment classification</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Enhanced readability metrics with visual improvements
    renderReadabilityMetrics(result) {
        const readabilityResult = document.getElementById('readabilityResult');
        if (!readabilityResult) return;

        // Update readability badge
        const badge = document.querySelector('.readability-badge');
        if (badge) {
            badge.textContent = result.difficulty_level;
            badge.className = `readability-badge px-3 py-1 rounded-full text-sm font-medium ${this.getReadabilityBadgeClass(result.flesch_score)}`;
        }

        readabilityResult.innerHTML = `
            <div class="space-y-6">
                <!-- Flesch Score Gauge -->
                <div class="text-center">
                    <div class="relative inline-block">
                        <div class="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center"
                             style="border-color: ${this.getReadabilityColor(result.flesch_score)};">
                            <div class="text-center">
                                <div class="text-xl font-bold text-primary">${result.flesch_score.toFixed(0)}</div>
                                <div class="text-xs text-secondary">Score</div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="font-medium ${window.Utils.getDifficultyColor(result.difficulty_level)}">${result.difficulty_level}</div>
                        <div class="text-sm text-secondary">Reading Level</div>
                    </div>
                </div>

                <!-- Text Statistics -->
                <div class="grid grid-cols-3 gap-4">
                    ${this.createStatCard('Words', result.word_count, 'fas fa-font', '#3B82F6')}
                    ${this.createStatCard('Sentences', result.sentence_count, 'fas fa-paragraph', '#10B981')}
                    ${this.createStatCard('Syllables', result.syllable_count, 'fas fa-music', '#8B5CF6')}
                </div>

                <!-- Professional Writing Scores -->
                <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 class="text-sm font-medium text-primary mb-3 flex items-center">
                        <i class="fas fa-chart-bar mr-2 text-green-600"></i>
                        Professional Writing Scores
                    </h4>
                    <div class="space-y-3">
                        ${Object.entries(result.professional_scores).map(([key, value]) => `
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-secondary">${window.Utils.capitalize(key)}</span>
                                <div class="flex items-center space-x-2">
                                    <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div class="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500" 
                                             style="width: ${Math.round(value)}%"></div>
                                    </div>
                                    <span class="text-sm font-medium text-primary w-8">${Math.round(value)}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Writing Improvements -->
                <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 class="text-sm font-medium text-primary mb-3 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-yellow-600"></i>
                        Improvement Suggestions
                    </h4>
                    <ul class="space-y-2">
                        ${result.writing_improvements.map(improvement => `
                            <li class="flex items-start">
                                <i class="fas fa-arrow-right text-yellow-600 mt-1 mr-2 text-xs"></i>
                                <span class="text-sm text-secondary">${improvement}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Render key phrases section
    renderKeyPhrases(result) {
        const keyPhrasesResult = document.getElementById('keyPhrasesResult');
        if (!keyPhrasesResult || !result.key_phrases) return;

        // Update phrases count badge
        const badge = document.querySelector('.phrases-count-badge');
        if (badge) {
            badge.textContent = `${result.key_phrases.length} phrases`;
            badge.className = 'phrases-count-badge px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800';
        }

        // Group phrases by category for better organization
        const phrasesByCategory = window.keyPhrasesManager.groupPhrasesByCategory(result.key_phrases);
        const summaryStats = window.keyPhrasesManager.generateSummaryStats(result.key_phrases);
        
        keyPhrasesResult.innerHTML = `
            <div class="space-y-6">
                <!-- Key Phrases Overview -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-white rounded-lg border border-gray-100">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-secondary">Total Phrases</span>
                            <i class="fas fa-hashtag text-purple-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-purple-600">${summaryStats.totalPhrases}</div>
                        <div class="text-xs text-secondary">${summaryStats.categories} categories</div>
                    </div>
                    <div class="p-4 bg-white rounded-lg border border-gray-100">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-secondary">Avg. Relevance</span>
                            <i class="fas fa-star text-yellow-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-yellow-600">${summaryStats.avgRelevance}</div>
                        <div class="text-xs text-secondary">Quality score</div>
                    </div>
                </div>

                <!-- Top Key Phrases -->
                <div class="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <h4 class="text-sm font-medium text-primary mb-3 flex items-center">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>
                        Top Key Phrases
                    </h4>
                    <div class="space-y-2">
                        ${result.key_phrases.slice(0, 5).map((phrase, index) => `
                            <div class="flex items-center justify-between p-2 bg-white rounded border border-purple-100">
                                <div class="flex items-center space-x-3">
                                    <span class="w-6 h-6 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        ${index + 1}
                                    </span>
                                    <span class="font-medium text-primary">${phrase.phrase}</span>
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        ${phrase.category}
                                    </span>
                                </div>
                                <div class="text-sm font-medium text-purple-600">
                                    ${phrase.relevance_score.toFixed(3)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- View All Button -->
                <div class="text-center">
                    <button onclick="window.uiManager.toggleKeyPhrasesDetails()" 
                            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        <i class="fas fa-eye mr-2"></i>
                        View All Key Phrases
                    </button>
                </div>

                <!-- Detailed Key Phrases (Hidden by default) -->
                <div id="keyPhrasesDetails" class="hidden">
                    <!-- Filter and Sort Controls -->
                    <div class="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <button onclick="window.keyPhrasesManager.filterKeyPhrases('all')" class="phrase-filter-btn active px-3 py-1 text-xs rounded-full bg-primary text-white">
                            All
                        </button>
                        ${Object.keys(phrasesByCategory).map(category => `
                            <button onclick="window.keyPhrasesManager.filterKeyPhrases('${category}')" class="phrase-filter-btn px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300">
                                ${window.Utils.capitalize(category)}
                            </button>
                        `).join('')}
                        <div class="ml-auto flex items-center space-x-2">
                            <label class="text-xs text-secondary">Sort by:</label>
                            <select onchange="window.keyPhrasesManager.sortKeyPhrases(this.value)" class="text-xs border border-gray-300 rounded px-2 py-1">
                                <option value="relevance">Relevance</option>
                                <option value="frequency">Frequency</option>
                                <option value="importance">Importance</option>
                                <option value="alphabetical">Alphabetical</option>
                            </select>
                        </div>
                    </div>

                    <!-- Phrases List -->
                    <div id="keyPhrasesList" class="space-y-3 max-h-96 overflow-y-auto">
                        <!-- Will be populated by KeyPhrasesManager -->
                    </div>

                    <!-- Export Options -->
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-secondary">Export Key Phrases</span>
                            <div class="flex space-x-2">
                                <button onclick="window.keyPhrasesManager.exportKeyPhrases('csv')" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                    CSV
                                </button>
                                <button onclick="window.keyPhrasesManager.exportKeyPhrases('json')" class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                                    JSON
                                </button>
                                <button onclick="window.keyPhrasesManager.copyKeyPhrases()" class="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render the detailed phrases using KeyPhrasesManager
        const container = document.getElementById('keyPhrasesList');
        if (container) {
            window.keyPhrasesManager.renderPhrasesList(result.key_phrases, container);
        }
    }

    // Render named entities section
    renderNamedEntities(result) {
        const entitiesResult = document.getElementById('entitiesResult');
        if (!entitiesResult || !result.named_entities) return;

        const entityTypes = Object.keys(result.named_entities);
        const totalEntities = Object.values(result.named_entities).reduce((sum, entities) => sum + entities.length, 0);

        entitiesResult.innerHTML = `
            <div class="space-y-4">
                <!-- Entities Overview -->
                <div class="p-3 bg-white rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-secondary">Total Entities</span>
                        <i class="fas fa-tags text-teal-500"></i>
                    </div>
                    <div class="text-xl font-bold text-teal-600">${totalEntities}</div>
                    <div class="text-xs text-secondary">${entityTypes.length} types</div>
                </div>

                <!-- Entity Types -->
                <div class="space-y-3">
                    ${Object.entries(result.named_entities).map(([type, entities]) => `
                        <div class="p-3 bg-white rounded-lg border border-gray-100">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-medium text-primary flex items-center">
                                    <i class="fas fa-tag mr-2 text-teal-500"></i>
                                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                                </div>
                                <span class="text-sm text-secondary">${entities.length} items</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${entities.map(entity => `
                                    <span class="px-2 py-1 bg-teal-50 text-teal-700 text-sm rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                                        ${entity}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render language information section
    renderLanguageInfo(result) {
        const languageResult = document.getElementById('languageResult');
        if (!languageResult) return;

        const confidencePercentage = (result.language_confidence * 100).toFixed(1);
        const confidenceColor = result.language_confidence > 0.8 ? 'text-green-600' : 
                               result.language_confidence > 0.6 ? 'text-yellow-600' : 'text-red-600';

        languageResult.innerHTML = `
            <div class="space-y-4">
                <div class="p-4 bg-white rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                                <span class="text-lg font-bold text-pink-600">${result.language_code.toUpperCase()}</span>
                            </div>
                            <div>
                                <div class="font-medium text-primary">Language Detected</div>
                                <div class="text-sm text-secondary">Primary language</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold ${confidenceColor}">${confidencePercentage}%</div>
                            <div class="text-xs text-secondary">Confidence</div>
                        </div>
                    </div>
                    
                    <!-- Confidence Bar -->
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-500 ${
                            result.language_confidence > 0.8 ? 'bg-green-500' : 
                            result.language_confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }" style="width: ${confidencePercentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render content category section
    renderContentCategory(result) {
        const categoryResult = document.getElementById('categoryResult');
        if (!categoryResult) return;

        const insights = window.Utils.getCategoryInsights(result.content_category, result.category_distribution);

        categoryResult.innerHTML = `
            <div class="space-y-4">
                <!-- Primary Category -->
                <div class="p-4 bg-white rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <div class="text-lg font-semibold text-primary">${window.Utils.capitalize(result.content_category)}</div>
                            <div class="text-sm text-secondary">Primary Category</div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-orange-600">${(result.category_confidence * 100).toFixed(0)}%</div>
                            <div class="text-xs text-secondary">Confidence</div>
                        </div>
                    </div>
                </div>

                <!-- Category Distribution -->
                <div class="space-y-2">
                    <h4 class="text-sm font-medium text-secondary">Category Distribution</h4>
                    ${Object.entries(result.category_distribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, score]) => {
                            const isPrimary = cat === result.content_category;
                            const scorePercent = Math.round(score * 100);
                            return `
                                <div class="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm font-medium ${isPrimary ? 'text-orange-600' : 'text-secondary'}">
                                            ${window.Utils.capitalize(cat)}
                                        </span>
                                        ${isPrimary ? '<i class="fas fa-crown text-yellow-500 text-xs"></i>' : ''}
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div class="h-2 rounded-full transition-all duration-500 ${isPrimary ? 'bg-orange-500' : 'bg-gray-400'}"
                                                 style="width: ${scorePercent}%">
                                            </div>
                                        </div>
                                        <span class="text-sm font-medium w-8">${scorePercent}%</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>

                <!-- Category Insights -->
                <div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 class="text-sm font-medium text-primary mb-2 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-orange-500"></i>
                        Content Insights
                    </h4>
                    <div class="text-sm text-secondary space-y-1">
                        <p><strong>Description:</strong> ${insights.description}</p>
                        <p><strong>Target Audience:</strong> ${insights.audience}</p>
                        <p><strong>Writing Tone:</strong> ${insights.tone}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Render summary section
    renderSummary(result) {
        const summaryResult = document.getElementById('summaryResult');
        if (!summaryResult) return;

        const wordCount = result.summary.split(' ').length;
        const compressionRatio = ((result.word_count - wordCount) / result.word_count * 100).toFixed(0);

        summaryResult.innerHTML = `
            <div class="space-y-6">
                <!-- Summary Stats -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="p-3 bg-white rounded-lg border border-gray-100 text-center">
                        <div class="text-lg font-bold text-indigo-600">${wordCount}</div>
                        <div class="text-xs text-secondary">Summary Words</div>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-gray-100 text-center">
                        <div class="text-lg font-bold text-green-600">${compressionRatio}%</div>
                        <div class="text-xs text-secondary">Compression</div>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-gray-100 text-center">
                        <div class="text-lg font-bold text-blue-600">${result.flesch_score.toFixed(0)}</div>
                        <div class="text-xs text-secondary">Readability</div>
                    </div>
                </div>

                <!-- Summary Text -->
                <div class="p-6 bg-white rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-medium text-primary">Executive Summary</h4>
                        <div class="flex items-center space-x-2">
                            <button onclick="window.uiManager.copySummary()" class="text-secondary hover:text-primary transition-colors">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="window.uiManager.toggleSummaryDetails()" class="text-secondary hover:text-primary transition-colors">
                                <i class="fas fa-expand-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="prose prose-sm max-w-none">
                        <p class="text-secondary leading-relaxed">${result.summary}</p>
                    </div>
                </div>

                <!-- Summary Analysis -->
                <div id="summaryDetails" class="hidden p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 class="text-sm font-medium text-primary mb-3">Summary Analysis</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-secondary">Original Length:</span>
                            <span class="text-primary">${result.word_count} words</span>
                        </div>
                        <div>
                            <span class="font-medium text-secondary">Summary Length:</span>
                            <span class="text-primary">${wordCount} words</span>
                        </div>
                        <div>
                            <span class="font-medium text-secondary">Compression Ratio:</span>
                            <span class="text-primary">${compressionRatio}% reduction</span>
                        </div>
                        <div>
                            <span class="font-medium text-secondary">Key Concepts:</span>
                            <span class="text-primary">${result.key_phrases ? result.key_phrases.length : 0} identified</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // New AI Insights Panel
    renderInsightsPanel(result) {
        const insightsPanel = document.getElementById('insightsPanel');
        if (!insightsPanel) return;

        const insights = this.generateAIInsights(result);

        insightsPanel.innerHTML = `
            <div class="space-y-4">
                ${insights.map(insight => `
                    <div class="p-3 bg-white rounded-lg border border-gray-100">
                        <div class="flex items-start space-x-3">
                            <i class="${insight.icon} ${insight.color} mt-1"></i>
                            <div>
                                <div class="text-sm font-medium text-primary">${insight.title}</div>
                                <div class="text-xs text-secondary mt-1">${insight.description}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate AI insights based on analysis results
    generateAIInsights(result) {
        const insights = [];

        // Sentiment insight
        if (result.polarity > 0.5) {
            insights.push({
                title: "Highly Positive Content",
                description: "Your text conveys strong positive sentiment. Great for marketing and engagement.",
                icon: "fas fa-smile-beam",
                color: "text-green-500"
            });
        } else if (result.polarity < -0.5) {
            insights.push({
                title: "Strong Negative Sentiment",
                description: "Consider balancing with positive elements if this wasn't intentional.",
                icon: "fas fa-frown",
                color: "text-red-500"
            });
        }

        // Readability insight
        if (result.flesch_score < 30) {
            insights.push({
                title: "Complex Writing Style",
                description: "Consider simplifying sentences for broader audience appeal.",
                icon: "fas fa-brain",
                color: "text-orange-500"
            });
        } else if (result.flesch_score > 80) {
            insights.push({
                title: "Very Accessible Writing",
                description: "Your content is easy to read and understand for most audiences.",
                icon: "fas fa-thumbs-up",
                color: "text-green-500"
            });
        }

        // Professional writing insight
        if (result.professional_metrics.passive_voice_count > 5) {
            insights.push({
                title: "High Passive Voice Usage",
                description: "Consider using more active voice for stronger, clearer writing.",
                icon: "fas fa-edit",
                color: "text-yellow-500"
            });
        }

        // Key phrases insight
        if (result.key_phrases && result.key_phrases.length > 20) {
            insights.push({
                title: "Rich Content Vocabulary",
                description: "Your text contains many key concepts, indicating comprehensive coverage.",
                icon: "fas fa-key",
                color: "text-purple-500"
            });
        }

        // Default insight if none generated
        if (insights.length === 0) {
            insights.push({
                title: "Balanced Content",
                description: "Your text shows good balance across multiple writing dimensions.",
                icon: "fas fa-balance-scale",
                color: "text-blue-500"
            });
        }

        return insights;
    }

    // Export dashboard functionality
    exportDashboard() {
        const dashboard = document.querySelector('.enhanced-dashboard');
        if (!dashboard) return;

        // Create a simplified version for export
        const exportData = {
            title: this.currentAnalysisId ? `Analysis ${this.currentAnalysisId}` : 'Text Analysis',
            timestamp: new Date().toISOString(),
            data: window.uiManager.getCurrentAnalysisData()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `textscope-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Toggle fullscreen mode
    toggleFullscreen() {
        const dashboard = document.querySelector('.enhanced-dashboard');
        if (!dashboard) return;

        if (!document.fullscreenElement) {
            dashboard.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Helper method to create metric cards
    createMetricCard(title, value, percentage, color, explanation) {
        const normalizedPercentage = Math.abs(percentage);
        return `
            <div class="p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-secondary">${title}</span>
                    <span class="text-sm font-bold" style="color: ${color}">${value}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div class="h-2 rounded-full transition-all duration-500" 
                         style="width: ${normalizedPercentage}%; background-color: ${color};">
                    </div>
                </div>
                <p class="text-xs text-secondary">${explanation}</p>
            </div>
        `;
    }

    // Helper method to create professional metric cards
    createProfessionalMetric(title, value, unit) {
        const severity = this.getProfessionalMetricSeverity(value);
        return `
            <div class="text-center p-3 bg-white rounded-lg border border-gray-100">
                <div class="text-lg font-bold ${severity.color}">${value}</div>
                <div class="text-xs text-secondary">${unit}</div>
                <div class="text-xs font-medium ${severity.color}">${title}</div>
                <div class="text-xs text-secondary mt-1">${severity.label}</div>
            </div>
        `;
    }

    // Helper method to create stat cards
    createStatCard(title, value, icon, color) {
        return `
            <div class="text-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
                <i class="${icon} text-2xl mb-2" style="color: ${color}"></i>
                <div class="text-xl font-bold text-primary">${value.toLocaleString()}</div>
                <div class="text-sm text-secondary">${title}</div>
            </div>
        `;
    }

    // Get sentiment color
    getSentimentColor(polarity) {
        if (polarity > 0.33) return '#10B981'; // Green
        if (polarity < -0.33) return '#EF4444'; // Red
        return '#F59E0B'; // Amber
    }

    // Get sentiment score for display
    getSentimentScore(polarity) {
        const score = ((polarity + 1) / 2 * 100).toFixed(0);
        return `${score}%`;
    }

    // Get sentiment explanation
    getSentimentExplanation(polarity) {
        if (polarity > 0.5) return "The text expresses very positive sentiment with strong optimism and approval.";
        if (polarity > 0.1) return "The text shows positive sentiment, conveying satisfaction and favorable opinions.";
        if (polarity > -0.1) return "The text maintains neutral sentiment with balanced, objective tone.";
        if (polarity > -0.5) return "The text expresses negative sentiment with criticism or dissatisfaction.";
        return "The text shows very negative sentiment with strong criticism or disapproval.";
    }

    // Get sentiment badge class
    getSentimentBadgeClass(polarity) {
        if (polarity > 0.33) return 'bg-green-100 text-green-800';
        if (polarity < -0.33) return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    }

    // Get readability color
    getReadabilityColor(score) {
        if (score >= 70) return '#10B981'; // Green - Easy
        if (score >= 50) return '#F59E0B'; // Amber - Medium
        return '#EF4444'; // Red - Hard
    }

    // Get readability badge class
    getReadabilityBadgeClass(score) {
        if (score >= 70) return 'bg-green-100 text-green-800';
        if (score >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }

    // Get professional metric severity
    getProfessionalMetricSeverity(value) {
        if (value === 0) return { color: 'text-green-600', label: 'Excellent' };
        if (value <= 2) return { color: 'text-yellow-600', label: 'Good' };
        if (value <= 5) return { color: 'text-orange-600', label: 'Fair' };
        return { color: 'text-red-600', label: 'Needs Work' };
    }

    // Display analysis history with enhanced styling
    displayAnalysisHistory(analyses) {
        const historyContainer = document.getElementById('analysisHistory');
        if (!historyContainer) return;

        historyContainer.innerHTML = '';

        if (analyses.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-history text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-secondary mb-2">No Analysis History</h3>
                    <p class="text-secondary">Your analysis history will appear here once you start analyzing text.</p>
                </div>
            `;
            return;
        }

        analyses.forEach(analysis => {
            const element = document.createElement('div');
            element.className = 'analysis-history-card card rounded-lg hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer';
            element.onclick = () => window.analysisManager.loadAnalysis(analysis.id);
            
            const sentimentColor = this.getSentimentColor(analysis.polarity);
            const readabilityColor = this.getReadabilityColor(analysis.flesch_score || 50);
            
            element.innerHTML = `
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-grow">
                            <div class="flex items-center space-x-3 mb-2">
                                <h4 class="font-semibold text-primary text-lg">${analysis.title}</h4>
                                <span class="text-sm text-secondary">${window.Utils.formatDate(analysis.created_at)}</span>
                            </div>
                            <p class="text-secondary line-clamp-2 mb-3">${window.Utils.truncateText(analysis.text, 150)}</p>
                        </div>
                        <button onclick="event.stopPropagation(); window.analysisManager.deleteAnalysis(${analysis.id})" 
                                class="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>

                    <!-- Metrics Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-sm font-medium" style="color: ${sentimentColor}">
                                ${this.getSentimentScore(analysis.polarity)}
                            </div>
                            <div class="text-xs text-secondary">Sentiment</div>
                        </div>
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-sm font-medium" style="color: ${readabilityColor}">
                                ${analysis.flesch_score ? analysis.flesch_score.toFixed(0) : 'N/A'}
                            </div>
                            <div class="text-xs text-secondary">Readability</div>
                        </div>
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-sm font-medium text-blue-600">
                                ${analysis.word_count || 0}
                            </div>
                            <div class="text-xs text-secondary">Words</div>
                        </div>
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-sm font-medium text-purple-600">
                                ${analysis.key_phrases ? analysis.key_phrases.length : 0}
                            </div>
                            <div class="text-xs text-secondary">Key Phrases</div>
                        </div>
                    </div>

                    <!-- Tags -->
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            analysis.polarity > 0.33 ? 'bg-green-100 text-green-800' : 
                            analysis.polarity < -0.33 ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                        }">
                            <i class="fas fa-heart mr-1"></i>
                            ${analysis.sentiment}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <i class="fas fa-book mr-1"></i>
                            ${analysis.difficulty_level || 'Unknown'}
                        </span>
                        ${analysis.content_category ? `
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <i class="fas fa-tag mr-1"></i>
                                ${window.Utils.capitalize(analysis.content_category)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
            historyContainer.appendChild(element);
        });
    }
}

// Export for global use
window.displayManager = new DisplayManager(); 