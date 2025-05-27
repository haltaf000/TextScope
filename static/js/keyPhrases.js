// Key Phrases Module
// Handles key phrase filtering, sorting, exporting, and advanced metrics

class KeyPhrasesManager {
    constructor() {
        this.currentSort = 'relevance';
        this.currentFilter = 'all';
    }

    // Group phrases by category
    groupPhrasesByCategory(phrases) {
        const grouped = {};
        phrases.forEach(phrase => {
            const category = phrase.category || 'general';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(phrase);
        });
        return grouped;
    }

    // Filter key phrases by category
    filterKeyPhrases(category) {
        const phrases = document.querySelectorAll('.phrase-item');
        const buttons = document.querySelectorAll('.phrase-filter-btn');
        
        // Update button states
        buttons.forEach(btn => {
            btn.classList.remove('active', 'bg-primary', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        event.target.classList.add('active', 'bg-primary', 'text-white');
        event.target.classList.remove('bg-gray-200', 'text-gray-700');
        
        // Filter phrases
        phrases.forEach(phrase => {
            if (category === 'all' || phrase.dataset.category === category) {
                phrase.style.display = 'block';
            } else {
                phrase.style.display = 'none';
            }
        });

        this.currentFilter = category;
    }

    // Sort key phrases
    sortKeyPhrases(sortBy) {
        const container = document.getElementById('keyPhrasesList');
        const currentAnalysisData = window.uiManager.getCurrentAnalysisData();
        
        if (!container || !currentAnalysisData?.key_phrases) return;
        
        const phrases = [...currentAnalysisData.key_phrases];
        
        phrases.sort((a, b) => {
            switch (sortBy) {
                case 'frequency':
                    return b.frequency - a.frequency;
                case 'importance':
                    return b.importance - a.importance;
                case 'alphabetical':
                    return a.phrase.localeCompare(b.phrase);
                case 'relevance':
                default:
                    return b.relevance_score - a.relevance_score;
            }
        });
        
        this.currentSort = sortBy;
        this.renderPhrasesList(phrases, container);
    }

    // Render phrases list
    renderPhrasesList(phrases, container) {
        const maxFreq = Math.max(...phrases.map(p => p.frequency));
        
        container.innerHTML = phrases.map((phrase, index) => {
            const importancePercent = phrase.importance.toFixed(1);
            const relevanceScore = phrase.relevance_score.toFixed(3);
            const barWidth = Math.min(100, (phrase.frequency / maxFreq) * 100);
            const phraseTypeIcon = window.Utils.getPhraseTypeIcon(phrase.phrase_type);
            const categoryColor = this.getCategoryColorClasses(phrase.category);
            
            return `
                <div class="phrase-item p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300" 
                     data-category="${phrase.category}" data-phrase-type="${phrase.phrase_type}">
                    
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg">${phraseTypeIcon}</span>
                                <span class="font-semibold text-primary text-lg">${phrase.phrase}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${index < 3 ? `
                                    <span class="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full">
                                        🏆 Top ${index + 1}
                                    </span>
                                ` : ''}
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${categoryColor}">
                                    ${phrase.category}
                                </span>
                                <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                    ${phrase.phrase_type.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-medium text-primary">Rank #${phrase.rank || index + 1}</div>
                            <div class="text-xs text-secondary">${phrase.percentile || 100}th percentile</div>
                        </div>
                    </div>

                    <!-- Frequency Bar -->
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-secondary">Frequency</span>
                            <span class="font-medium text-primary">${phrase.frequency} occurrence${phrase.frequency !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" 
                                 style="width: ${barWidth}%">
                            </div>
                        </div>
                    </div>

                    <!-- Metrics Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div class="p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div class="text-xs text-blue-600 font-medium">Relevance</div>
                            <div class="text-sm font-bold text-blue-700">${relevanceScore}</div>
                            <div class="text-xs text-blue-500">${this.getScoreLevel(phrase.relevance_score, 'relevance')}</div>
                        </div>
                        <div class="p-2 bg-green-50 rounded-lg border border-green-100">
                            <div class="text-xs text-green-600 font-medium">Importance</div>
                            <div class="text-sm font-bold text-green-700">${importancePercent}%</div>
                            <div class="text-xs text-green-500">${window.Utils.getImportanceLevel(phrase.importance).level}</div>
                        </div>
                        <div class="p-2 bg-purple-50 rounded-lg border border-purple-100">
                            <div class="text-xs text-purple-600 font-medium">TF-IDF</div>
                            <div class="text-sm font-bold text-purple-700">${phrase.tfidf_score?.toFixed(3) || 'N/A'}</div>
                            <div class="text-xs text-purple-500">Statistical</div>
                        </div>
                        <div class="p-2 bg-orange-50 rounded-lg border border-orange-100">
                            <div class="text-xs text-orange-600 font-medium">Position</div>
                            <div class="text-sm font-bold text-orange-700">${(phrase.position_score * 100).toFixed(0)}%</div>
                            <div class="text-xs text-orange-500">Early text</div>
                        </div>
                    </div>

                    <!-- Advanced Metrics (Collapsible) -->
                    <div class="border-t border-gray-100 pt-3">
                        <button onclick="window.keyPhrasesManager.toggleAdvancedMetrics(${index})" class="flex items-center justify-between w-full text-left">
                            <span class="text-sm font-medium text-secondary">Advanced Metrics</span>
                            <i class="fas fa-chevron-down text-xs text-secondary transition-transform" id="chevron-${index}"></i>
                        </button>
                        <div id="advanced-metrics-${index}" class="hidden mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">Length Score</div>
                                <div class="text-sm font-medium">${phrase.length_score?.toFixed(2) || 'N/A'}</div>
                            </div>
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">POS Diversity</div>
                                <div class="text-sm font-medium">${phrase.pos_diversity?.toFixed(2) || 'N/A'}</div>
                            </div>
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">Coherence</div>
                                <div class="text-sm font-medium">${phrase.semantic_coherence?.toFixed(2) || 'N/A'}</div>
                            </div>
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">Capitalization</div>
                                <div class="text-sm font-medium">${phrase.capitalization_score?.toFixed(2) || 'N/A'}</div>
                            </div>
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">Word Count</div>
                                <div class="text-sm font-medium">${phrase.word_count || phrase.phrase.split(' ').length}</div>
                            </div>
                            <div class="p-2 bg-gray-50 rounded text-center">
                                <div class="text-xs text-gray-600">Char Count</div>
                                <div class="text-sm font-medium">${phrase.char_count || phrase.phrase.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get category color classes
    getCategoryColorClasses(category) {
        const colors = {
            'person': 'bg-blue-100 text-blue-800',
            'organization': 'bg-green-100 text-green-800',
            'location': 'bg-red-100 text-red-800',
            'technology': 'bg-purple-100 text-purple-800',
            'concept': 'bg-yellow-100 text-yellow-800',
            'action': 'bg-orange-100 text-orange-800',
            'quality': 'bg-pink-100 text-pink-800',
            'product': 'bg-indigo-100 text-indigo-800',
            'general': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['general'];
    }

    // Get score level for relevance
    getScoreLevel(score, type) {
        if (type === 'relevance') {
            if (score >= 0.1) return 'Excellent';
            if (score >= 0.05) return 'Good';
            if (score >= 0.02) return 'Fair';
            return 'Low';
        }
        return 'N/A';
    }

    // Toggle advanced metrics
    toggleAdvancedMetrics(index) {
        const metricsDiv = document.getElementById(`advanced-metrics-${index}`);
        const chevron = document.getElementById(`chevron-${index}`);
        
        if (metricsDiv && chevron) {
            metricsDiv.classList.toggle('hidden');
            chevron.classList.toggle('fa-chevron-down');
            chevron.classList.toggle('fa-chevron-up');
        }
    }

    // Export key phrases
    exportKeyPhrases(format) {
        const currentAnalysisData = window.uiManager.getCurrentAnalysisData();
        
        if (!currentAnalysisData?.key_phrases) {
            alert('No key phrases data available to export.');
            return;
        }
        
        const phrases = currentAnalysisData.key_phrases;
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'csv') {
            const headers = ['Rank', 'Phrase', 'Category', 'Type', 'Relevance Score', 'Frequency', 'Importance', 'TF-IDF', 'Position Score'];
            const csvRows = [headers.join(',')];
            
            phrases.forEach((phrase, index) => {
                const row = [
                    phrase.rank || index + 1,
                    `"${phrase.phrase}"`,
                    phrase.category,
                    phrase.phrase_type,
                    phrase.relevance_score,
                    phrase.frequency,
                    phrase.importance,
                    phrase.tfidf_score || 0,
                    phrase.position_score || 0
                ];
                csvRows.push(row.join(','));
            });
            
            content = csvRows.join('\n');
            filename = 'key_phrases.csv';
            mimeType = 'text/csv';
        } else if (format === 'json') {
            content = JSON.stringify(phrases, null, 2);
            filename = 'key_phrases.json';
            mimeType = 'application/json';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Copy key phrases to clipboard
    copyKeyPhrases() {
        const currentAnalysisData = window.uiManager.getCurrentAnalysisData();
        
        if (!currentAnalysisData?.key_phrases) {
            alert('No key phrases data available to copy.');
            return;
        }
        
        const phrases = currentAnalysisData.key_phrases;
        const text = phrases.map((phrase, index) => 
            `${index + 1}. ${phrase.phrase} (${phrase.category}, ${phrase.relevance_score.toFixed(3)} relevance)`
        ).join('\n');
        
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('bg-green-600');
            button.classList.remove('bg-purple-600');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-600');
                button.classList.add('bg-purple-600');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
    }

    // Generate summary statistics for key phrases
    generateSummaryStats(phrases) {
        if (!phrases || phrases.length === 0) return null;

        const categories = [...new Set(phrases.map(p => p.category))];
        const avgRelevance = phrases.reduce((sum, p) => sum + p.relevance_score, 0) / phrases.length;
        const totalFrequency = phrases.reduce((sum, p) => sum + p.frequency, 0);

        return {
            totalPhrases: phrases.length,
            categories: categories.length,
            avgRelevance: avgRelevance.toFixed(3),
            totalFrequency,
            topCategory: categories[0] || 'general'
        };
    }
}

// Export for global use
window.keyPhrasesManager = new KeyPhrasesManager(); 