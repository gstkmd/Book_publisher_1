from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Depends, Body
from beanie import Link, PydanticObjectId
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
from bson import ObjectId, DBRef
from app.core.time_utils import get_ist_now, ensure_ist
from app.modules.generic.models import Content, ContentVersion, Comment, Task, TaskComment, ActivityLog, Notification
from app.modules.core.models import User
from app.api.deps import get_current_user, get_current_active_superuser
from app.modules.generic.schemas import ContentSchema, CommentSchema
from app.modules.generic.websockets import manager
from app.core.storage import s3_client

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to object storage.
    """
    url = await s3_client.upload_file(file)
    return {"url": url}

class MultipartInit(BaseModel):
    file_name: str
    content_type: str

class MultipartPart(BaseModel):
    upload_id: str
    file_name: str
    part_number: int

class MultipartComplete(BaseModel):
    upload_id: str
    file_name: str
    parts: List[dict] # [{ETag, PartNumber}]

@router.post("/upload/multipart/init")
async def init_multipart(data: MultipartInit):
    upload_id = s3_client.create_multipart_upload(data.file_name, data.content_type)
    return {"uploadId": upload_id, "fileName": data.file_name}

@router.post("/upload/multipart/part")
async def upload_part(
    upload_id: str = Form(...),
    file_name: str = Form(...),
    part_number: int = Form(...),
    file: UploadFile = File(...)
):
    content = await file.read()
    etag = s3_client.upload_part(file_name, upload_id, part_number, content)
    return {"ETag": etag}

@router.post("/upload/multipart/complete")
async def complete_multipart(data: MultipartComplete):
    url = s3_client.complete_multipart_upload(data.file_name, data.upload_id, data.parts)
    return {"url": url}

@router.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str):
    await manager.connect(websocket, document_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast the received change to other users editing the same document
            await manager.broadcast(f"User wrote: {data}", document_id, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, document_id)
        await manager.broadcast("User left the chat", document_id)

@router.get("/content", response_model=List[ContentSchema])
async def read_contents(current_user: User = Depends(get_current_user)):
    """
    Get all content items for the current user's organization.
    Includes active reviewers info for 'Review' status highlighting.
    """
    contents = await Content.find(Content.organization_id == current_user.organization_id).to_list()
    
    results = []
    for content in contents:
        # Find pending tasks for this content
        pending_tasks = await Task.find(
            Task.content_id.id == content.id,
            Task.status != "completed",
            Task.stage != "Done"
        ).to_list()
        
        reviewers = []
        for task in pending_tasks:
            if task.assignee:
                # Resolve assignee ID from Link
                assignee_id = task.assignee.ref.id
                u = await User.get(assignee_id)
                if u:
                    reviewers.append(u.full_name)
        
        c_dict = content.dict()
        c_dict["id"] = str(content.id)
        c_dict["_id"] = str(content.id)
        # Manually serialize Link field to string ID to avoid DBRef error
        if content.author and hasattr(content.author, "ref"):
            c_dict["author"] = str(content.author.ref.id)
        
        c_dict["pending_reviewers"] = reviewers
        results.append(c_dict)
        
    return results


@router.post("/migrate-orphans")
async def migrate_orphans(current_user: User = Depends(get_current_active_superuser)):
    """
    One-time migration to assign orphaned content to the user's organization.
    Restricted to Admins.
    """
    # Find content with no organization_id
    orphaned_content = await Content.find(Content.organization_id == None).to_list()
    
    count = 0
    for content in orphaned_content:
        content.organization_id = current_user.organization_id
        await content.save()
        count += 1
        
    return {"message": f"Successfully migrated {count} orphaned content items to organization {current_user.organization_id}"}

@router.get("/content/{id}", response_model=ContentSchema)
async def get_content(id: PydanticObjectId):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Manually prepare dict to avoid DBRef serialization issues
    c_dict = content.dict()
    c_dict["id"] = str(content.id)
    c_dict["_id"] = str(content.id)
    if content.author and hasattr(content.author, "ref"):
        c_dict["author"] = str(content.author.ref.id)
    
    return c_dict


@router.post("/content", response_model=ContentSchema)
async def create_content(content: Content, current_user: User = Depends(get_current_user)):
    content.organization_id = current_user.organization_id
    await content.create()
    # Create initial version
    version = ContentVersion(
        content_id=content.id,
        version_number=1,
        title=content.title,
        body=content.body,
        created_by=content.author
    )
    await version.create()

    # Trigger Webhook
    from app.modules.core.services import webhook_service
    await webhook_service.dispatch_event("content.created", content.dict(), organization_id=content.organization_id)

    c_dict = content.dict()
    c_dict["id"] = str(content.id)
    c_dict["_id"] = str(content.id)
    if content.author and hasattr(content.author, "ref"):
        c_dict["author"] = str(content.author.ref.id)
    return c_dict

@router.put("/content/{id}", response_model=ContentSchema)
async def update_content(id: PydanticObjectId, content_in: Content):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Update fields
    content.title = content_in.title
    content.slug = content_in.slug
    content.body = content_in.body
    content.type = content_in.type
    content.status = content_in.status
    if content_in.organization_id:
        content.organization_id = content_in.organization_id
    content.updated_at = get_ist_now()
    await content.save()

    # Create new version
    count = await ContentVersion.find(ContentVersion.content_id.id == content.id).count()
    version = ContentVersion(
        content_id=content.id,
        version_number=count + 1,
        title=content.title,
        body=content.body,
        created_by=content.author
    )
    await version.create()

    # Trigger Webhook
    from app.modules.core.services import webhook_service
    await webhook_service.dispatch_event("content.updated", content.dict(), organization_id=content.organization_id)

    c_dict = content.dict()
    c_dict["id"] = str(content.id)
    c_dict["_id"] = str(content.id)
    if content.author and hasattr(content.author, "ref"):
        c_dict["author"] = str(content.author.ref.id)
    return c_dict

@router.delete("/content/{id}")
async def delete_content(id: PydanticObjectId):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    await content.delete()
    return {"message": "Content deleted successfully"}

@router.get("/content/{id}/versions", response_model=List[ContentVersion])
async def get_content_versions(id: PydanticObjectId):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return await ContentVersion.find(ContentVersion.content_id.id == content.id).sort(-ContentVersion.version_number).to_list()

@router.post("/content/{id}/restore/{version_id}")
async def restore_version(id: PydanticObjectId, version_id: PydanticObjectId):
    content = await Content.get(id)
    version = await ContentVersion.get(version_id)
    if not content or not version:
         raise HTTPException(status_code=404, detail="Content or Version not found")
    
    content.title = version.title
    content.body = version.body
    content.updated_at = get_ist_now()
    await content.save()
    
    # Create a restoration version? Optional but good practice.
    return {"message": f"Restored to version {version.version_number}"}

@router.patch("/content/{id}/status", response_model=ContentSchema)
async def update_content_status(
    id: PydanticObjectId, 
    status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Update only the status of a content item"""
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    content.status = status
    content.updated_at = get_ist_now()
    await content.save()
    
    # Create new version to track the status change
    count = await ContentVersion.find(ContentVersion.content_id.id == content.id).count()
    version = ContentVersion(
        content_id=content.id,
        version_number=count + 1,
        title=content.title,
        body=content.body,
        created_by=content.author
    )
    await version.create()
    
    c_dict = content.dict()
    c_dict["id"] = str(content.id)
    c_dict["_id"] = str(content.id)
    if content.author and hasattr(content.author, "ref"):
        c_dict["author"] = str(content.author.ref.id)
    return c_dict

