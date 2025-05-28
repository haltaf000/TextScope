# TextScope - Professional Text Analysis Platform

TextScope is a sophisticated text analysis platform that provides professional-grade insights into text content. Built with Python, FastAPI, and modern NLP technologies, it offers sentiment analysis, readability metrics, and professional writing improvements.

## 🚀 Features

- **Text Analysis**
  - Sentiment Analysis
  - Readability Metrics
  - Professional Writing Suggestions
  - Key Phrase Extraction
  - Named Entity Recognition

- **User Management**
  - Secure Authentication
  - Personal Analysis History
  - User-specific Data Storage

- **Modern Tech Stack**
  - FastAPI for high-performance API
  - SQLAlchemy for database operations
  - spaCy and TextBlob for NLP
  - Modern React-based UI

## 🛠️ Technical Architecture

- **Backend**: Python/FastAPI
- **Database**: PostgreSQL (SQLite for development)
- **NLP**: spaCy, TextBlob
- **Authentication**: JWT-based
- **Frontend**: React with Tailwind CSS

## 📋 Prerequisites

- Python 3.11+
- Node.js 16+
- PostgreSQL (optional, SQLite works for local development)

## 🚀 Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/textscope.git
   cd textscope
   ```

2. **Create and Activate Virtual Environment**
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

4. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=sqlite:///./textscope.db
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ENVIRONMENT=development
   MAX_CONTENT_LENGTH=10000
   LOG_LEVEL=INFO
   ```

5. **Initialize Database**
   ```bash
   # The tables will be created automatically on first run
   python src/main.py
   ```

6. **Run the Application**
   ```bash
   uvicorn src.main:app --reload
   ```

7. **Access the Application**
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Alternative API Docs: http://localhost:8000/redoc

## 🧪 Running Tests

```bash
pytest
```

## 📚 API Documentation

The API documentation is automatically generated and can be accessed at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

Key endpoints:
- `POST /token` - User authentication
- `POST /users/` - User registration
- `POST /analyze/` - Text analysis
- `GET /analyses/` - Get analysis history

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection through SQLAlchemy

## 💡 Project Structure

```
textscope/
├── src/
│   ├── main.py           # FastAPI application
│   ├── database.py       # Database configuration
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── security.py       # Authentication logic
│   └── text_preprocessor.py  # Text analysis logic
├── static/
│   └── js/              # Frontend JavaScript
├── templates/
│   └── index.html       # Main application template
├── tests/               # Test suite
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## 🤝 Contributing

This is a portfolio project, but I welcome feedback and suggestions! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Improvements

- [ ] Add more advanced NLP features
- [ ] Implement caching for better performance
- [ ] Add export functionality for analysis results
- [ ] Enhance test coverage
- [ ] Add more visualization options

## 👤 Author

Haider Altaf
- GitHub: [@haltaf000](https://github.com/haltaf000)

## 🙏 Acknowledgments

- FastAPI for the excellent framework
- spaCy and TextBlob for NLP capabilities
- The open-source community for inspiration and tools

