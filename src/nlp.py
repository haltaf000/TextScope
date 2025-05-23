from textblob import TextBlob
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from nltk.tokenize import RegexpTokenizer
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
from typing import Dict, List, Tuple, Optional
import json
import math
from collections import Counter
import re
from langdetect import detect
import numpy as np
import os

# Set NLTK data path to a writable directory in production
if os.getenv('ENVIRONMENT') == 'production':
    nltk_data_dir = os.path.join(os.getcwd(), 'nltk_data')
    os.makedirs(nltk_data_dir, exist_ok=True)
    nltk.data.path.append(nltk_data_dir)

# Required NLTK data
REQUIRED_NLTK_DATA = [
    'punkt',
    'averaged_perceptron_tagger',
    'maxent_ne_chunker',
    'words',
    'stopwords',
    'wordnet',
    'brown',  # Required for TextBlob
    'conll2000',  # Required for TextBlob
    'movie_reviews'  # Required for TextBlob
]

def ensure_nltk_data():
    """Ensure all required NLTK data is downloaded."""
    for item in REQUIRED_NLTK_DATA:
        try:
            nltk.data.find(f'{item}')
        except LookupError:
            try:
                nltk.download(item, download_dir=nltk_data_dir if os.getenv('ENVIRONMENT') == 'production' else None)
            except Exception as e:
                print(f"Error downloading {item}: {str(e)}")
                raise

# Download required NLTK data
ensure_nltk_data()

