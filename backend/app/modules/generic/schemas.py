from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    stage: str = "To Do"
    tags: Optional[list[str]] = []
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    time_estimate: Optional[str] = None
    track_time: Optional[int] = 0
    custom_fields: Optional[dict[str, str]] = {}

class TaskCreate(TaskBase):
    content_id: Optional[str] = None
    assignee: Optional[str] = None

class TaskSchema(TaskBase):
    id: str
    content_id: Optional[str] = None
    assignee: Optional[str] = None
    assignee_name: Optional[str] = None
    assigner: Optional[str] = None
    assigner_name: Optional[str] = None
    created_by: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TaskCommentBase(BaseModel):
    task_id: str
    text: str

class TaskCommentCreate(TaskCommentBase):
    pass

class TaskCommentSchema(TaskCommentBase):
    id: str
    author: str
    author_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    model_config = ConfigDict(from_attributes=True)
