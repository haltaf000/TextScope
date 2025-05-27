from textblob import TextBlob
import spacy
from spacy.lang.en.stop_words import STOP_WORDS
from typing import Dict, List, Tuple, Optional
import json
import math
from collections import Counter
import re
from langdetect import detect
import numpy as np
import os

# Load spaCy model
def load_spacy_model():
    """Load spaCy model with error handling."""
    try:
        # Try to load the model
        nlp = spacy.load("en_core_web_sm")
        return nlp
    except OSError:
        # If model not found, provide helpful error message
        raise RuntimeError(
            "spaCy English model 'en_core_web_sm' not found. "
            "Please install it using: python -m spacy download en_core_web_sm"
        )

# Initialize spaCy
nlp = load_spacy_model()

class TextAnalyzer:
    def __init__(self, text: str):
        self.text = text
        self.blob = TextBlob(text)
        self.doc = nlp(text)
        self.tokens = [token.text for token in self.doc if not token.is_space]
        self.sentences = [sent.text.strip() for sent in self.doc.sents]
        self.stop_words = STOP_WORDS
            
        # Add professional writing metrics
        self.professional_metrics = self._calculate_professional_metrics()

    def _get_wordnet_pos(self, word: str) -> str:
        """Map POS tag to first character lemmatize() accepts (for TextBlob compatibility)"""
        # Get spaCy POS tag
        token = nlp(word)[0]
        pos = token.pos_
        
        # Map to WordNet format for TextBlob compatibility
        if pos.startswith('ADJ'):
            return 'a'  # adjective
        elif pos.startswith('NOUN'):
            return 'n'  # noun
        elif pos.startswith('VERB'):
            return 'v'  # verb
        elif pos.startswith('ADV'):
            return 'r'  # adverb
        else:
            return 'n'  # default to noun

    def _normalize_word(self, word: str) -> str:
        """Normalize word using spaCy lemmatization"""
        # Convert to lowercase and remove basic punctuation
        word = word.lower().strip('.,!?;:\'\"')
        # Use spaCy for lemmatization
        doc = nlp(word)
        if doc:
            return doc[0].lemma_
        return word

    def _calculate_professional_metrics(self) -> Dict:
        """Calculate professional writing metrics."""
        metrics = {
            "passive_voice_count": 0,
            "long_sentences": 0,
            "complex_words": 0,
            "repetitive_words": 0,
            "clarity_score": 0
        }
        
        # Count passive voice using spaCy dependency parsing
        for sent in self.doc.sents:
            # Look for passive voice patterns
            for token in sent:
                if token.dep_ == "auxpass" or (token.dep_ == "nsubjpass"):
                    metrics["passive_voice_count"] += 1
                    break
            
            # Count long sentences (more than 20 words)
            sent_tokens = [t for t in sent if not t.is_space and not t.is_punct]
            if len(sent_tokens) > 20:
                metrics["long_sentences"] += 1
        
        # Count complex words (more than 2 syllables)
        for token in self.doc:
            if not token.is_space and not token.is_punct:
                if self._count_syllables(token.text) > 2:
                    metrics["complex_words"] += 1
        
        # Find repetitive words
        word_freq = Counter(token.lemma_.lower() for token in self.doc 
                          if not token.is_stop and not token.is_punct and not token.is_space)
        metrics["repetitive_words"] = sum(1 for word, count in word_freq.items() if count > 3)
        
        # Calculate clarity score (0-100)
        total_words = len([t for t in self.doc if not t.is_space and not t.is_punct])
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
        # Count words excluding punctuation and spaces
        word_count = len([token for token in self.doc if not token.is_space and not token.is_punct])
        sentence_count = len(self.sentences)
        syllable_count = sum(self._count_syllables(token.text) for token in self.doc 
                           if not token.is_space and not token.is_punct)
        
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

    def extract_key_phrases(self, top_n: int = 15) -> List[Dict]:
        """
        Advanced key phrase extraction with multiple algorithms and enhanced features.
        """
        phrase_scores = []
        
        # 1. Extract noun phrases from TextBlob
        textblob_phrases = list(set(str(phrase) for phrase in self.blob.noun_phrases))
        
        # 2. Extract noun chunks from spaCy
        spacy_noun_chunks = [chunk.text.strip() for chunk in self.doc.noun_chunks if len(chunk.text.strip()) > 2]
        
        # 3. Extract verb phrases (verb + object patterns)
        verb_phrases = self._extract_verb_phrases()
        
        # 4. Extract multi-word expressions using dependency parsing
        dependency_phrases = self._extract_dependency_phrases()
        
        # 5. Extract significant single words (high TF-IDF)
        significant_words = self._extract_significant_words()
        
        # Combine all phrase sources
        all_phrases = list(set(textblob_phrases + spacy_noun_chunks + verb_phrases + dependency_phrases + significant_words))
        
        # Filter out very short or very long phrases
        all_phrases = [phrase for phrase in all_phrases if 2 <= len(phrase.split()) <= 6 and len(phrase) >= 3]
        
        total_phrases = len(all_phrases)
        if total_phrases == 0:
            return []
        
        # Calculate advanced scores for each phrase
        for phrase in all_phrases:
            phrase_clean = phrase.lower().strip()
            
            # Basic frequency metrics
            frequency = self.text.lower().count(phrase_clean)
            if frequency == 0:
                continue
                
            # Term frequency
            tf = frequency / len(self.tokens)
            
            # Inverse document frequency (simplified)
            idf = math.log(total_phrases / (1 + frequency))
            
            # TF-IDF score
            tfidf_score = tf * idf
            
            # Advanced scoring factors
            phrase_length_score = self._calculate_phrase_length_score(phrase)
            pos_diversity_score = self._calculate_pos_diversity_score(phrase)
            semantic_coherence_score = self._calculate_semantic_coherence_score(phrase)
            position_score = self._calculate_position_score(phrase)
            capitalization_score = self._calculate_capitalization_score(phrase)
            
            # Combine scores with weights
            final_score = (
                tfidf_score * 0.35 +
                phrase_length_score * 0.15 +
                pos_diversity_score * 0.15 +
                semantic_coherence_score * 0.15 +
                position_score * 0.10 +
                capitalization_score * 0.10
            )
            
            # Determine phrase type and category
            phrase_type = self._classify_phrase_type(phrase)
            phrase_category = self._classify_phrase_category(phrase)
            
            phrase_scores.append({
                "phrase": phrase.strip(),
                "relevance_score": round(final_score, 4),
                "frequency": frequency,
                "importance": round(final_score * 100, 2),
                "tfidf_score": round(tfidf_score, 4),
                "phrase_type": phrase_type,
                "category": phrase_category,
                "length_score": round(phrase_length_score, 3),
                "pos_diversity": round(pos_diversity_score, 3),
                "semantic_coherence": round(semantic_coherence_score, 3),
                "position_score": round(position_score, 3),
                "capitalization_score": round(capitalization_score, 3),
                "word_count": len(phrase.split()),
                "char_count": len(phrase)
            })
        
        # Sort by relevance score and return top N
        sorted_phrases = sorted(phrase_scores, key=lambda x: x['relevance_score'], reverse=True)
        
        # Add ranking information
        for i, phrase in enumerate(sorted_phrases[:top_n]):
            phrase['rank'] = i + 1
            phrase['percentile'] = round((1 - i / len(sorted_phrases)) * 100, 1)
        
        return sorted_phrases[:top_n]
    
    def _extract_verb_phrases(self) -> List[str]:
        """Extract verb phrases using dependency parsing."""
        verb_phrases = []
        
        for token in self.doc:
            if token.pos_ == "VERB" and not token.is_stop:
                # Find objects and complements of the verb
                phrase_parts = [token.text]
                
                for child in token.children:
                    if child.dep_ in ["dobj", "pobj", "acomp", "xcomp"] and not child.is_stop:
                        phrase_parts.append(child.text)
                        # Add children of the object
                        for grandchild in child.children:
                            if grandchild.dep_ in ["amod", "compound"] and not grandchild.is_stop:
                                phrase_parts.insert(-1, grandchild.text)
                
                if len(phrase_parts) > 1:
                    verb_phrases.append(" ".join(phrase_parts))
        
        return list(set(verb_phrases))
    
    def _extract_dependency_phrases(self) -> List[str]:
        """Extract phrases based on dependency relationships."""
        dependency_phrases = []
        
        for token in self.doc:
            if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
                phrase_parts = [token.text]
                
                # Add modifiers
                for child in token.children:
                    if child.dep_ in ["amod", "compound", "nmod"] and not child.is_stop:
                        if child.i < token.i:
                            phrase_parts.insert(0, child.text)
                        else:
                            phrase_parts.append(child.text)
                
                if len(phrase_parts) > 1:
                    dependency_phrases.append(" ".join(phrase_parts))
        
        return list(set(dependency_phrases))
    
    def _extract_significant_words(self) -> List[str]:
        """Extract significant single words based on TF-IDF."""
        word_scores = {}
        
        for token in self.doc:
            if (not token.is_stop and not token.is_punct and not token.is_space 
                and token.pos_ in ["NOUN", "PROPN", "ADJ", "VERB"] and len(token.text) > 3):
                
                word = token.lemma_.lower()
                frequency = sum(1 for t in self.doc if t.lemma_.lower() == word)
                
                if frequency >= 2:  # Only include words that appear at least twice
                    tf = frequency / len(self.tokens)
                    idf = math.log(len(self.tokens) / frequency)
                    word_scores[token.text] = tf * idf
        
        # Return top significant words
        sorted_words = sorted(word_scores.items(), key=lambda x: x[1], reverse=True)
        return [word for word, score in sorted_words[:10]]
    
    def _calculate_phrase_length_score(self, phrase: str) -> float:
        """Calculate score based on phrase length (optimal length gets higher score)."""
        word_count = len(phrase.split())
        if word_count == 2:
            return 1.0
        elif word_count == 3:
            return 0.9
        elif word_count == 4:
            return 0.7
        elif word_count == 1:
            return 0.6
        else:
            return 0.4
    
    def _calculate_pos_diversity_score(self, phrase: str) -> float:
        """Calculate score based on part-of-speech diversity."""
        phrase_doc = nlp(phrase)
        pos_tags = set(token.pos_ for token in phrase_doc if not token.is_punct)
        
        # Reward phrases with good POS diversity
        if len(pos_tags) >= 2:
            return 1.0
        else:
            return 0.5
    
    def _calculate_semantic_coherence_score(self, phrase: str) -> float:
        """Calculate semantic coherence using word vectors."""
        try:
            phrase_doc = nlp(str(phrase))  # Ensure phrase is a string
            tokens = [token for token in phrase_doc if not token.is_punct and not token.is_space]
            
            if len(tokens) < 2:
                return 0.5
            
            # Check if tokens have vectors (only for models with word vectors)
            vector_tokens = [token for token in tokens if token.has_vector]
            
            if len(vector_tokens) < 2:
                # Fallback: use POS tag diversity as a proxy for coherence
                pos_tags = set(token.pos_ for token in tokens)
                return min(1.0, len(pos_tags) / 3.0)  # Normalize to 0-1
            
            # Calculate average similarity between words in the phrase
            similarities = []
            for i in range(len(vector_tokens)):
                for j in range(i + 1, len(vector_tokens)):
                    try:
                        similarity = vector_tokens[i].similarity(vector_tokens[j])
                        similarities.append(similarity)
                    except:
                        continue
            
            if similarities:
                return sum(similarities) / len(similarities)
            else:
                return 0.5
        except Exception as e:
            # Fallback calculation based on phrase structure
            words = str(phrase).split()
            if len(words) <= 1:
                return 0.3
            elif len(words) == 2:
                return 0.7
            else:
                return 0.6
    
    def _calculate_position_score(self, phrase: str) -> float:
        """Calculate score based on phrase position in text (earlier = higher score)."""
        phrase_lower = phrase.lower()
        first_occurrence = self.text.lower().find(phrase_lower)
        
        if first_occurrence == -1:
            return 0.0
        
        # Normalize position (0 to 1, where 0 is beginning)
        position_ratio = first_occurrence / len(self.text)
        
        # Higher score for phrases appearing earlier
        return 1.0 - position_ratio
    
    def _calculate_capitalization_score(self, phrase: str) -> float:
        """Calculate score based on capitalization patterns."""
        words = phrase.split()
        capitalized_words = sum(1 for word in words if word[0].isupper())
        
        if capitalized_words == len(words):
            return 1.0  # All words capitalized (likely proper nouns)
        elif capitalized_words > 0:
            return 0.7  # Some words capitalized
        else:
            return 0.3  # No capitalization
    
    def _classify_phrase_type(self, phrase: str) -> str:
        """Classify the type of phrase."""
        phrase_doc = nlp(phrase)
        pos_tags = [token.pos_ for token in phrase_doc if not token.is_punct]
        
        if any(pos in pos_tags for pos in ["PROPN"]):
            return "proper_noun"
        elif "VERB" in pos_tags:
            return "verb_phrase"
        elif all(pos in ["NOUN", "ADJ"] for pos in pos_tags):
            return "noun_phrase"
        elif "ADJ" in pos_tags:
            return "descriptive"
        else:
            return "general"
    
    def _classify_phrase_category(self, phrase: str) -> str:
        """Classify the semantic category of the phrase."""
        phrase_lower = phrase.lower()
        
        # Define category keywords
        categories = {
            "person": ["person", "people", "individual", "human", "man", "woman", "child"],
            "organization": ["company", "corporation", "organization", "business", "firm", "agency"],
            "location": ["place", "location", "city", "country", "region", "area", "site"],
            "technology": ["technology", "software", "system", "platform", "tool", "device"],
            "concept": ["concept", "idea", "theory", "principle", "method", "approach"],
            "action": ["action", "process", "activity", "operation", "function", "task"],
            "quality": ["quality", "characteristic", "feature", "attribute", "property"]
        }
        
        # Check for category matches
        for category, keywords in categories.items():
            if any(keyword in phrase_lower for keyword in keywords):
                return category
        
        # Use spaCy's entity recognition for additional categorization
        phrase_doc = nlp(phrase)
        for ent in phrase_doc.ents:
            if ent.label_ == "PERSON":
                return "person"
            elif ent.label_ in ["ORG", "COMPANY"]:
                return "organization"
            elif ent.label_ in ["GPE", "LOC"]:
                return "location"
            elif ent.label_ in ["PRODUCT", "WORK_OF_ART"]:
                return "product"
        
        return "general"

    def get_named_entities(self) -> Dict[str, List[str]]:
        """
        Enhanced named entity recognition with categorization using spaCy.
        """
        entities = {
            'PERSON': [], 'ORGANIZATION': [], 'LOCATION': [], 
            'DATE': [], 'TIME': [], 'MONEY': [], 'PERCENT': []
        }
        
        # Map spaCy entity labels to our categories
        label_mapping = {
            'PERSON': 'PERSON',
            'ORG': 'ORGANIZATION',
            'GPE': 'LOCATION',  # Geopolitical entity
            'LOC': 'LOCATION',
            'DATE': 'DATE',
            'TIME': 'TIME',
            'MONEY': 'MONEY',
            'PERCENT': 'PERCENT',
            'CARDINAL': 'PERCENT',  # Numbers can be percentages
        }
        
        for ent in self.doc.ents:
            entity_type = label_mapping.get(ent.label_)
            if entity_type and entity_type in entities:
                entities[entity_type].append(ent.text)
        
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
        
        # Use spaCy lemmatized tokens
        words = set(token.lemma_.lower() for token in self.doc 
                   if not token.is_stop and not token.is_punct and not token.is_space)
        
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
        Generate a summary using sentence scoring with spaCy lemmatization.
        """
        # Get lemmatized words and remove stopwords using spaCy
        lemmatized_words = [
            token.lemma_.lower()
            for token in self.doc
            if not token.is_stop and not token.is_punct and not token.is_space
        ]
        
        # Calculate word frequencies
        word_freq = Counter(lemmatized_words)
        
        # Score sentences based on word frequencies and position
        sentence_scores = {}
        for i, sent in enumerate(self.doc.sents):
            # Get lemmatized words in the sentence
            sentence_words = [
                token.lemma_.lower()
                for token in sent
                if not token.is_stop and not token.is_punct and not token.is_space
            ]
            
            # Calculate sentence score
            word_count = len(sentence_words)
            if word_count > 0:
                # Base score from word frequencies
                freq_score = sum(word_freq[word] for word in sentence_words) / word_count
                # Position score (favor earlier sentences)
                pos_score = 1.0 / (1 + i)
                # Length score (penalize very short or very long sentences)
                length_score = 1.0 if 5 <= word_count <= 25 else 0.5
                
                # Combine scores
                sentence_scores[sent.text.strip()] = (freq_score * 0.6 + pos_score * 0.3 + length_score * 0.1)
        
        # Get top sentences
        summary_sentences = sorted(
            sentence_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:num_sentences]
        
        # Sort sentences by their original order
        summary_sentences.sort(key=lambda x: self.sentences.index(x[0]))
        
        # Join sentences
        return ' '.join(sentence for sentence, score in summary_sentences)

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
    Enhanced main function to analyze text with professional insights.
    """
    analyzer = TextAnalyzer(text)
    
    sentiment_analysis = analyzer.get_sentiment_analysis()
    readability = analyzer.get_readability_metrics()
    key_phrases = analyzer.extract_key_phrases()
    named_entities = analyzer.get_named_entities()
    language_info = analyzer.get_language_info()
    content_category = analyzer.get_content_category()
    summary = analyzer.get_summary()
    
    return {
        # Sentiment Analysis fields
        "sentiment": sentiment_analysis["sentiment"],
        "polarity": sentiment_analysis["polarity"],
        "subjectivity": sentiment_analysis["subjectivity"],
        "sentiment_confidence": sentiment_analysis["confidence"],
        "tone": sentiment_analysis["tone"],
        "professional_metrics": sentiment_analysis["professional_metrics"],
        
        # Readability fields
        "flesch_score": readability["flesch_reading_ease"],
        "avg_sentence_length": readability["avg_sentence_length"],
        "word_count": readability["word_count"],
        "sentence_count": readability["sentence_count"],
        "syllable_count": readability["syllable_count"],
        "difficulty_level": readability["difficulty_level"],
        "professional_scores": readability["professional_scores"],
        "writing_improvements": readability["writing_improvements"],
        
        # Key Phrases and Entities
        "key_phrases": key_phrases,
        "named_entities": named_entities,
        
        # Language Info
        "language_code": language_info["language_code"],
        "language_confidence": language_info["confidence"],
        
        # Content Category
        "content_category": content_category["primary_category"],
        "category_confidence": content_category["confidence_score"],
        "category_distribution": content_category["category_distribution"],
        
        # Summary
        "summary": summary
    }
