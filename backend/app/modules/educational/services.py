from typing import List, Dict
from app.modules.educational.models import Standard

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

standards_service = StandardsService()