class TextAnalyzer:
    def __init__(self, text: str):
        try:
            self.text = text
            self.blob = TextBlob(text)
            self.tokens = word_tokenize(text)
            self.sentences = sent_tokenize(text)
            self.stop_words = set(stopwords.words('english'))
            self.lemmatizer = WordNetLemmatizer()
            self.word_tokenizer = RegexpTokenizer(r'\w+')
            # Add professional writing metrics
            self.professional_metrics = self._calculate_professional_metrics()
        except Exception as e:
            print(f"Initialization error: {str(e)}")
            print(f"NLTK data path: {nltk.data.path}")
            raise

    def _calculate_professional_metrics(self) -> Dict:
        """Calculate professional writing metrics."""
        metrics = {
            "passive_voice_count": 0,
            "long_sentences": 0,
            "complex_words": 0,
            "repetitive_words": 0,
            "clarity_score": 0
        }
        
        # Count passive voice
        for sentence in self.sentences:
            if re.search(r'\b(am|is|are|was|were|be|been|being)\s+\w+ed\b', sentence, re.IGNORECASE):
                metrics["passive_voice_count"] += 1
            
            # Count long sentences (more than 20 words)
            if len(word_tokenize(sentence)) > 20:
                metrics["long_sentences"] += 1
        
        # Count complex words (more than 2 syllables)
        for word in self.tokens:
            if self._count_syllables(word) > 2:
                metrics["complex_words"] += 1
        
        # Find repetitive words
        word_freq = Counter(word.lower() for word in self.tokens if word.lower() not in self.stop_words)
        metrics["repetitive_words"] = sum(1 for word, count in word_freq.items() if count > 3)
        
        # Calculate clarity score (0-100)
        total_words = len(self.tokens)
        if total_words > 0:
            clarity_factors = [
                (1 - metrics["passive_voice_count"] / len(self.sentences)) * 25,  # Passive voice impact
                (1 - metrics["long_sentences"] / len(self.sentences)) * 25,  # Sentence length impact
                (1 - metrics["complex_words"] / total_words) * 25,  # Complex words impact
                (1 - metrics["repetitive_words"] / total_words) * 25  # Repetition impact
            ]
            metrics["clarity_score"] = round(sum(clarity_factors), 2)
        
        return metrics

    def get_sentiment_analysis(self) -> Dict:
        """
        Enhanced sentiment analysis with professional writing insights.
        """
        polarity = self.blob.sentiment.polarity
        subjectivity = self.blob.sentiment.subjectivity
        
        # Calculate confidence based on subjectivity and polarity strength
        confidence = (abs(polarity) + (1 - abs(subjectivity - 0.5))) / 2

        sentiment = "neutral"
        if polarity > 0:
            sentiment = "positive"
        elif polarity < 0:
            sentiment = "negative"

        # Add professional tone analysis
        tone = "professional"
        if subjectivity > 0.7:
            tone = "subjective"
        elif subjectivity < 0.3:
            tone = "objective"

        return {
            "sentiment": sentiment,
            "polarity": round(polarity, 3),
            "subjectivity": round(subjectivity, 3),
            "confidence": round(confidence, 3),
            "tone": tone,
            "professional_metrics": self.professional_metrics
        }

    def get_readability_metrics(self) -> Dict:
        """
        Enhanced readability metrics with professional writing insights.
        """
        word_count = len(self.word_tokenizer.tokenize(self.text))
        sentence_count = len(self.sentences)
        syllable_count = sum(self._count_syllables(word) for word in self.tokens)
        
        # Average sentence length
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        
        # Flesch Reading Ease score
        if word_count > 0 and sentence_count > 0:
            flesch_score = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllable_count / word_count)
        else:
            flesch_score = 0

        # Calculate professional writing scores
        professional_scores = {
            "clarity": self.professional_metrics["clarity_score"],
            "conciseness": max(0, 100 - (self.professional_metrics["long_sentences"] / sentence_count * 100)),
            "objectivity": max(0, 100 - (self.professional_metrics["passive_voice_count"] / sentence_count * 100)),
            "vocabulary_diversity": max(0, 100 - (self.professional_metrics["repetitive_words"] / word_count * 100))
        }

        return {
            "flesch_reading_ease": round(flesch_score, 2),
            "avg_sentence_length": round(avg_sentence_length, 2),
            "word_count": word_count,
            "sentence_count": sentence_count,
            "syllable_count": syllable_count,
            "difficulty_level": self._get_difficulty_level(flesch_score),
            "professional_scores": professional_scores,
            "writing_improvements": self._get_writing_improvements()
        }

    def _get_writing_improvements(self) -> List[str]:
        """Generate specific writing improvement suggestions."""
        improvements = []
        
        if self.professional_metrics["passive_voice_count"] > len(self.sentences) * 0.2:
            improvements.append("Consider reducing passive voice usage for more direct communication")
        
        if self.professional_metrics["long_sentences"] > len(self.sentences) * 0.3:
            improvements.append("Break down long sentences to improve clarity and readability")
        
        if self.professional_metrics["complex_words"] > len(self.tokens) * 0.2:
            improvements.append("Simplify complex vocabulary where possible to enhance understanding")
        
        if self.professional_metrics["repetitive_words"] > 0:
            improvements.append("Vary word choice to avoid repetition and maintain reader engagement")
        
        return improvements

    def extract_key_phrases(self, top_n: int = 10) -> List[Dict]:
        """
        Extract key phrases with relevance scores.
        """
        try:
            # Get noun phrases from TextBlob
            noun_phrases = list(set(self.blob.noun_phrases))
        except Exception as e:
            print(f"Noun phrase extraction failed: {str(e)}")
            # Fallback: Use basic noun extraction
            tagged = nltk.pos_tag(self.tokens)
            noun_phrases = []
            current_phrase = []
            
            for word, tag in tagged:
                if tag.startswith('NN'):  # If it's a noun
                    current_phrase.append(word)
                elif current_phrase:  # If we have a phrase and hit a non-noun
                    noun_phrases.append(' '.join(current_phrase))
                    current_phrase = []
            
            if current_phrase:  # Add the last phrase if exists
                noun_phrases.append(' '.join(current_phrase))
            
            noun_phrases = list(set(noun_phrases))  # Remove duplicates
        
        # Calculate TF-IDF-like scores for phrases
        phrase_scores = []
        total_phrases = len(noun_phrases) if noun_phrases else 1
        
        for phrase in noun_phrases:
            try:
                # Term frequency
                tf = self.text.lower().count(phrase.lower()) / len(self.tokens)
                # Inverse document frequency (simplified)
                idf = math.log(total_phrases / (1 + self.text.lower().count(phrase.lower())))
                # TF-IDF score
                score = tf * idf
                
                phrase_scores.append({
                    "phrase": phrase,
                    "relevance_score": round(score, 4),
                    "frequency": self.text.lower().count(phrase.lower()),
                    "importance": round(score * 100, 2)  # Add importance score for visualization
                })
            except Exception as e:
                print(f"Error scoring phrase '{phrase}': {str(e)}")
                continue
        
        # Sort by relevance score and return top N
        return sorted(phrase_scores, key=lambda x: x['relevance_score'], reverse=True)[:top_n]

    def get_named_entities(self) -> Dict[str, List[str]]:
        """
        Enhanced named entity recognition with categorization.
        """
        chunks = nltk.ne_chunk(nltk.pos_tag(self.tokens))
        entities = {
            'PERSON': [], 'ORGANIZATION': [], 'LOCATION': [], 
            'DATE': [], 'TIME': [], 'MONEY': [], 'PERCENT': []
        }
        
        for chunk in chunks:
            if hasattr(chunk, 'label'):
                entity_text = ' '.join(c[0] for c in chunk.leaves())
                entity_type = chunk.label()
                if entity_type in entities:
                    entities[entity_type].append(entity_text)
        
        # Remove duplicates and keep only non-empty categories
        return {k: list(set(v)) for k, v in entities.items() if v}

    def get_language_info(self) -> Dict:
        """
        Detect language and provide confidence metrics.
        """
        try:
            language = detect(self.text)
            return {
                "language_code": language,
                "is_english": language == 'en',
                "confidence": "high" if len(self.text.split()) > 30 else "medium"
            }
        except:
            return {
                "language_code": "unknown",
                "is_english": None,
                "confidence": "low"
            }

    def get_content_category(self) -> Dict:
        """
        Categorize the content type based on text patterns and keywords.
        """
        categories = {
            'technical': set(['code', 'programming', 'software', 'data', 'algorithm']),
            'business': set(['market', 'business', 'company', 'financial', 'revenue']),
            'academic': set(['research', 'study', 'analysis', 'theory', 'methodology']),
            'news': set(['reported', 'announced', 'according', 'today', 'recently']),
            'casual': set(['like', 'think', 'feel', 'maybe', 'probably'])
        }
        
        words = set(word.lower() for word in self.tokens if word.lower() not in self.stop_words)
        
        category_scores = {}
        for category, keywords in categories.items():
            score = len(words.intersection(keywords)) / len(keywords)
            category_scores[category] = round(score, 2)
        
        primary_category = max(category_scores.items(), key=lambda x: x[1])
        
        return {
            "primary_category": primary_category[0],
            "confidence_score": primary_category[1],
            "category_distribution": category_scores
        }

    def get_summary(self, num_sentences: int = 3) -> str:
        """
        Generate a text summary using extractive summarization.
        """
        # Calculate sentence scores based on word frequency
        word_freq = FreqDist(word.lower() for word in self.tokens if word.lower() not in self.stop_words)
        sentence_scores = {}
        
        for sentence in self.sentences:
            sentence_words = word_tokenize(sentence.lower())
            score = sum(word_freq[word] for word in sentence_words if word not in self.stop_words)
            sentence_scores[sentence] = score
        
        # Get top N sentences
        summary_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)[:num_sentences]
        summary = ' '.join(sentence for sentence, score in sorted(summary_sentences, key=lambda x: self.sentences.index(x[0])))
        
        return summary

    def _count_syllables(self, word: str) -> int:
        """Helper method to count syllables in a word."""
        word = word.lower()
        count = 0
        vowels = 'aeiouy'
        if word[0] in vowels:
            count += 1
        for index in range(1, len(word)):
            if word[index] in vowels and word[index - 1] not in vowels:
                count += 1
        if word.endswith('e'):
            count -= 1
        if count == 0:
            count += 1
        return count

    def _get_difficulty_level(self, flesch_score: float) -> str:
        """Helper method to convert Flesch score to difficulty level."""
        if flesch_score >= 90:
            return "Very Easy"
        elif flesch_score >= 80:
            return "Easy"
        elif flesch_score >= 70:
            return "Fairly Easy"
        elif flesch_score >= 60:
            return "Standard"
        elif flesch_score >= 50:
            return "Fairly Difficult"
        elif flesch_score >= 30:
            return "Difficult"
        else:
            return "Very Difficult"

def analyze_text(text: str) -> Dict:
    """
    Main function to analyze text.
    """
    try:
        # Ensure NLTK data is available before analysis
        ensure_nltk_data()
        
        analyzer = TextAnalyzer(text)
        
        return {
            "sentiment_analysis": analyzer.get_sentiment_analysis(),
            "readability": analyzer.get_readability_metrics(),
            "key_phrases": analyzer.extract_key_phrases(),
            "named_entities": analyzer.get_named_entities(),
            "language_info": analyzer.get_language_info(),
            "content_category": analyzer.get_content_category(),
            "summary": analyzer.get_summary()
        }
    except Exception as e:
        import traceback
        error_detail = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "nltk_data_path": nltk.data.path,
            "cwd": os.getcwd(),
            "nltk_data_exists": os.path.exists(nltk_data_dir) if os.getenv('ENVIRONMENT') == 'production' else None
        }
        print("Text Analysis Error:", json.dumps(error_detail, indent=2))  # This will show in your logs
        raise Exception(f"Analysis failed: {str(e)}. NLTK path: {nltk.data.path}")
