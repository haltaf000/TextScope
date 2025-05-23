# TextScope - Professional Text Analysis Platform

TextScope is a modern web application that provides advanced text analysis capabilities using Natural Language Processing (NLP). It offers features like sentiment analysis, entity recognition, key phrase extraction, and more.

## Features

- User authentication and authorization
- Text analysis with multiple options:
  - Sentiment analysis
  - Named entity recognition
  - Key phrase extraction
  - Word and sentence statistics
- File upload support
- Analysis history
- Export functionality
- Modern, responsive UI

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/textscope.git
cd textscope
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
.\.venv\Scripts\Activate  
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./textscope.db
```

5. Run the application:
```bash
uvicorn src.main:app --reload
```

The application will be available at `http://localhost:8000`

## API Documentation

Once the application is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
textscope/
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── database.py       # Database configuration
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── security.py       # Authentication
│   └── nlp.py           # Text analysis with NLTK
├── static/
│   ├── styles.css
│   └── app.js
├── templates/
│   └── index.html
├── requirements.txt
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

