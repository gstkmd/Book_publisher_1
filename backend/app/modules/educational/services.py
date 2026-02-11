from typing import List, Dict, Any
from app.modules.educational.models import Standard, LessonPlan

class StandardsService:
    async def ingest_standards_json(self, standards_data: List[Dict]) -> List[Standard]:
        """
        Ingest a list of standards from JSON format.
        Expected format: [{"code": "...", "description": "...", ...}]
        """
        created_standards = []
        for item in standards_data:
            # Check if exists to avoid duplicates
            existing = await Standard.find_one(Standard.code == item["code"])
            if not existing:
                standard = Standard(**item)
                await standard.create()
                created_standards.append(standard)
            else:
                # Optional: Update existing?
                pass
        return created_standards

    async def search_standards(self, query: str) -> List[Standard]:
        """
        Simple regex search for standards by code or description.
        """
        return await Standard.find({
            "$or": [
                {"code": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }).to_list()

class LessonPlanService:
    async def generate_plan(self, content: Any, standard: Standard) -> LessonPlan:
        """
        Generates a lesson plan for the given content and standard.
        """
        # Mock implementation
        plan = LessonPlan(
            title=f"Lesson Plan for {content.title}",
            content_id=str(content.id),
            standard_id=str(standard.id),
            plan_content=f"Generated lesson plan based on standard {standard.code}."
        )
        await plan.create()
        return plan

standards_service = StandardsService()
lesson_plan_service = LessonPlanService()
