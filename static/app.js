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
    const analysisResults = document.getElementById('analysisResults');
    
    if (!text.trim()) {
        alert('Please enter some text to analyze.');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
        
        const response = await fetch('/analyze/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, title }),
        });

        if (response.ok) {
            const result = await response.json();
            currentAnalysisData = result;
            
            // Clear the form
            document.getElementById('textInput').value = '';
            document.getElementById('titleInput').value = '';
            
            // Update UI
            displayAnalysisResults(result);
            await loadAnalysisHistory();  // Refresh history after successful analysis
            
            // Scroll to results
            analysisResults.scrollIntoView({ behavior: 'smooth' });
        } else {
            const errorData = await response.json();
            alert(`Analysis failed: ${errorData.detail || 'Please try again.'}`);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('An error occurred during analysis. Please try again.');
    } finally {
        submitButton.disabled = false;
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
    analysisResults.classList.remove('hidden');
    analysisResults.dataset.currentId = result.id;

    // Sentiment Analysis with enhanced explanations
    const sentimentResult = document.getElementById('sentimentResult');
    const sentimentBar = sentimentResult.querySelector('.sentiment-bar');
    const sentimentLabel = sentimentResult.querySelector('.sentiment-label');
    
    // Calculate sentiment bar width and color
    const polarity = result.polarity;
    const normalizedPolarity = ((polarity + 1) / 2) * 100; // Convert -1...1 to 0...100
    sentimentBar.style.width = `${normalizedPolarity}%`;
    
    // Set color based on sentiment
    let sentimentColor;
    let sentimentExplanation;
    if (polarity > 0.33) {
        sentimentColor = '#059669'; // Green for positive
        sentimentExplanation = "The text expresses a strongly positive sentiment, conveying optimism, approval, or satisfaction.";
    } else if (polarity < -0.33) {
        sentimentColor = '#DC2626'; // Red for negative
        sentimentExplanation = "The text expresses a strongly negative sentiment, conveying criticism, disapproval, or dissatisfaction.";
    } else {
        sentimentColor = '#D97706'; // Yellow for neutral
        sentimentExplanation = "The text maintains a neutral sentiment, presenting information without strong emotional bias.";
    }
    
    sentimentBar.style.backgroundColor = sentimentColor;
    sentimentLabel.textContent = result.sentiment;
    sentimentLabel.style.color = sentimentColor;

    // Update all other result sections
    document.getElementById('polarityValue').textContent = (result.polarity * 100).toFixed(1) + '%';
    document.getElementById('subjectivityValue').textContent = (result.subjectivity * 100).toFixed(1) + '%';
    document.getElementById('confidenceValue').textContent = (result.sentiment_confidence * 100).toFixed(1) + '%';
    document.getElementById('toneValue').textContent = result.tone;
    
    // Update metrics
    document.getElementById('readabilityScore').textContent = result.flesch_score.toFixed(1);
    document.getElementById('wordCount').textContent = result.word_count;
    document.getElementById('sentenceCount').textContent = result.sentence_count;
    document.getElementById('avgSentenceLength').textContent = result.avg_sentence_length.toFixed(1);
    
    // Update key phrases
    const keyPhrasesContainer = document.getElementById('keyPhrases');
    keyPhrasesContainer.innerHTML = result.key_phrases.map(phrase => `
        <div class="flex items-center justify-between p-2 rounded bg-gray-50">
            <span class="text-primary">${phrase.phrase}</span>
            <span class="text-sm text-secondary">${phrase.importance.toFixed(1)}% relevance</span>
        </div>
    `).join('');
    
    // Update named entities
    const entitiesContainer = document.getElementById('namedEntities');
    entitiesContainer.innerHTML = '';
    Object.entries(result.named_entities).forEach(([type, entities]) => {
        if (entities.length > 0) {
            entitiesContainer.innerHTML += `
                <div class="mb-4">
                    <h4 class="font-semibold text-primary mb-2">${type}</h4>
                    <div class="flex flex-wrap gap-2">
                        ${entities.map(entity => `
                            <span class="px-2 py-1 rounded-full bg-gray-100 text-sm">${entity}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    // Update summary
    document.getElementById('summary').textContent = result.summary;
    
    // Show the results section
    analysisResults.classList.remove('hidden');
    analysisResults.scrollIntoView({ behavior: 'smooth' });
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