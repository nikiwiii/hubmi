import math
import logging
import re
import unicodedata
from typing import List, Optional, Set, Tuple
import numpy as np

logger = logging.getLogger("hubmi.embeddings")

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Ładowanie modelu embeddingów all-MiniLM-L6-v2...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Model all-MiniLM-L6-v2 załadowany pomyślnie.")
        except Exception as e:
            logger.warning(f"Nie udało się załadować SentenceTransformer: {e}. Zastosowany fallback.")
            _model = None
    return _model

def strip_accents(text: str) -> str:
    """Usuwa polskie znaki diakrytyczne dla lepszego dopasowania elastycznego."""
    text = text.replace('ł', 'l').replace('Ł', 'L')
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

def extract_meaningful_tokens(text: str) -> Set[str]:
    """Ekstrahuje rdzenie słów kluczowych w języku polskim."""
    stopwords = {
        "dla", "oraz", "jest", "tego", "jaki", "jakis", "tam", "przez", "przy", 
        "ktore", "ktory", "beda", "szukam", "znajdz", "jak", "sie", "nie", "lub",
        "czy", "pod", "nad", "ze", "za", "do", "od", "na", "po", "ze", "we"
    }
    clean = strip_accents(text)
    words = re.findall(r"\b[a-z]{3,}\b", clean)
    stems = set()
    for w in words:
        if w not in stopwords:
            stem = re.sub(r"(ami|ach|owi|aniem|anie|ania|ani|em|om|ego|emu|ych|ie|ej|ym|am|y|a|e|u|i|o)$", "", w)
            stems.add(stem if len(stem) >= 3 else w)
    return stems

def compute_lexical_overlap(query: str, doc_text: str) -> Tuple[float, Set[str]]:
    """Oblicza pokrycie leksykalne zapytania w tekście dokumentu."""
    q_tokens = extract_meaningful_tokens(query)
    if not q_tokens:
        return 0.0, set()
    doc_tokens = extract_meaningful_tokens(doc_text)
    overlap = q_tokens.intersection(doc_tokens)
    score = len(overlap) / len(q_tokens)
    return score, overlap

def compute_embedding(text: str) -> List[float]:
    """Generuje wektor embeddingu (384-wymiarowy) dla podanego tekstu."""
    if not text or not text.strip():
        return [0.0] * 384

    model = get_embedding_model()
    if model is not None:
        try:
            vec = model.encode(text, normalize_embeddings=True)
            return vec.tolist()
        except Exception as e:
            logger.error(f"Błąd podczas generowania embeddingu: {e}")

    # Fallback deterministyczny hash-vectorizer
    words = text.lower().split()
    vec = np.zeros(384, dtype=float)
    for i, word in enumerate(words):
        idx = hash(word) % 384
        vec[idx] += 1.0 / (1.0 + i * 0.1)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Oblicza podobieństwo cosinusowe pomiędzy dwoma wektorami."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.array(v1, dtype=float)
    b = np.array(v2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    dot = float(np.dot(a, b))
    return max(0.0, min(1.0, dot))
