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
    assigner: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    stage: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    time_estimate: Optional[str] = None
    timer_start: Optional[datetime] = None
    track_time: Optional[int] = None
    attachments: Optional[List[Dict[str, str]]] = None
    links: Optional[List[Dict[str, str]]] = None
    custom_fields: Optional[Dict[str, str]] = None
    content_id: Optional[str] = None
    assignee: Optional[str] = None
    assigner: Optional[str] = None
    parent_task_id: Optional[str] = None

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
    description: Optional[str] = None
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

class ContentCreate(BaseModel):
    title: str
    slug: str
    body: Dict = {}
    type: str = "article"
    status: str = "draft"
    author: Optional[str] = None
    tags: Optional[List[str]] = []
    organization_id: Optional[str] = None
    custom_fields: Optional[Dict[str, str]] = {}
    attachments: Optional[List[Dict[str, str]]] = []

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    body: Optional[Dict] = None
    type: Optional[str] = None
    status: Optional[str] = None
    custom_fields: Optional[Dict[str, str]] = None
    attachments: Optional[List[Dict[str, str]]] = None
    organization_id: Optional[str] = None

class ContentSchema(BaseModel):
    id: str

    title: str
    slug: str
    body: Dict = {}
    cover_image: Optional[str] = None
    type: str = "article"
    status: str = "draft"
    author: str
    tags: List[str] = []
    organization_id: Optional[str] = None
    custom_fields: Dict[str, str] = {}
    attachments: Optional[List[Dict[str, str]]] = []
    created_at: datetime
    updated_at: datetime
    pending_reviewers: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class CommentSchema(BaseModel):
    id: str
    content_id: str
    text: str
    selection_range: Optional[Dict] = None
    resolved: bool
    author: str
    author_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActiveTaskStatus(BaseModel):
    active_count: int
    active_task_id: Optional[str] = None
    active_task_title: Optional[str] = None
    active_task_timer_start: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    server_time: datetime
