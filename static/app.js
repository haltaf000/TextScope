let token = localStorage.getItem('token');
let currentAnalysisData = null;
let currentUser = null;

// UI state management
function updateUIState() {
    const userSection = document.getElementById('userSection');
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const landingPage = document.getElementById('landingPage');

    if (token) {
        // Logged in state
        userSection.classList.remove('hidden');
        authSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        landingPage.classList.add('hidden');
        document.getElementById('username').textContent = currentUser?.username || '';
        loadAnalysisHistory();
    } else {
        // Logged out state
        userSection.classList.add('hidden');
        authSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
        landingPage.classList.remove('hidden');
    }
}

// Authentication functions
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        
        const response = await fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        });

        if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            await fetchUserProfile();
            updateUIState();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Sign In';
    }
}

async function register(event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';
        
        const response = await fetch('/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, username, password }),
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            showLoginForm();
        } else {
            const error = await response.json();
            alert(`Registration failed: ${error.detail}`);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Account';
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateUIState();
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/users/me/', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            currentUser = await response.json();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        logout();
    }
}

// Text analysis functions
async function analyzeText(event) {
    event.preventDefault();
    const text = document.getElementById('textInput').value;
    const title = document.getElementById('titleInput').value || "Untitled Analysis";
    const submitButton = event.target.querySelector('button[type="submit"]');
    const form = event.target;
    
    if (!text.trim()) {
        alert('Please enter some text to analyze.');
        return;
    }

    try {
        // Disable the form and show loading state
        submitButton.disabled = true;
        form.classList.add('opacity-50');
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
        
        console.log('Sending analysis request...');
        const response = await fetch('/analyze/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, title }),
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (response.ok) {
            try {
                const result = JSON.parse(responseText);
                console.log('Full analysis result:', JSON.stringify(result, null, 2));
                
                // Update the UI with the new analysis
                currentAnalysisData = result;
                displayAnalysisResults(result);
                
                // Clear the form
                form.reset();
                
                // Refresh the history
                await loadAnalysisHistory();
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'text-green-600 text-sm mt-2';
                successMessage.textContent = 'Analysis completed successfully!';
                form.appendChild(successMessage);
                setTimeout(() => successMessage.remove(), 3000);
                
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                console.error('Raw response:', responseText);
                throw new Error('Failed to parse analysis results');
            }
        } else {
            let errorMessage = 'Analysis failed. Please try again.';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            console.error('Analysis failed:', errorMessage);
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        console.error('Error stack:', error.stack);
        alert(`An error occurred during analysis: ${error.message}`);
    } finally {
        // Reset the form state
        submitButton.disabled = false;
        form.classList.remove('opacity-50');
        submitButton.innerHTML = '<i class="fas fa-chart-line mr-2"></i>Analyze Text';
    }
}

async function loadAnalysisHistory() {
    try {
        const response = await fetch('/analyses/', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const analyses = await response.json();
            displayAnalysisHistory(analyses);
        }
    } catch (error) {
        console.error('History fetch error:', error);
    }
}

async function deleteAnalysis(id) {
    if (!confirm('Are you sure you want to delete this analysis?')) {
        return;
    }

    try {
        const response = await fetch(`/analyses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            loadAnalysisHistory();
            // If the deleted analysis is currently displayed, hide it
            const analysisResults = document.getElementById('analysisResults');
            if (analysisResults.dataset.currentId === id.toString()) {
                analysisResults.classList.add('hidden');
            }
        } else {
            alert('Failed to delete analysis. Please try again.');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('An error occurred while deleting the analysis.');
    }
}

// Display functions
function displayAnalysisResults(result) {
    const analysisResults = document.getElementById('analysisResults');
    if (!analysisResults) {
        console.error('Analysis results container not found');
        return;
    }
    analysisResults.classList.remove('hidden');
    analysisResults.dataset.currentId = result.id;

    // Sentiment Analysis with enhanced explanations
    const sentimentResult = document.getElementById('sentimentResult');
    if (!sentimentResult) {
        console.error('Sentiment result container not found');
        return;
    }

    // Find or create sentiment bar and label
    let sentimentBar = sentimentResult.querySelector('.sentiment-bar');
    let sentimentLabel = sentimentResult.querySelector('.sentiment-label');

    // If elements don't exist, create the initial structure
    if (!sentimentBar || !sentimentLabel) {
        sentimentResult.innerHTML = `
            <div class="sentiment-meter flex items-center space-x-4">
                <div class="w-full bg-gray-100 rounded-full h-4">
                    <div class="sentiment-bar h-4 rounded-full transition-all duration-500"></div>
                </div>
                <span class="sentiment-label text-sm font-medium"></span>
            </div>
        `;
        sentimentBar = sentimentResult.querySelector('.sentiment-bar');
        sentimentLabel = sentimentResult.querySelector('.sentiment-label');
    }
    
    // Calculate sentiment bar width and color
    const polarity = result.polarity;
    const normalizedPolarity = ((polarity + 1) / 2) * 100; // Convert -1...1 to 0...100
    if (sentimentBar) {
        sentimentBar.style.width = `${normalizedPolarity}%`;
    }
    
    // Set color based on sentiment
    let sentimentColor;
    let sentimentExplanation;
    if (polarity > 0.33) {
        sentimentColor = '#059669'; // Green for positive
        sentimentExplanation = "The text expresses a strongly positive sentiment, conveying optimism, approval, or satisfaction.";
    } else if (polarity < -0.33) {
        sentimentColor = '#DC2626'; // Red for negative
        sentimentExplanation = "The text expresses a strongly negative sentiment, conveying criticism, dissatisfaction, or concern.";
    } else {
        sentimentColor = '#D97706'; // Yellow for neutral
        sentimentExplanation = "The text maintains a neutral tone, presenting information without strong emotional bias.";
    }
    if (sentimentBar) {
        sentimentBar.style.backgroundColor = sentimentColor;
    }
    
    // Set sentiment label with tone
    if (sentimentLabel) {
        sentimentLabel.textContent = `${result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)} (${result.tone})`;
        sentimentLabel.className = `text-sm font-medium ${
            polarity > 0.33 ? 'text-green-600' : 
            polarity < -0.33 ? 'text-red-600' : 
            'text-yellow-600'
        }`;
    }

    // Set sentiment metrics with professional insights
    sentimentResult.innerHTML = `
        <div class="space-y-4">
            <div class="sentiment-meter flex items-center space-x-4 mb-4">
                <div class="w-full bg-gray-100 rounded-full h-4">
                    <div class="sentiment-bar h-4 rounded-full transition-all duration-500" 
                         style="width: ${normalizedPolarity}%; background-color: ${sentimentColor};"></div>
                </div>
                <span class="sentiment-label text-sm font-medium ${
                    polarity > 0.33 ? 'text-green-600' : 
                    polarity < -0.33 ? 'text-red-600' : 
                    'text-yellow-600'
                }">${result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)} (${result.tone})</span>
            </div>

            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-primary">Sentiment Overview</h4>
                    <button onclick="toggleSentimentDetails()" class="text-secondary hover:text-primary transition-colors">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
                <p class="text-sm text-secondary">${sentimentExplanation}</p>
            </div>

            <div id="sentimentDetails" class="hidden space-y-3">
                <div class="p-3 bg-white rounded-lg border border-gray-100">
                    <h4 class="text-sm font-medium text-primary mb-2">Understanding Sentiment Analysis</h4>
                    <div class="text-sm text-secondary space-y-2">
                        <p><strong>Polarity</strong> measures the emotional tone of the text, ranging from negative (-1) to positive (1).</p>
                        <p><strong>Subjectivity</strong> indicates how opinionated the text is, from objective (0) to subjective (1).</p>
                        <p><strong>Confidence</strong> shows how certain the analysis is about the sentiment assessment.</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
                <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-secondary">Polarity</span>
                        <span class="text-sm font-medium ${getPolarityColor(polarity)}">${polarity.toFixed(2)}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-2 ${getPolarityColorClass(polarity)} rounded-full transition-all duration-500" 
                             style="width: ${Math.abs(polarity * 100)}%">
                        </div>
                    </div>
                    <p class="text-xs text-secondary mt-1">${getPolarityExplanation(polarity)}</p>
                </div>

                <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-secondary">Subjectivity</span>
                        <span class="text-sm font-medium text-primary">${result.subjectivity.toFixed(2)}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-2 bg-purple-600 rounded-full transition-all duration-500" 
                             style="width: ${result.subjectivity * 100}%">
                        </div>
                    </div>
                    <p class="text-xs text-secondary mt-1">${getSubjectivityExplanation(result.subjectivity)}</p>
                </div>

                <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-secondary">Confidence</span>
                        <span class="text-sm font-medium text-primary">${result.sentiment_confidence.toFixed(2)}</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-2 bg-blue-600 rounded-full transition-all duration-500" 
                             style="width: ${result.sentiment_confidence * 100}%">
                        </div>
                    </div>
                    <p class="text-xs text-secondary mt-1">${getConfidenceExplanation(result.sentiment_confidence)}</p>
                </div>
            </div>

            <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <h4 class="text-sm font-medium text-primary mb-2">Professional Metrics</h4>
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary">Passive Voice:</span>
                        <span class="font-medium text-primary">${result.professional_metrics.passive_voice_count} instances</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary">Long Sentences:</span>
                        <span class="font-medium text-primary">${result.professional_metrics.long_sentences} instances</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary">Complex Words:</span>
                        <span class="font-medium text-primary">${result.professional_metrics.complex_words} instances</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Readability Metrics
    const readabilityResult = document.getElementById('readabilityResult');
    if (readabilityResult) {
        readabilityResult.innerHTML = `
            <div class="space-y-4">
                <div class="text-center mb-4">
                    <div class="text-lg font-semibold text-primary">${result.flesch_score.toFixed(1)}</div>
                    <div class="text-sm text-secondary mb-2">Flesch Reading Ease</div>
                    <div class="font-medium ${getDifficultyColor(result.difficulty_level)}">${result.difficulty_level}</div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 text-sm text-secondary">
                    <div><span class="font-medium text-primary">${result.word_count}</span> words</div>
                    <div><span class="font-medium text-primary">${result.sentence_count}</span> sentences</div>
                    <div><span class="font-medium text-primary">${result.syllable_count}</span> syllables</div>
                </div>

                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 class="text-sm font-medium text-primary mb-2">Professional Writing Scores</h4>
                    <div class="space-y-3">
                        ${Object.entries(result.professional_scores).map(([key, value]) => `
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-secondary">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                    <span class="font-medium text-primary">${Math.round(value)}%</span>
                                </div>
                                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div class="h-2 bg-blue-600 rounded-full transition-all duration-500" 
                                         style="width: ${Math.round(value)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 class="text-sm font-medium text-primary mb-2">Writing Improvements</h4>
                    <ul class="space-y-2">
                        ${result.writing_improvements.map(improvement => `
                            <li class="flex items-start">
                                <i class="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                                <span class="text-sm text-secondary">${improvement}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Key Phrases
    const keyPhrasesResult = document.getElementById('keyPhrasesResult');
    if (keyPhrasesResult && result.key_phrases) {
        keyPhrasesResult.innerHTML = `
            <div class="space-y-3">
                ${result.key_phrases.map((phrase, index) => {
                    const importancePercent = (phrase.importance * 100).toFixed(1);
                    const relevanceScore = phrase.relevance_score.toFixed(3);
                    const barWidth = Math.min(100, (phrase.frequency / Math.max(...result.key_phrases.map(p => p.frequency))) * 100);
                    
                    return `
                        <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-grow">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium text-primary">${phrase.phrase}</span>
                                        ${index === 0 ? `
                                            <span class="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                                Most Relevant
                                            </span>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="mt-2 space-y-2">
                                        <div>
                                            <div class="flex justify-between text-sm mb-1">
                                                <span class="text-secondary">Frequency</span>
                                                <span class="font-medium text-primary">${phrase.frequency} occurrences</span>
                                            </div>
                                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div class="h-2 bg-blue-600 rounded-full transition-all duration-500" 
                                                     style="width: ${barWidth}%">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="p-2 bg-white rounded-lg border border-gray-100">
                                                <div class="text-xs text-secondary mb-1">Importance</div>
                                                <div class="flex items-center justify-between">
                                                    <div class="text-sm font-medium text-primary">${importancePercent}%</div>
                                                    <div class="text-xs text-secondary">
                                                        ${getImportanceLevel(phrase.importance)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="p-2 bg-white rounded-lg border border-gray-100">
                                                <div class="text-xs text-secondary mb-1">Relevance Score</div>
                                                <div class="text-sm font-medium text-primary">${relevanceScore}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Named Entities
    const entitiesResult = document.getElementById('entitiesResult');
    if (entitiesResult && result.named_entities) {
        entitiesResult.innerHTML = `
            <div class="space-y-3">
                ${Object.entries(result.named_entities).map(([type, entities]) => `
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <div class="font-medium text-primary mb-1">${type}:</div>
                        <div class="flex flex-wrap gap-2">
                            ${entities.map(entity => `
                                <span class="px-2 py-1 bg-white rounded-full text-sm text-secondary border border-gray-200">
                                    ${entity}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Language Information
    const languageResult = document.getElementById('languageResult');
    if (languageResult) {
        languageResult.innerHTML = `
            <div class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-2 mb-2">
                    <span class="text-lg font-semibold text-primary">${result.language_code.toUpperCase()}</span>
                    <span class="text-sm px-2 py-1 bg-white rounded-full text-secondary border border-gray-200">
                        Confidence: ${result.language_confidence}
                    </span>
                </div>
            </div>
        `;
    }

    // Content Category
    const categoryResult = document.getElementById('categoryResult');
    if (categoryResult) {
        categoryResult.innerHTML = `
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-lg font-semibold text-primary flex items-center">
                                ${result.content_category.charAt(0).toUpperCase() + result.content_category.slice(1)}
                                <span class="ml-2 px-2 py-1 text-xs font-medium bg-primary bg-opacity-10 text-primary rounded-full">
                                    Primary Category
                                </span>
                            </div>
                            <div class="text-sm text-secondary mt-1">
                                Confidence: ${(result.category_confidence * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        ${Object.entries(result.category_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, score]) => {
                                const isPrimary = cat === result.content_category;
                                const scorePercent = Math.round(score * 100);
                                const barColor = isPrimary ? 'bg-blue-600' : 'bg-gray-400';
                                return `
                                    <div class="relative">
                                        <div class="flex items-center justify-between mb-1">
                                            <div class="flex items-center">
                                                <span class="text-sm font-medium ${isPrimary ? 'text-blue-600' : 'text-secondary'}">
                                                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </span>
                                                ${isPrimary ? `
                                                    <span class="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                                                        Primary
                                                    </span>
                                                ` : ''}
                                            </div>
                                            <span class="text-sm ${isPrimary ? 'text-blue-600 font-medium' : 'text-secondary'}">
                                                ${scorePercent}%
                                            </span>
                                        </div>
                                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div class="h-full ${barColor} rounded-full transition-all duration-500"
                                                 style="width: ${scorePercent}%">
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-medium text-primary mb-2">Category Insights</h4>
                        <div class="space-y-2">
                            ${getCategoryInsights(result.content_category, result.category_distribution)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Summary
    const summaryResult = document.getElementById('summaryResult');
    if (summaryResult) {
        summaryResult.innerHTML = `
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-primary">Text Summary</h3>
                        <div class="flex items-center space-x-2">
                            <button onclick="toggleSummaryDetails()" class="text-secondary hover:text-primary transition-colors">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <button onclick="copySummary()" class="text-secondary hover:text-primary transition-colors">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <div class="relative">
                        <p class="text-secondary leading-relaxed whitespace-pre-line">${result.summary}</p>
                        <div class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
                            <span class="text-xs text-secondary">${result.summary.split(' ').length} words</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function displayAnalysisHistory(analyses) {
    const historyContainer = document.getElementById('analysisHistory');
    historyContainer.innerHTML = '';

    analyses.forEach(analysis => {
        const element = document.createElement('div');
        element.className = 'card rounded-lg hover:border-primary transition-colors duration-150';
        element.innerHTML = `
            <div class="flex justify-between items-start p-4">
                <div class="flex-grow cursor-pointer" onclick="displayAnalysisResults(${JSON.stringify(analysis).replace(/"/g, '&quot;')})">
                    <div class="flex items-center space-x-3">
                        <h4 class="font-semibold text-primary">${analysis.title}</h4>
                        <span class="text-sm text-secondary">${new Date(analysis.created_at).toLocaleString()}</span>
                    </div>
                    <p class="text-secondary mt-2 line-clamp-2">${analysis.text.substring(0, 150)}...</p>
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            analysis.polarity > 0.33 ? 'bg-green-100 text-green-800' : 
                            analysis.polarity < -0.33 ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                        }">
                            ${analysis.sentiment}
                        </span>
                        <span class="text-sm text-secondary">Difficulty: ${analysis.difficulty_level}</span>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); deleteAnalysis(${analysis.id})" 
                        class="ml-4 text-gray-500 hover:text-red-600 transition-colors duration-150">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        historyContainer.appendChild(element);
    });
}

// Helper function for readability colors
function getDifficultyColor(level) {
    const colors = {
        'Very Easy': 'text-green-600',
        'Easy': 'text-green-500',
        'Fairly Easy': 'text-blue-500',
        'Standard': 'text-blue-600',
        'Fairly Difficult': 'text-yellow-600',
        'Difficult': 'text-orange-600',
        'Very Difficult': 'text-red-600'
    };
    return colors[level] || 'text-gray-600';
}

// UI navigation functions
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// Helper function to get category insights
function getCategoryInsights(primaryCategory, distribution) {
    const insights = [];
    
    // Add primary category insight
    insights.push(`
        <div class="flex items-start">
            <i class="fas fa-star text-yellow-500 mt-1 mr-2"></i>
            <span class="text-sm text-secondary">
                This text is primarily ${primaryCategory}, making it suitable for ${getCategoryAudience(primaryCategory)}.
            </span>
        </div>
    `);

    // Add secondary category insights
    const secondaryCategories = Object.entries(distribution)
        .filter(([cat, score]) => cat !== primaryCategory && score > 0.2)
        .sort((a, b) => b[1] - a[1]);

    if (secondaryCategories.length > 0) {
        insights.push(`
            <div class="flex items-start">
                <i class="fas fa-layer-group text-blue-500 mt-1 mr-2"></i>
                <span class="text-sm text-secondary">
                    The text also shows elements of ${secondaryCategories.map(([cat]) => cat).join(', ')}.
                </span>
            </div>
        `);
    }

    // Add writing style insight
    insights.push(`
        <div class="flex items-start">
            <i class="fas fa-pen-fancy text-purple-500 mt-1 mr-2"></i>
            <span class="text-sm text-secondary">
                ${getWritingStyleInsight(primaryCategory, distribution)}
            </span>
        </div>
    `);

    return insights.join('');
}

// Helper function to get category audience
function getCategoryAudience(category) {
    const audiences = {
        'technical': 'technical professionals and developers',
        'business': 'business professionals and stakeholders',
        'academic': 'researchers and academic audiences',
        'news': 'general readers and news consumers',
        'casual': 'general audience and social media users'
    };
    return audiences[category] || 'its target audience';
}

// Helper function to get writing style insight
function getWritingStyleInsight(primaryCategory, distribution) {
    const insights = {
        'technical': 'The writing style is precise and detailed, focusing on technical accuracy.',
        'business': 'The content maintains a professional tone while being accessible to business readers.',
        'academic': 'The text follows academic conventions with formal language and structured arguments.',
        'news': 'The writing is clear and direct, presenting information in a journalistic style.',
        'casual': 'The tone is conversational and engaging, suitable for informal communication.'
    };
    return insights[primaryCategory] || 'The writing style matches the primary category.';
}

// Helper function to toggle category details
function toggleCategoryDetails() {
    const details = document.getElementById('categoryDetails');
    details.classList.toggle('hidden');
}

// Helper function to toggle summary details
function toggleSummaryDetails() {
    const details = document.getElementById('summaryDetails');
    details.classList.toggle('hidden');
}

// Helper function to copy summary
function copySummary() {
    const summary = document.querySelector('#summaryResult p').textContent;
    navigator.clipboard.writeText(summary).then(() => {
        // Show a temporary success message
        const button = document.querySelector('#summaryResult button:last-child');
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    });
}

// Helper function to get polarity color
function getPolarityColor(polarity) {
    if (polarity > 0.33) return 'text-green-600';
    if (polarity < -0.33) return 'text-red-600';
    return 'text-yellow-600';
}

// Helper function to get polarity color class
function getPolarityColorClass(polarity) {
    if (polarity > 0.33) return 'bg-green-600';
    if (polarity < -0.33) return 'bg-red-600';
    return 'bg-yellow-600';
}

// Helper function to get polarity explanation
function getPolarityExplanation(polarity) {
    if (polarity > 0.33) return "Strongly positive emotional tone";
    if (polarity > 0) return "Slightly positive emotional tone";
    if (polarity < -0.33) return "Strongly negative emotional tone";
    if (polarity < 0) return "Slightly negative emotional tone";
    return "Neutral emotional tone";
}

// Helper function to get subjectivity explanation
function getSubjectivityExplanation(subjectivity) {
    if (subjectivity > 0.7) return "Highly opinionated content";
    if (subjectivity > 0.4) return "Moderately subjective";
    if (subjectivity > 0.2) return "Somewhat objective";
    return "Highly objective content";
}

// Helper function to get confidence explanation
function getConfidenceExplanation(confidence) {
    if (confidence > 0.8) return "Very high confidence";
    if (confidence > 0.6) return "High confidence";
    if (confidence > 0.4) return "Moderate confidence";
    return "Low confidence";
}

// Helper function to toggle sentiment details
function toggleSentimentDetails() {
    const details = document.getElementById('sentimentDetails');
    details.classList.toggle('hidden');
}

// Helper function to get importance level
function getImportanceLevel(importance) {
    if (importance > 0.05) return 'Very High';
    if (importance > 0.03) return 'High';
    if (importance > 0.02) return 'Medium';
    if (importance > 0.01) return 'Low';
    return 'Very Low';
}

// Helper function to toggle key phrases details
function toggleKeyPhrasesDetails() {
    const details = document.getElementById('keyPhrasesDetails');
    details.classList.toggle('hidden');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    if (token) {
        await fetchUserProfile();
    }
    updateUIState();
});