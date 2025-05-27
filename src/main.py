from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
import json
import os
import sys
import logging
import spacy
from textblob import TextBlob

from . import models, schemas, security
from .database import get_db, engine, check_database_health
from .text_preprocessor import analyze_text

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Determine environment
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'

# Initialize Sentry for production error tracking
if IS_PRODUCTION:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=os.getenv('SENTRY_DSN'),  # Set this in Render environment variables if you want error tracking
            integrations=[
                FastApiIntegration(auto_enabling_integrations=False),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,
            environment=ENVIRONMENT,
        )
        logger.info("Sentry initialized for error tracking")
    except ImportError:
        logger.warning("Sentry not available, skipping error tracking setup")

# Create database tables
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    if IS_PRODUCTION:
        raise

# Initialize FastAPI app
app = FastAPI(
    title="TextScope",
    description="Professional Text Analysis Platform",
    version="1.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,  # Disable docs in production
    redoc_url="/redoc" if not IS_PRODUCTION else None,
)

# CORS configuration
allowed_origins = os.getenv('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security middleware for production
if IS_PRODUCTION:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.onrender.com", "textscope.onrender.com"]  # Update with your actual domain
    )

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    if IS_PRODUCTION:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

@app.on_event("startup")
async def startup_event():
    """Initialize spaCy model and verify availability."""
    logger.info(f"Starting TextScope application in {ENVIRONMENT} mode")
    
    try:
        # Test database connection
        if not check_database_health():
            logger.error("Database health check failed")
            if IS_PRODUCTION:
                raise RuntimeError("Database connection failed")
        else:
            logger.info("Database connection verified")
        
        # Test spaCy model loading
        try:
            nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model 'en_core_web_sm' loaded successfully")
        except OSError:
            error_msg = (
                "spaCy English model 'en_core_web_sm' not found. "
                "Please install it using: python -m spacy download en_core_web_sm"
            )
            logger.error(f"spaCy model error: {error_msg}")
            if IS_PRODUCTION:
                raise RuntimeError(error_msg)
            else:
                logger.warning("Continuing anyway as we're in development mode...")
                return
        
        # Test spaCy and TextBlob functionality
        test_text = "This is a test sentence for spaCy and TextBlob."
        
        # Test TextBlob
        blob = TextBlob(test_text)
        _ = blob.sentiment
        _ = blob.noun_phrases
        
        # Test spaCy functionality
        doc = nlp(test_text)
        _ = [token.text for token in doc]
        _ = [sent.text for sent in doc.sents]
        _ = [ent.text for ent in doc.ents]
        _ = [chunk.text for chunk in doc.noun_chunks]
        
        logger.info("spaCy and TextBlob initialization successful")
        logger.info(f"spaCy model info: {nlp.meta['name']} v{nlp.meta['version']}")
            
    except Exception as e:
        logger.error(f"Startup initialization error: {str(e)}")
        if IS_PRODUCTION:
            raise RuntimeError(f"Failed to initialize application: {str(e)}")
        else:
            logger.warning("Continuing anyway as we're in development mode...")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down TextScope application")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(models.User).filter(models.User.username == form_data.username).first()
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Failed login attempt for username: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        logger.info(f"Successful login for user: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Check for existing email
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check for existing username
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Create new user
        hashed_password = security.get_password_hash(user.password)
        db_user = models.User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"New user created: {user.username}")
        return db_user
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User creation error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during user creation"
        )

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
        
        max_length = int(os.getenv('MAX_CONTENT_LENGTH', 10000))
        if len(text_input.text) > max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Text exceeds maximum length of {max_length} characters"
            )

        # Verify spaCy model availability
        try:
            nlp = spacy.load("en_core_web_sm")
            # Test basic functionality
            test_doc = nlp("Test sentence")
            _ = [token.text for token in test_doc]
        except OSError:
            logger.error("spaCy model not available")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "spaCy model unavailable",
                    "message": "spaCy English model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm"
                }
            )
        except Exception as e:
            logger.error(f"spaCy error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "spaCy error",
                    "message": str(e)
                }
            )

        # Perform analysis
        logger.info(f"Starting text analysis for user: {current_user.username}")
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
            logger.info(f"Analysis saved to database with ID: {db_analysis.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Database error: {str(e)}")
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
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during text analysis"
        )

@app.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    try:
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
        
        logger.info(f"Analysis {analysis_id} deleted by user: {current_user.username}")
        return {"message": "Analysis deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis {analysis_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting analysis"
        )

@app.get("/analyses/{analysis_id}", response_model=schemas.TextAnalysis)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Get a specific analysis by ID.
    """
    try:
        analysis = db.query(models.TextAnalysis).filter(
            models.TextAnalysis.id == analysis_id,
            models.TextAnalysis.user_id == current_user.id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found or you don't have permission to access it"
            )
        
        logger.info(f"Retrieved analysis {analysis_id} for user: {current_user.username}")
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching analysis"
        )

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
        
        logger.info(f"Retrieved {len(analyses)} analyses for user: {current_user.username}")
        return analyses
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while fetching analyses"
        )

# Frontend routes
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health")
async def health_check():
    """
    Enhanced health check endpoint for production monitoring.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "services": {}
    }
    
    # Test database connection
    try:
        db_healthy = check_database_health()
        health_status["services"]["database"] = "healthy" if db_healthy else "unhealthy"
    except Exception as e:
        health_status["services"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Test spaCy model
    try:
        nlp = spacy.load("en_core_web_sm")
        test_doc = nlp("Health check test")
        _ = [token.text for token in test_doc]
        health_status["services"]["spacy"] = "healthy"
        health_status["spacy_model"] = nlp.meta['name']
        health_status["spacy_version"] = nlp.meta['version']
    except Exception as e:
        health_status["services"]["spacy"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Test TextBlob
    try:
        blob = TextBlob("Health check test")
        _ = blob.sentiment
        health_status["services"]["textblob"] = "healthy"
    except Exception as e:
        health_status["services"]["textblob"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Set overall status
    if any("error" in str(service) for service in health_status["services"].values()):
        health_status["status"] = "degraded"
    
    # Return appropriate HTTP status code based on health
    if health_status["status"] == "healthy":
        return health_status
    elif health_status["status"] == "degraded" and not IS_PRODUCTION:
        # In development, return degraded status but still 200
        return health_status
    else:
        # In production, return 503 for degraded services
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
