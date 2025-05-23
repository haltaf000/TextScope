from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
import json
import os
import sys
import nltk
from textblob import TextBlob

from . import models, schemas, security
from .database import get_db, engine
from .text_preprocessor import analyze_text

# Determine environment and set NLTK data path
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
if ENVIRONMENT == 'production':
    NLTK_DATA_PATH = '/opt/render/project/src/nltk_data'
else:
    # For local development, use the default NLTK data path
    NLTK_DATA_PATH = os.path.join(os.path.expanduser('~'), 'nltk_data')

# Initialize NLTK
nltk.data.path.append(NLTK_DATA_PATH)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TextScope", description="Professional Text Analysis Platform")

@app.on_event("startup")
async def startup_event():
    """Initialize NLTK data and verify availability."""
    try:
        # Ensure NLTK data directory exists
        os.makedirs(NLTK_DATA_PATH, exist_ok=True)
        
        # Download required NLTK data if not present
        required_packages = [
            'punkt', 'averaged_perceptron_tagger', 'maxent_ne_chunker',
            'words', 'stopwords', 'brown', 'wordnet'
        ]
        
        # First verify what's missing
        missing_packages = []
        for package in required_packages:
            try:
                if package == 'wordnet':
                    # Special verification for wordnet
                    nltk.data.find('corpora/wordnet.zip')
                    # Also verify essential wordnet files
                    for file in ['data.noun', 'index.noun']:
                        nltk.data.find(f'corpora/wordnet/{file}')
                else:
                    nltk.data.find(f'tokenizers/{package}' if package == 'punkt' 
                                else f'corpora/{package}' if package in ['brown', 'words', 'stopwords']
                                else f'taggers/{package}' if package == 'averaged_perceptron_tagger'
                                else f'chunkers/{package}' if package == 'maxent_ne_chunker'
                                else package)
            except LookupError:
                missing_packages.append(package)
        
        if missing_packages:
            print(f"Downloading missing NLTK packages: {missing_packages}")
            for package in missing_packages:
                try:
                    nltk.download(package, download_dir=NLTK_DATA_PATH, quiet=False)
                    # Verify the download was successful
                    if package == 'wordnet':
                        nltk.data.find('corpora/wordnet.zip')
                        for file in ['data.noun', 'index.noun']:
                            nltk.data.find(f'corpora/wordnet/{file}')
                    print(f"Successfully downloaded {package}")
                except Exception as e:
                    print(f"Failed to download {package}: {str(e)}")
                    raise RuntimeError(f"Failed to download required NLTK package {package}")
        
        # Test NLTK and TextBlob functionality
        test_text = "This is a test sentence for NLTK and TextBlob."
        # Test TextBlob
        blob = TextBlob(test_text)
        _ = blob.sentiment
        _ = blob.noun_phrases
        # Test NLTK specific functionality including WordNet
        tokens = nltk.word_tokenize(test_text)
        tags = nltk.pos_tag(tokens)
        entities = nltk.chunk.ne_chunk(tags)
        # Test WordNet specifically
        from nltk.corpus import wordnet
        synsets = wordnet.synsets('test')
        if not synsets:
            raise RuntimeError("WordNet is not working properly")
        
        print("NLTK and TextBlob initialization successful")
        print("NLTK data path:", nltk.data.path)
        
        # Only try to list directory if it exists
        if os.path.exists(NLTK_DATA_PATH):
            print("Available NLTK data:", os.listdir(NLTK_DATA_PATH))
        else:
            print(f"NLTK data directory not found at {NLTK_DATA_PATH}")
            
    except Exception as e:
        print(f"NLTK initialization error: {str(e)}")
        if ENVIRONMENT == 'development':
            print("Continuing anyway as we're in development mode...")
        else:
            raise RuntimeError(f"Failed to initialize NLTK: {str(e)}")

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
async def analyze_text_endpoint(
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

        # Verify NLTK data availability with special handling for WordNet
        required_data = [
            ('tokenizers/punkt', 'punkt'),
            ('taggers/averaged_perceptron_tagger', 'averaged_perceptron_tagger'),
            ('chunkers/maxent_ne_chunker', 'maxent_ne_chunker'),
            ('corpora/words', 'words'),
            ('corpora/stopwords', 'stopwords'),
            ('corpora/brown', 'brown'),
            ('corpora/wordnet', 'wordnet')
        ]
        
        missing_data = []
        for data_path, package_name in required_data:
            try:
                if package_name == 'wordnet':
                    # Special verification for wordnet
                    nltk.data.find('corpora/wordnet.zip')
                    # Also verify essential wordnet files
                    for file in ['data.noun', 'index.noun']:
                        nltk.data.find(f'corpora/wordnet/{file}')
                else:
                    nltk.data.find(data_path)
            except LookupError:
                missing_data.append(package_name)
        
        if missing_data:
            # Try to download missing data
            for package in missing_data:
                try:
                    nltk.download(package, download_dir=NLTK_DATA_PATH, quiet=True)
                    # Verify WordNet specifically after download
                    if package == 'wordnet':
                        nltk.data.find('corpora/wordnet.zip')
                        for file in ['data.noun', 'index.noun']:
                            nltk.data.find(f'corpora/wordnet/{file}')
                except Exception as e:
                    print(f"Failed to download {package}: {str(e)}")
            
            # Verify again after download attempt
            still_missing = []
            for data_path, package_name in required_data:
                try:
                    if package_name == 'wordnet':
                        nltk.data.find('corpora/wordnet.zip')
                        for file in ['data.noun', 'index.noun']:
                            nltk.data.find(f'corpora/wordnet/{file}')
                    else:
                        nltk.data.find(data_path)
                except LookupError:
                    still_missing.append(package_name)
            
            if still_missing:
                # Try one final time with user directory
                user_nltk_path = os.path.join(os.path.expanduser('~'), 'nltk_data')
                os.makedirs(user_nltk_path, exist_ok=True)
                for package in still_missing:
                    try:
                        nltk.download(package, download_dir=user_nltk_path, quiet=True)
                    except Exception:
                        pass
                
                # Final verification
                final_missing = []
                for data_path, package_name in required_data:
                    try:
                        if package_name == 'wordnet':
                            nltk.data.find('corpora/wordnet.zip')
                            for file in ['data.noun', 'index.noun']:
                                nltk.data.find(f'corpora/wordnet/{file}')
                        else:
                            nltk.data.find(data_path)
                    except LookupError:
                        final_missing.append(package_name)
                
                if final_missing:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={
                            "error": "NLTK data unavailable",
                            "message": "Required NLTK data is missing",
                            "missing_packages": final_missing,
                            "nltk_data_path": NLTK_DATA_PATH
                        }
                    )

        # Test WordNet functionality before proceeding
        try:
            from nltk.corpus import wordnet
            test_synsets = wordnet.synsets('test')
            if not test_synsets:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "error": "WordNet verification failed",
                        "message": "WordNet is not functioning properly",
                        "nltk_data_path": NLTK_DATA_PATH
                    }
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "WordNet error",
                    "message": str(e),
                    "nltk_data_path": NLTK_DATA_PATH
                }
            )

        # Perform analysis
        analysis_result = analyze_text(text_input.text)
        
        # Create database entry
        db_analysis = models.TextAnalysis(
            title=text_input.title,
            text=text_input.text,
            user_id=current_user.id,
            **{k: v for k, v in analysis_result.items() if k in [
                'sentiment', 'polarity', 'subjectivity', 'sentiment_confidence',
                'tone', 'professional_metrics', 'flesch_score', 'avg_sentence_length',
                'word_count', 'sentence_count', 'syllable_count', 'difficulty_level',
                'professional_scores', 'writing_improvements', 'key_phrases',
                'named_entities', 'language_code', 'language_confidence',
                'content_category', 'category_confidence', 'category_distribution',
                'summary'
            ]}
        )
        
        try:
            db.add(db_analysis)
            db.commit()
            db.refresh(db_analysis)
        except Exception as e:
            db.rollback()
            print(f"Database error: {str(e)}")
            # Continue without database storage
            return schemas.TextAnalysis(
                id=-1,  # Temporary ID for failed storage
                title=text_input.title,
                text=text_input.text,
                created_at=datetime.utcnow(),
                user_id=current_user.id,
                **analysis_result
            )
        
        return db_analysis
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "type": "analysis_error"
            }
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

@app.get("/health")
async def health_check():
    """Health check endpoint that verifies NLTK functionality."""
    try:
        # Test NLTK functionality
        test_text = "This is a test sentence."
        blob = TextBlob(test_text)
        _ = blob.sentiment
        _ = blob.noun_phrases
        
        # Check NLTK data availability
        available_data = []
        if os.path.exists(NLTK_DATA_PATH):
            available_data = os.listdir(NLTK_DATA_PATH)
        
        return {
            "status": "healthy",
            "environment": ENVIRONMENT,
            "nltk_data_path": NLTK_DATA_PATH,
            "available_nltk_data": available_data,
            "test_analysis": "success",
            "nltk_search_paths": nltk.data.path
        }
    except Exception as e:
        error_msg = str(e)
        if ENVIRONMENT == 'development':
            # In development, return more detailed error information
            return {
                "status": "warning",
                "environment": "development",
                "message": "Service running in development mode with warnings",
                "error": error_msg,
                "nltk_data_path": NLTK_DATA_PATH,
                "nltk_search_paths": nltk.data.path
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service unhealthy: {error_msg}"
            )
