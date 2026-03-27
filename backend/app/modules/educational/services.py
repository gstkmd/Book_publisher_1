from typing import List, Dict, Any
from app.modules.educational.models import Standard, LessonPlan

class StandardsService:
    async def ingest_standards_json(self, standards_data: List[Dict]) -> List[Standard]:
        """
        Ingest a list of standards from JSON format.
        Expected format: [{"code": "...", "description": "...", "organization_id": "...", ...}]
        """
        created_standards = []
        for item in standards_data:
            org_id = item.get("organization_id")
            # Check if exists in this org to avoid duplicates
            existing = await Standard.find_one(
                Standard.code == item["code"],
                Standard.organization_id == org_id
            )
            if not existing:
                standard = Standard(**item)
                await standard.create()
                created_standards.append(standard)
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
        # Mock implementation - actual usage would involve AI generation
        plan = LessonPlan(
            title=f"Lesson Plan: {content.title}",
            content_id=str(content.id),
            standard_id=str(standard.id),
            plan_content={
                "objectives": [
                    f"Understanding the core concepts of {content.title}",
                    f"Aligning with standard {standard.code}: {standard.description[:30]}..."
                ],
                "activities": [
                    {"time": "0-10m", "description": "Introduction and Hook", "resource": "Whiteboard"},
                    {"time": "10-30m", "description": "Direct Instruction / Reading", "resource": "Digital Content"},
                    {"time": "30-45m", "description": "Collaborative Activity", "resource": "Worksheets"},
                    {"time": "45-60m", "description": "Assessment and Wrap-up", "resource": "Exit Ticket"}
                ],
                "assessment": "Students will complete a summary of the main points."
            },
            grade_level=standard.grade_level,
            subject=standard.subject,
            organization_id=content.organization_id # Inherit from content
        )
        await plan.create()
        return plan

standards_service = StandardsService()
lesson_plan_service = LessonPlanService()
