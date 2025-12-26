from pydantic import BaseModel
from typing import Dict, Any, List, Optional

# --- Request ---
class TokenRequest(BaseModel):
    token: str

# --- Response Components ---
class ClaimExplanation(BaseModel):
    key: str
    value: Any
    description: str

class AnalysisResult(BaseModel):
    header_explanation: str
    claims_explanation: List[ClaimExplanation]
    status: str
    risk_warnings: List[str]

# --- Main Response ---
class TokenResponse(BaseModel):
    success: bool
    header: Dict[str, Any]
    payload: Dict[str, Any]
    signature: Optional[str] = None
    analysis: AnalysisResult
    error: Optional[str] = None

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class SourceInfo(BaseModel):
    """Source information with content preview for accurate attribution."""
    url: str
    name: str
    type: str
    section: str = ""
    section_id: str = ""
    priority: str = "medium"

class ContextSource(BaseModel):
    """Enhanced context with source tracking and previews."""
    content: str
    content_preview: str
    source: SourceInfo
    similarity_score: float

# --- Ask Request ---
class AskRequest(BaseModel):
    token: str
    question: str
    history: List[ChatMessage] = []

class AskResponse(BaseModel):
    answer: str
    context_used: List[str] = []  # Deprecated: kept for backward compatibility
    sources: List[ContextSource] = []  # New: Enhanced source information with previews

# --- Generator Request ---
class GenerateRequest(BaseModel):
    payload: Dict[str, Any]
    secret: str
    algorithm: str = "HS256" # Default to common symmetric algorithm
    expires_in_minutes: Optional[int] = 60 # Default 1 hour


# --- Generator Response ---
class GenerateResponse(BaseModel):
    token: str
    success: bool
    error: Optional[str] = None