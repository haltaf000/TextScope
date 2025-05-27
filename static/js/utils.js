// Utilities Module
// Contains helper functions for colors, difficulty levels, insights, and other utilities

class Utils {
    // Get difficulty color based on level
    static getDifficultyColor(level) {
        const colors = {
            'Very Easy': 'text-green-600',
            'Easy': 'text-green-500',
            'Medium': 'text-yellow-500',
            'Hard': 'text-orange-500',
            'Very Hard': 'text-red-500'
        };
        return colors[level] || 'text-gray-500';
    }

    // Get polarity color
    static getPolarityColor(polarity) {
        if (polarity > 0.1) return '#10B981'; // Green for positive
        if (polarity < -0.1) return '#EF4444'; // Red for negative
        return '#6B7280'; // Gray for neutral
    }

    // Get polarity color class
    static getPolarityColorClass(polarity) {
        if (polarity > 0.1) return 'text-green-600';
        if (polarity < -0.1) return 'text-red-600';
        return 'text-gray-600';
    }

    // Get polarity explanation
    static getPolarityExplanation(polarity) {
        if (polarity > 0.5) return 'Very positive sentiment';
        if (polarity > 0.1) return 'Positive sentiment';
        if (polarity > -0.1) return 'Neutral sentiment';
        if (polarity > -0.5) return 'Negative sentiment';
        return 'Very negative sentiment';
    }

    // Get subjectivity explanation
    static getSubjectivityExplanation(subjectivity) {
        if (subjectivity > 0.7) return 'Highly subjective (opinion-based)';
        if (subjectivity > 0.3) return 'Moderately subjective';
        return 'Objective (fact-based)';
    }

    // Get confidence explanation
    static getConfidenceExplanation(confidence) {
        if (confidence > 0.8) return 'Very high confidence';
        if (confidence > 0.6) return 'High confidence';
        if (confidence > 0.4) return 'Medium confidence';
        return 'Low confidence';
    }

    // Get importance level
    static getImportanceLevel(importance) {
        if (importance >= 80) return { level: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
        if (importance >= 60) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
        if (importance >= 40) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        if (importance >= 20) return { level: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' };
        return { level: 'Minimal', color: 'text-gray-600', bg: 'bg-gray-100' };
    }

    // Get phrase type icon
    static getPhraseTypeIcon(phraseType) {
        const icons = {
            'proper_noun': '👤',
            'verb_phrase': '⚡',
            'noun_phrase': '📝',
            'descriptive': '🎨',
            'general': '💭'
        };
        return icons[phraseType] || '💭';
    }

    // Get category color
    static getCategoryColor(category) {
        const colors = {
            'person': '#8B5CF6',      // Purple
            'organization': '#3B82F6', // Blue
            'location': '#10B981',     // Green
            'technology': '#F59E0B',   // Amber
            'concept': '#EF4444',      // Red
            'action': '#EC4899',       // Pink
            'quality': '#06B6D4',      // Cyan
            'product': '#84CC16',      // Lime
            'general': '#6B7280'       // Gray
        };
        return colors[category] || '#6B7280';
    }

    // Get score level
    static getScoreLevel(score, type = 'general') {
        if (type === 'tfidf') {
            if (score >= 0.3) return { level: 'High', color: 'text-green-600' };
            if (score >= 0.1) return { level: 'Medium', color: 'text-yellow-600' };
            return { level: 'Low', color: 'text-gray-600' };
        }
        
        // General scoring (0-1 scale)
        if (score >= 0.8) return { level: 'Excellent', color: 'text-green-600' };
        if (score >= 0.6) return { level: 'Good', color: 'text-blue-600' };
        if (score >= 0.4) return { level: 'Fair', color: 'text-yellow-600' };
        if (score >= 0.2) return { level: 'Poor', color: 'text-orange-600' };
        return { level: 'Very Poor', color: 'text-red-600' };
    }

    // Get category insights
    static getCategoryInsights(primaryCategory, distribution) {
        const insights = {
            'Academic': {
                description: 'Scholarly and educational content',
                audience: 'Students, researchers, academics',
                tone: 'Formal and informative',
                suggestions: ['Add more examples', 'Include citations', 'Consider peer review']
            },
            'Business': {
                description: 'Professional and commercial content',
                audience: 'Business professionals, entrepreneurs',
                tone: 'Professional and goal-oriented',
                suggestions: ['Include metrics', 'Add call-to-action', 'Focus on ROI']
            },
            'Creative': {
                description: 'Artistic and imaginative content',
                audience: 'Artists, writers, creative professionals',
                tone: 'Expressive and inspiring',
                suggestions: ['Enhance imagery', 'Add emotional depth', 'Include sensory details']
            },
            'Technical': {
                description: 'Specialized and detailed content',
                audience: 'Engineers, developers, specialists',
                tone: 'Precise and methodical',
                suggestions: ['Add code examples', 'Include diagrams', 'Provide step-by-step guides']
            },
            'Casual': {
                description: 'Informal and conversational content',
                audience: 'General public, friends, family',
                tone: 'Relaxed and approachable',
                suggestions: ['Use more contractions', 'Add personal anecdotes', 'Include humor']
            }
        };

        return insights[primaryCategory] || {
            description: 'Mixed or general content',
            audience: 'General audience',
            tone: 'Varied',
            suggestions: ['Consider your target audience', 'Maintain consistency', 'Clarify your purpose']
        };
    }

    // Get category audience
    static getCategoryAudience(category) {
        const audiences = {
            'Academic': 'Students, researchers, academics',
            'Business': 'Professionals, entrepreneurs, stakeholders',
            'Creative': 'Artists, writers, creative minds',
            'Technical': 'Engineers, developers, specialists',
            'Casual': 'General public, friends, family'
        };
        return audiences[category] || 'General audience';
    }

    // Get writing style insight
    static getWritingStyleInsight(primaryCategory, distribution) {
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        const diversity = Object.keys(distribution).length;
        
        if (diversity === 1) {
            return `Highly focused ${primaryCategory.toLowerCase()} writing style`;
        } else if (diversity <= 2) {
            return `Primarily ${primaryCategory.toLowerCase()} with some variation`;
        } else {
            return `Diverse writing style spanning multiple categories`;
        }
    }

    // Format percentage
    static formatPercentage(value) {
        return `${(value * 100).toFixed(1)}%`;
    }

    // Format score
    static formatScore(value, decimals = 3) {
        return value.toFixed(decimals);
    }

    // Capitalize first letter
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Truncate text
    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Format date
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Debounce function
    static debounce(func, wait) {
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

    // Generate random ID
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Export for global use
window.Utils = Utils; 