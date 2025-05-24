from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    analyses = relationship("TextAnalysis", back_populates="user")

class TextAnalysis(Base):
    __tablename__ = "text_analyses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Sentiment Analysis
    sentiment = Column(String)
    polarity = Column(Float)
    subjectivity = Column(Float)
    sentiment_confidence = Column(Float)
    tone = Column(String)
    professional_metrics = Column(JSON)

    # Readability Metrics
    flesch_score = Column(Float)
    avg_sentence_length = Column(Float)
    word_count = Column(Integer)
    sentence_count = Column(Integer)
    syllable_count = Column(Integer)
    difficulty_level = Column(String)
    professional_scores = Column(JSON)
    writing_improvements = Column(JSON)

    # Key Phrases and Entities
    key_phrases = Column(JSON)
    named_entities = Column(JSON)

    # Language and Category
    language_code = Column(String)
    language_confidence = Column(String)
    content_category = Column(String)
    category_confidence = Column(Float)
    category_distribution = Column(JSON)

    # Summary
    summary = Column(Text)

    # Relationships
    user = relationship("User", back_populates="analyses")
