from typing import List, Optional, Dict
from beanie import Document, Link
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    OPEN_ENDED = "open_ended"
    TRUE_FALSE = "true_false"

class Standard(Document):
    code: str # e.g., "CCSS.MATH.CONTENT.5.NF.A.1"
    description: str
    subject: str # Math, ELA, Science
    grade_level: str
    region: str = "US" # US, UK, IN
    
    class Settings:
        name = "standards"

class RubricCriteria(BaseModel):
    description: str
    points: int

class ScoringRubric(BaseModel):
    criteria: List[RubricCriteria]
    max_points: int

class Question(BaseModel):
    text: str
    options: List[str] = []
    correct_answer: Optional[Union[int, str]] = None # Index or text
    type: QuestionType = QuestionType.MULTIPLE_CHOICE
    bloom_level: Optional[str] = None # Remember, Understand, Apply...
    rubric: Optional[ScoringRubric] = None

class Assessment(Document):
    title: str
    description: Optional[str] = None
    questions: List[Question] = []
    aligned_standards: List[Link[Standard]] = []
    created_at: datetime = datetime.utcnow()
    is_published: bool = False

    class Settings:
        name = "assessments"
