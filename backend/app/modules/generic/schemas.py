from typing import Optional, List, Dict
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
    timer_start: Optional[datetime] = None
    track_time: Optional[int] = 0
    attachments: Optional[list[dict[str, str]]] = []
    links: Optional[list[dict[str, str]]] = []
    custom_fields: Optional[dict[str, str]] = {}
    parent_task_id: Optional[str] = None

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
    parent_task_id: Optional[str] = None
    total_time: Optional[int] = 0
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

class ActivityLogSchema(BaseModel):
    id: str
    resource_type: str
    resource_id: str
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationSchema(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    link: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContentSchema(BaseModel):
    id: str
    _id: Optional[str] = None
    title: str
    slug: str
    body: Dict = {}
    cover_image: Optional[str] = None
    type: str = "article"
    status: str = "draft"
    author: str
    tags: List[str] = []
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    pending_reviewers: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
