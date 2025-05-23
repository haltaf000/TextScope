from nltk.sentiment import SentimentIntensityAnalyzer
import spacy

nlp = spacy.load("en_core_web_sm")
sia = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    return sia.polarity_scores(text)

def extract_entities(text):
    doc  = nlp(text)
    return [(ent.text, ent.label_) for ent in doc.ents]

def get_key_phrases(text, n=10):
    doc = nlp(text)
    return [chunk.text for chunk in doc.noun_chunks][:n]


