from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import json
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import models, schemas, security
from .database import get_db, engine
from .text_preprocessor import analyze_text

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="TextScope", description="Professional Text Analysis Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user)
):
    return current_user

# Text analysis endpoints
@app.post("/analyze/", response_model=schemas.TextAnalysis)
@limiter.limit("20/minute")  # Allow 20 analyses per minute
async def analyze_text_endpoint(
    request: Request,
    text_input: schemas.TextAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    try:
        # Validate input
        if not text_input.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty"
            )
        
        if len(text_input.text) > 10000:  # Limit text length
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text exceeds maximum length of 10,000 characters"
            )

        # Check if analysis with same text already exists for this user
        existing_analysis = db.query(models.TextAnalysis).filter(
            models.TextAnalysis.user_id == current_user.id,
            models.TextAnalysis.text == text_input.text
        ).first()
        
        if existing_analysis:
            return existing_analysis

        # Perform analysis with detailed error handling
        try:
            analysis_result = analyze_text(text_input.text)
        except Exception as analysis_error:
            print(f"Text analysis failed: {str(analysis_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Text analysis failed: {str(analysis_error)}"
            )

        # Create database entry
        try:
            db_analysis = models.TextAnalysis(
                title=text_input.title,
                text=text_input.text,
                user_id=current_user.id,
                
                # Sentiment Analysis
                sentiment=analysis_result["sentiment_analysis"]["sentiment"],
                polarity=analysis_result["sentiment_analysis"]["polarity"],
                subjectivity=analysis_result["sentiment_analysis"]["subjectivity"],
                sentiment_confidence=analysis_result["sentiment_analysis"]["confidence"],
                tone=analysis_result["sentiment_analysis"]["tone"],
                professional_metrics=analysis_result["sentiment_analysis"]["professional_metrics"],
                
                # Readability Metrics
                flesch_score=analysis_result["readability"]["flesch_reading_ease"],
                avg_sentence_length=analysis_result["readability"]["avg_sentence_length"],
                word_count=analysis_result["readability"]["word_count"],
                sentence_count=analysis_result["readability"]["sentence_count"],
                syllable_count=analysis_result["readability"]["syllable_count"],
                difficulty_level=analysis_result["readability"]["difficulty_level"],
                professional_scores=analysis_result["readability"]["professional_scores"],
                writing_improvements=analysis_result["readability"]["writing_improvements"],
                
                # Key Phrases and Entities
                key_phrases=analysis_result["key_phrases"],
                named_entities=analysis_result["named_entities"],
                
                # Language and Category
                language_code=analysis_result["language_info"]["language_code"],
                language_confidence=analysis_result["language_info"]["confidence"],
                content_category=analysis_result["content_category"]["primary_category"],
                category_confidence=analysis_result["content_category"]["confidence_score"],
                category_distribution=analysis_result["content_category"]["category_distribution"],
                
                # Summary
                summary=analysis_result["summary"]
            )
            
            db.add(db_analysis)
            db.commit()
            db.refresh(db_analysis)
            
            return db_analysis
            
        except Exception as db_error:
            db.rollback()
            print(f"Database operation failed: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save analysis results: {str(db_error)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Unexpected error in analyze_text_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    analysis = db.query(models.TextAnalysis).filter(
        models.TextAnalysis.id == analysis_id,
        models.TextAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found or you don't have permission to delete it"
        )
    
    db.delete(analysis)
    db.commit()
    return {"message": "Analysis deleted successfully"}

@app.get("/analyses/", response_model=List[schemas.TextAnalysis])
async def get_analyses(
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Get user's analyses with enhanced sorting and filtering.
    """
    try:
        # Validate sort parameters
        valid_sort_fields = ["created_at", "title", "sentiment", "difficulty_level", "word_count"]
        if sort_by not in valid_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}"
            )
        
        if sort_order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sort order must be 'asc' or 'desc'"
            )
        
        # Build query
        query = db.query(models.TextAnalysis).filter(
            models.TextAnalysis.user_id == current_user.id
        )
        
        # Apply sorting
        sort_column = getattr(models.TextAnalysis, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        analyses = query.offset(skip).limit(limit).all()
        
        return analyses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analyses: {str(e)}"
        )

# Frontend routes
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