@router.get("/workflow/stats")
async def get_workflow_stats(current_user: User = Depends(get_current_user)):
    """Get counts of content by status for the current organization"""
    from app.modules.generic.models import Content
    
    # Use aggregation for efficiency and reliability
    pipeline = [
        {"$match": {"organization_id": current_user.organization_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    
    cursor = Content.get_motor_collection().aggregate(pipeline)
    
    stats = {
        "draft": 0,
        "review": 0,
        "approved": 0,
        "published": 0
    }
    
    async for doc in cursor:
        status_val = doc["_id"]
        # Handle case-insensitive status and map to our keys
        if status_val:
            s_lower = status_val.lower()
            if s_lower in stats:
                stats[s_lower] += doc["count"]
    
    return stats

# --- Comments ---

class CreateCommentRequest(BaseModel):
    content_id: str
    text: str
    author: str
    selection_range: Optional[Dict] = None
    resolved: bool = False

@router.post("/comments")
async def create_comment(req: CreateCommentRequest):
    """Create comment with proper Link references"""
    
    comment = Comment(
        content_id=Link(ref=DBRef(collection="content", id=ObjectId(req.content_id)), document_class=Content),
        text=req.text,
        author=Link(ref=DBRef(collection="users", id=ObjectId(req.author)), document_class=User),
        selection_range=req.selection_range,
        resolved=req.resolved
    )
    await comment.create()
    
    # Broadcast comment - use ref.id to get the ObjectId from Link
    if comment.content_id:
         await manager.broadcast(f"New Comment: {comment.text}", str(comment.content_id.ref.id))

    return comment

@router.get("/content/{id}/comments", response_model=List[CommentSchema])
async def get_content_comments(id: PydanticObjectId):
    """Fetch comments for content with reliable filtering"""
    try:
        # Use Beanie's native filtering which is optimized for Link fields
        comments = await Comment.find(Comment.content_id.id == id).to_list()
        
        results = []
        for comment in comments:
            author_name = "Unknown"
            author_id = str(comment.author.ref.id) if comment.author and hasattr(comment.author, 'ref') else str(comment.author)
            
            if comment.author:
                u = await User.get(get_link_id(comment.author))
                if u: 
                    author_name = u.full_name
            
            results.append(CommentSchema(
                id=str(comment.id),
                content_id=str(comment.content_id.ref.id) if comment.content_id and hasattr(comment.content_id, 'ref') else str(comment.content_id),
                text=comment.text,
                selection_range=comment.selection_range,
                resolved=comment.resolved,
                author=author_id,
                author_name=author_name,
                created_at=ensure_ist(comment.created_at)
            ))
            
        return results
    except Exception as e:
        print(f"DEBUG: Error fetching comments for {id}: {e}")
        return []

@router.patch("/comments/{id}/resolve")
async def toggle_comment_resolution(
    id: PydanticObjectId,
    resolved: bool,
    current_user: User = Depends(get_current_user)
):
    """Toggle comment resolution status"""
    comment = await Comment.get(id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.resolved = resolved
    await comment.save()
    return comment

@router.get("/content/{id}/comments/stats")
async def get_comment_stats(id: PydanticObjectId):
    """Get comment statistics for content"""
    comments = await Comment.find(Comment.content_id.id == id).to_list()
    total = len(comments)
    unresolved = len([c for c in comments if not c.resolved])
    resolved = total - unresolved
    
    return {
        "total": total,
        "unresolved": unresolved,
        "resolved": resolved
    }

@router.get("/tasks/{id}/comment-stats")
async def get_task_comment_stats(id: PydanticObjectId):
    """Get comment statistics for task's linked content"""
    task = await Task.get(id)
    if not task or not task.content_id:
        return {"unresolved_count": 0, "can_auto_complete": True}
    
    stats = await get_comment_stats(str(task.content_id.ref.id))
    can_auto_complete = stats["unresolved"] == 0
    
    return {
        "content_id": str(task.content_id.ref.id),
        "unresolved_count": stats["unresolved"],
        "can_auto_complete": can_auto_complete
    }

# --- Content Sharing ---

class ShareContentRequest(BaseModel):
    user_ids: List[str]
    message: Optional[str] = "Please review this content"
    due_date: Optional[datetime] = None

@router.post("/content/{id}/share")
async def share_content(
    id: PydanticObjectId,
    share_data: ShareContentRequest,
    current_user: User = Depends(get_current_user)
):
    """Share content with team members by creating tasks"""
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    from bson import ObjectId
    created_tasks = []
    
    for user_id in share_data.user_ids:
        task = Task(
            title=f"Review: {content.title}",
            description=share_data.message,
            content_id=ObjectId(id),
            assignee=ObjectId(user_id),
            organization_id=current_user.organization_id,
            status="pending",
            due_date=share_data.due_date,
            created_by=current_user.id
        )
        await task.create()
        created_tasks.append(str(task.id))
    
    if created_tasks:
        content.status = "review"
        content.updated_at = get_ist_now()
        await content.save()
    
    return {
        "success": True,
        "message": f"Content shared with {len(share_data.user_ids)} team member(s)",
        "task_ids": created_tasks
    }


# --- Tasks ---
from app.modules.generic.schemas import (
    TaskCreate, 
    TaskUpdate,
    TaskSchema, 
    TaskCommentCreate, 
    TaskCommentSchema,
    ActivityLogSchema,
    ActivityLog,
    NotificationSchema,
    ActiveTaskStatus
)

def get_link_id(link_field):
    """Safely extract ID from a Beanie Link or raw ObjectId/string."""
    if link_field is None:
        return None
    if hasattr(link_field, "ref"):
        return str(link_field.ref.id)
    return str(link_field)

def ensure_utc(dt):
    """Ensures a datetime is timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

async def revert_other_in_progress_tasks(user: User, current_task_id: Optional[PydanticObjectId] = None):
    """
    Ensure only one task is in progress for a user.
    Moves other 'In Progress' tasks to 'To Do' and stops their timers.
    """
    query = {
        Task.assignee.id: user.id,
        Task.stage: "In Progress",
    }
    if current_task_id:
        query[Task.id] = {"$ne": current_task_id}
    
    other_tasks = await Task.find(query).to_list()
    
    for t in other_tasks:
        t.stage = "To Do"
        # Stop timer if running
        if t.timer_start:
            delta = get_ist_now() - ensure_ist(t.timer_start)
            t.track_time = (t.track_time or 0) + int(delta.total_seconds())
            t.timer_start = None
        t.updated_at = get_ist_now()
        await t.save()
        
        # Log activity
        await ActivityLog(
            resource_type="task",
            resource_id=str(t.id),
            action="reverted_to_todo",
            old_value="In Progress",
            new_value="To Do",
            user=user,
            organization_id=user.organization_id
        ).create()
        
        # Notify user
        await Notification(
            user_id=user.id,
            title="Task Reverted",
            message=f"Task '{t.title}' was reverted to 'To Do' because you started another task.",
            type="task_reversion",
            link=f"/dashboard/tasks?taskId={t.id}",
            organization_id=user.organization_id
        ).create()

@router.post("/tasks", response_model=TaskSchema)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    # Create task with proper user association
    if not task_in.title or not task_in.title.strip():
        raise HTTPException(status_code=400, detail="Task title is mandatory")

    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        stage=task_in.stage,
        tags=task_in.tags or [],
        due_date=task_in.due_date,
        start_date=task_in.start_date,
        time_estimate=task_in.time_estimate,
        track_time=task_in.track_time or 0,
        attachments=task_in.attachments or [],
        links=task_in.links or [],
        custom_fields=task_in.custom_fields or {},
        created_by=current_user,
        assigner=current_user,
        organization_id=current_user.organization_id,
        updated_at=get_ist_now()
    )
    
    # Time Tracking Logic for initial stage
    if task_in.stage == "In Progress":
        task.timer_start = get_ist_now()
        # Enforce "One In-Progress Task" rule for the assignee
        if task_in.assignee:
            assignee_user = await User.get(task_in.assignee)
            if assignee_user:
                await revert_other_in_progress_tasks(assignee_user)
    
    # Handle optional fields
    if task_in.content_id:
        task.content_id = Link(ref=DBRef(collection="content", id=ObjectId(task_in.content_id)), document_class=Content)
    if task_in.assignee:
        task.assignee = Link(ref=DBRef(collection="users", id=ObjectId(task_in.assignee)), document_class=User)
    if task_in.parent_task_id:
        task.parent_task_id = Link(ref=DBRef(collection="tasks", id=ObjectId(task_in.parent_task_id)), document_class=Task)
    
    if task_in.assigner:
        task.assigner = Link(ref=DBRef(collection="users", id=ObjectId(task_in.assigner)), document_class=User)
    
    await task.create()

    # Log creation
    await ActivityLog(
        resource_type="task",
        resource_id=str(task.id),
        action="created",
        user=current_user,
        organization_id=current_user.organization_id
    ).create()

    # Broadcast creation
    import json
    await manager.broadcast(
        json.dumps({"type": "task_created", "taskId": str(task.id), "title": task.title}),
        "tasks_list" # Broad category for list refresh
    )

    # Fetch names for response
    assignee_name = None
    if task.assignee:
        u = await User.get(get_link_id(task.assignee))
        if u: assignee_name = u.full_name
    
    assigner_name = current_user.full_name
    
    # Return with properly serialized ObjectIds and names
    return TaskSchema(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        stage=task.stage,
        tags=task.tags,
        due_date=ensure_ist(task.due_date),
        start_date=ensure_ist(task.start_date),
        time_estimate=task.time_estimate,
        timer_start=ensure_ist(task.timer_start),
        track_time=task.track_time,
        custom_fields=task.custom_fields,
        content_id=get_link_id(task.content_id),
        assignee=get_link_id(task.assignee),
        assignee_name=assignee_name,
        assigner=get_link_id(task.assigner),
        assigner_name=assigner_name,
        created_by=get_link_id(task.created_by),
        organization_id=task.organization_id,
        parent_task_id=get_link_id(task.parent_task_id),
        total_time=task.track_time or 0,
        created_at=ensure_ist(task.created_at),
        updated_at=ensure_ist(task.updated_at)
    )

@router.get("/tasks", response_model=list[TaskSchema])
async def get_tasks(
    assignee: Optional[str] = None,
    assigner: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Filter by organization_id for security
    query = {Task.organization_id: current_user.organization_id}
    
    if assignee:
        # Assuming assignee is passed as the string ID from the frontend
        query[Task.assignee.id] = ObjectId(assignee)
    
    if assigner:
        # "assigner" field in Task model stores the Link to User
        query[Task.assigner.id] = ObjectId(assigner)

    tasks = await Task.find(query).to_list()
    
    now = datetime.now(timezone.utc)
    task_map = {}
    for task in tasks:
        task_time = task.track_time or 0
        if task.stage == "In Progress" and task.timer_start:
            delta = now - ensure_utc(task.timer_start)
            task_time += int(delta.total_seconds())
        
        task_map[str(task.id)] = {
            "task": task,
            "own_time": task_time,
            "children": []
        }

    for tid, data in task_map.items():
        parent_id = get_link_id(data["task"].parent_task_id)
        if parent_id and parent_id in task_map:
            task_map[parent_id]["children"].append(tid)

    memo = {}
    def get_total_time(tid):
        if tid in memo: return memo[tid]
        data = task_map[tid]
        total = data["own_time"]
        for child_id in data["children"]:
            total += get_total_time(child_id)
        memo[tid] = total
        return total

    results = []
    for tid, data in task_map.items():
        task = data["task"]
        total_time = get_total_time(tid)
        
        assignee_name = None
        if task.assignee:
            u = await User.get(get_link_id(task.assignee))
            if u: assignee_name = u.full_name
        
        assigner_name = None
        if task.assigner:
            u = await User.get(get_link_id(task.assigner))
            if u: assigner_name = u.full_name

        results.append(TaskSchema(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            stage=task.stage,
            tags=task.tags,
            due_date=ensure_ist(task.due_date),
            start_date=ensure_ist(task.start_date),
            time_estimate=task.time_estimate,
            timer_start=ensure_ist(task.timer_start),
            track_time=task.track_time,
            attachments=task.attachments,
            links=task.links,
            custom_fields=task.custom_fields,
            content_id=get_link_id(task.content_id),
            assignee=get_link_id(task.assignee),
            assignee_name=assignee_name,
            assigner=get_link_id(task.assigner),
            assigner_name=assigner_name,
            created_by=get_link_id(task.created_by),
            organization_id=task.organization_id,
            parent_task_id=get_link_id(task.parent_task_id),
            total_time=total_time,
            created_at=ensure_ist(task.created_at),
            updated_at=ensure_ist(task.updated_at)
        ))
    
    return results

@router.put("/tasks/{id}", response_model=TaskSchema)
async def update_task(
    id: PydanticObjectId,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(id)
    if not task or task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Track changes for ActivityLog
    old_status = task.status
    old_stage = task.stage
    old_assignee = get_link_id(task.assignee)
    old_assigner = get_link_id(task.assigner)
    
    # Partial Update Logic
    update_data = task_in.model_dump(exclude_unset=True)

    # Time Tracking Logic
    if "stage" in update_data and old_stage != update_data["stage"]:
        new_stage = update_data["stage"]
        if new_stage == "In Progress":
            # Starting timer
            task.timer_start = get_ist_now()
            # Enforce "One In-Progress Task" rule for the assignee
            assignee_id_for_check = update_data.get("assignee", get_link_id(task.assignee))
            if assignee_id_for_check:
                assignee_user = await User.get(assignee_id_for_check)
                if assignee_user:
                    await revert_other_in_progress_tasks(assignee_user, id)
        elif old_stage == "In Progress":
            # Stopping timer
            if task.timer_start:
                delta = get_ist_now() - ensure_ist(task.timer_start)
                task.track_time = (task.track_time or 0) + int(delta.total_seconds())
            task.timer_start = None
    
    # Simple Fields Update
    for field in ["title", "description", "status", "priority", "stage", "tags", "due_date", "start_date", "time_estimate", "attachments", "links", "custom_fields"]:
        if field in update_data:
            val = update_data[field]
            # Handle defaults for containers if they are None in input
            if val is None and field in ["tags", "attachments", "links"]:
                setattr(task, field, [])
            elif val is None and field == "custom_fields":
                setattr(task, field, {})
            else:
                setattr(task, field, val)

    # Handle Links (only if present in update_data)
    if "assignee" in update_data:
        val = update_data["assignee"]
        task.assignee = Link(ref=DBRef(collection="users", id=ObjectId(val)), document_class=User) if val else None
        
    if "content_id" in update_data:
        val = update_data["content_id"]
        task.content_id = Link(ref=DBRef(collection="content", id=ObjectId(val)), document_class=Content) if val else None
        
    if "assigner" in update_data:
        val = update_data["assigner"]
        task.assigner = Link(ref=DBRef(collection="users", id=ObjectId(val)), document_class=User) if val else None
        
    if "parent_task_id" in update_data:
        val = update_data["parent_task_id"]
        task.parent_task_id = Link(ref=DBRef(collection="tasks", id=ObjectId(val)), document_class=Task) if val else None

    task.updated_at = get_ist_now()

    # --- Auto Re-assignment Logic ---
    # If task is moved to "Needs Edit" or "Changes Requested", re-assign to original author
    if task.stage in ["Needs Edit", "Changes Requested"] and task.content_id:
        content_id = get_link_id(task.content_id)
        if content_id:
            content = await Content.get(content_id)
            if content and content.author:
                # Re-assign to author
                task.assignee = content.author
                # Revert content status to draft to signal work is needed
                content.status = "draft"
                await content.save()

    # --- Auto-Approval Logic ---
    # If task is marked Done/Completed, check if all tasks for this content are finished
    if (task.stage == "Done" or task.status == "completed") and task.content_id:
        content_id = get_link_id(task.content_id)
        if content_id:
            unfinished_tasks_count = await Task.find(
                Task.content_id.id == ObjectId(content_id),
                Task.id != task.id, # Exclude current task
                Task.status != "completed",
                Task.stage != "Done"
            ).count()
            
            if unfinished_tasks_count == 0:
                content = await Content.get(content_id)
                if content and content.status == "review":
                    content.status = "approved"
                    content.updated_at = get_ist_now()
                    await content.save()

    await task.save()

    # Log significant changes
    if old_status != task.status:
        await ActivityLog(
            resource_type="task",
            resource_id=str(task.id),
            action="status_change",
            old_value=old_status,
            new_value=task.status,
            user=current_user,
            organization_id=current_user.organization_id
        ).create()

    if old_stage != task.stage:
        await ActivityLog(
            resource_type="task",
            resource_id=str(task.id),
            action="stage_change",
            old_value=old_stage,
            new_value=task.stage,
            user=current_user,
            organization_id=current_user.organization_id
        ).create()

    new_assignee = get_link_id(task.assignee)
    if old_assignee != new_assignee:
        await ActivityLog(
            resource_type="task",
            resource_id=str(task.id),
            action="assignee_change",
            old_value=old_assignee,
            new_value=new_assignee,
            user=current_user,
            organization_id=current_user.organization_id
        ).create()

    new_assigner = get_link_id(task.assigner)
    if old_assigner != new_assigner:
        await ActivityLog(
            resource_type="task",
            resource_id=str(task.id),
            action="assigner_change",
            old_value=old_assigner,
            new_value=new_assigner,
            user=current_user,
            organization_id=current_user.organization_id
        ).create()
        
        # Notify new assignee
        if new_assignee and new_assignee != str(current_user.id):
            await Notification(
                user_id=ObjectId(new_assignee),
                title="New Task Assigned",
                message=f"{current_user.full_name} assigned you the task: {task.title}",
                type="task_assignment",
                link=f"/dashboard/tasks?taskId={task.id}",
                organization_id=current_user.organization_id
            ).create()

    # Broadcast update
    import json
    await manager.broadcast(
        json.dumps({"type": "task_update", "taskId": str(task.id)}),
        f"task_{task.id}"
    )
    
    # Fetch names for response
    assignee_name = None
    if task.assignee:
        u = await User.get(get_link_id(task.assignee))
        if u: assignee_name = u.full_name
    
    assigner_name = None
    if task.assigner:
        u = await User.get(get_link_id(task.assigner))
        if u: assigner_name = u.full_name

    return TaskSchema(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        stage=task.stage,
        tags=task.tags,
        due_date=ensure_ist(task.due_date),
        start_date=ensure_ist(task.start_date),
        time_estimate=task.time_estimate,
        timer_start=ensure_ist(task.timer_start),
        track_time=task.track_time,
        attachments=task.attachments,
        links=task.links,
        custom_fields=task.custom_fields,
        content_id=get_link_id(task.content_id),
        assignee=get_link_id(task.assignee),
        assignee_name=assignee_name,
        assigner=get_link_id(task.assigner),
        assigner_name=assigner_name,
        created_by=get_link_id(task.created_by),
        organization_id=task.organization_id,
        parent_task_id=get_link_id(task.parent_task_id),
        total_time=task.track_time or 0,
        created_at=ensure_ist(task.created_at),
        updated_at=ensure_ist(task.updated_at)
    )

@router.get("/tasks/active-status", response_model=ActiveTaskStatus)
async def get_active_task_status(current_user: User = Depends(get_current_user)):
    """
    Check if the user has any active tasks in progress.
    Returns the count and time since last activity.
    """
    active_tasks = await Task.find(
        Task.assignee.id == current_user.id,
        Task.stage == "In Progress"
    ).to_list()
    
    active_count = len(active_tasks)
    active_task = active_tasks[0] if active_count > 0 else None
    
    # Get last activity where they were working on a task
    last_action = await ActivityLog.find(
        ActivityLog.user.id == current_user.id
    ).sort(-ActivityLog.created_at).first_or_none()
    
    return ActiveTaskStatus(
        active_count=active_count,
        active_task_id=str(active_task.id) if active_task else None,
        active_task_title=active_task.title if active_task else None,
        active_task_timer_start=active_task.timer_start if active_task else None,
        last_activity_at=last_action.created_at if last_action else None,
        server_time=get_ist_now()
    )

@router.delete("/tasks/{id}")
async def delete_task(
    id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(id)
    if not task or task.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Optional: Check for permissions (e.g., only admin or creator can delete)
    if current_user.role not in ["admin", "editor_in_chief"] and task.created_by.id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    await task.delete()
    
    # Broadcast deletion
    import json
    await manager.broadcast(
        json.dumps({"type": "task_deleted", "taskId": str(task.id)}),
        "tasks_list"
    )
    
    return {"message": "Task deleted successfully"}


@router.post("/tasks/{id}/comments", response_model=TaskCommentSchema)
async def create_task_comment(
    id: PydanticObjectId,
    comment_in: TaskCommentCreate,
    current_user: User = Depends(get_current_user)
):
    task = await Task.get(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comment = TaskComment(
        task_id=Link(ref=DBRef(collection="tasks", id=ObjectId(id)), document_class=Task),
        text=comment_in.text,
        author=current_user,
        organization_id=current_user.organization_id
    )
    await comment.create()
    
    # Broadcast new comment
    import json
    await manager.broadcast(
        json.dumps({
            "type": "new_comment", 
            "taskId": str(id),
            "text": comment.text,
            "author_name": current_user.full_name
        }),
        f"task_{id}"
    )

    # Notify assignee if not the author
    if task.assignee and str(task.assignee.ref.id) != str(current_user.id):
        await Notification(
            user_id=ObjectId(str(task.assignee.ref.id)),
            title="New Comment on Task",
            message=f"{current_user.full_name} commented on '{task.title}': \"{comment.text[:50]}...\"",
            type="mention",
            link=f"/dashboard/tasks?taskId={task.id}",
            organization_id=current_user.organization_id
        ).create()
    
    return TaskCommentSchema(
        id=str(comment.id),
        task_id=str(id),
        text=comment.text,
        author=str(current_user.id),
        author_name=current_user.full_name,
        created_at=comment.created_at
    )

@router.get("/tasks/{id}/comments", response_model=List[TaskCommentSchema])
async def get_task_comments(id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    from bson import ObjectId
    comments = await TaskComment.find(
        TaskComment.task_id.id == ObjectId(id),
        TaskComment.organization_id == current_user.organization_id
    ).to_list()
    
    results = []
    for c in comments:
        author_name = "Unknown User"
        u = await User.get(get_link_id(c.author))
        if u: author_name = u.full_name
        
        results.append(TaskCommentSchema(
            id=str(c.id),
            task_id=str(id),
            text=c.text,
            author=get_link_id(c.author),
            author_name=author_name,
            created_at=c.created_at
        ))
    return results


@router.get("/tasks/{id}/activity", response_model=List[ActivityLogSchema])
async def get_task_activity(id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    logs = await ActivityLog.find(
        ActivityLog.resource_id == id,
        ActivityLog.organization_id == current_user.organization_id
    ).sort("-created_at").to_list()
    
    results = []
    for log in logs:
        user_name = "Unknown User"
        u = await User.get(get_link_id(log.user))
        if u: user_name = u.full_name
        
        results.append(ActivityLogSchema(
            id=str(log.id),
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            action=log.action,
            old_value=log.old_value,
            new_value=log.new_value,
            user_id=get_link_id(log.user),
            user_name=user_name,
            created_at=log.created_at
        ))
    return results

@router.get("/notifications", response_model=List[NotificationSchema])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await Notification.find(
        Notification.user_id.id == current_user.id,
        Notification.organization_id == current_user.organization_id
    ).sort("-created_at").to_list()
    
    results = []
    for n in notifications:
        results.append(NotificationSchema(
            id=str(n.id),
            user_id=str(current_user.id),
            title=n.title,
            message=n.message,
            type=n.type,
            link=n.link,
            read=n.read,
            created_at=n.created_at
        ))
    return results

@router.patch("/notifications/{id}/read")
async def mark_notification_read(id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    from bson import ObjectId
    notification = await Notification.get(id)
    if not notification or get_link_id(notification.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.read = True
    await notification.save()
    return {"status": "success"}

@router.websocket("/ws/tasks/{task_id}")
async def task_websocket(websocket: WebSocket, task_id: str):
    await manager.connect(websocket, f"task_{task_id}")
    try:
        while True:
            # We mostly use broadcast from regular endpoints, 
            # but we can receive client-side pings or messages here if needed.
            data = await websocket.receive_text()
            # Handle client messages if necessary
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"task_{task_id}")


@router.get("/export_content/{id}")
async def export_content(id: PydanticObjectId, format: str = "pdf"):
    from fastapi.responses import Response
    from app.modules.generic.publishing import publishing_service
    
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    if format == "pdf":
        data = await publishing_service.export_pdf(content)
        media_type = "application/pdf"
        filename = f"{content.slug}.pdf"
    elif format == "epub":
        data = await publishing_service.export_epub(content)
        media_type = "application/epub+zip"
        filename = f"{content.slug}.epub"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
        
    return Response(content=data, media_type=media_type, headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })
