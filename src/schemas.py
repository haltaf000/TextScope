from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Union, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class TextAnalysisBase(BaseModel):
    title: str
    text: str

class TextAnalysisCreate(TextAnalysisBase):
    pass

class SentimentAnalysis(BaseModel):
    sentiment: str
    polarity: float
    subjectivity: float
    confidence: float

class ReadabilityMetrics(BaseModel):
    flesch_score: float
    avg_sentence_length: float
    word_count: int
    sentence_count: int
    syllable_count: int
    difficulty_level: str

class KeyPhrase(BaseModel):
    phrase: str
    relevance_score: float
    frequency: int

class LanguageInfo(BaseModel):
    language_code: str
    language_confidence: str
    is_english: Optional[bool]

class ContentCategory(BaseModel):
    primary_category: str
    confidence_score: float
    category_distribution: Dict[str, float]

class TextAnalysis(TextAnalysisBase):
    id: int
    created_at: datetime
    user_id: int

    # Sentiment Analysis
    sentiment: str
    polarity: float
    subjectivity: float
    sentiment_confidence: float
    tone: str
    professional_metrics: Dict[str, Any]

    # Readability Metrics
    flesch_score: float
    avg_sentence_length: float
    word_count: int
    sentence_count: int
    syllable_count: int
    difficulty_level: str
    professional_scores: Dict[str, float]
    writing_improvements: List[str]

    # Key Phrases and Entities
    key_phrases: List[Dict[str, Any]]
    named_entities: Dict[str, List[str]]

    # Language and Category
    language_code: str
    language_confidence: str
    content_category: str
    category_confidence: float
    category_distribution: Dict[str, float]

    # Summary
    summary: str
    class Config:
        orm_mode = True

