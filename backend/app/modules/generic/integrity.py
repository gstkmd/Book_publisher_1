import random
from typing import List, Optional, Dict
from pydantic import BaseModel

class PlagiarismMatch(BaseModel):
    url: str
    title: str
    percentage: float
    matched_text: str

class IntegrityReport(BaseModel):
    ai_score: Optional[float] = None
    plagiarism_matches: Optional[List[PlagiarismMatch]] = None
    summary: str

class IntegrityProvider:
    """
    Service to handle AI and Copyright/Plagiarism checks.
    In a real-world scenario, this would call APIs like Copyleaks, GPTZero, or Turnitin.
    """
    
    async def check_ai(self, text: str) -> float:
        """
        Simulate AI detection. Returns a probability score between 0 and 1.
        """
        # In mock mode, we trigger high scores if "AI" or "GPT" is in the text
        if "gpt" in text.lower() or "llm" in text.lower():
            return round(random.uniform(0.8, 0.99), 2)
        return round(random.uniform(0.01, 0.15), 2)

    async def check_copyright(self, text: str) -> List[PlagiarismMatch]:
        """
        Simulate Plagiarism/Copyright detection.
        """
        # Mocking some matches if the text is long enough
        if len(text) > 50:
            return [
                PlagiarismMatch(
                    url="https://en.wikipedia.org/wiki/Generic_Text",
                    title="Wikipedia: Generic Text",
                    percentage=45.5,
                    matched_text=text[:30] + "..."
                )
            ]
        return []

    async def generate_report(self, text: str, check_ai: bool = True, check_copyright: bool = True) -> IntegrityReport:
        ai_score = None
        matches = None
        
        if check_ai:
            ai_score = await self.check_ai(text)
        
        if check_copyright:
            matches = await self.check_copyright(text)
            
        summary_parts = []
        if ai_score is not None:
            summary_parts.append(f"AI Probability: {ai_score * 100}%")
        if matches is not None:
            summary_parts.append(f"Plagiarism Matches: {len(matches)}")
            
        return IntegrityReport(
            ai_score=ai_score,
            plagiarism_matches=matches,
            summary=" | ".join(summary_parts) if summary_parts else "No checks performed"
        )

integrity_provider = IntegrityProvider()
