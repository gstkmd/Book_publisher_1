from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.modules.generic.models import Content, ContentVersion, Comment, Task
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

@router.get("/content", response_model=List[Content])
async def read_contents():
    return await Content.find_all().to_list()

@router.post("/content", response_model=Content)
async def create_content(content: Content):
    # In a real app, we would get current_user here to set the organization_id
    # content.organization_id = current_user.organization_id
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

    return content

@router.put("/content/{id}", response_model=Content)
async def update_content(id: str, content_in: Content):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Update fields
    content.title = content_in.title
    content.body = content_in.body
    content.updated_at = datetime.utcnow()
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

    return content

@router.get("/content/{id}/versions", response_model=List[ContentVersion])
async def get_content_versions(id: str):
    content = await Content.get(id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return await ContentVersion.find(ContentVersion.content_id.id == content.id).sort(-ContentVersion.version_number).to_list()

@router.post("/content/{id}/restore/{version_id}")
async def restore_version(id: str, version_id: str):
    content = await Content.get(id)
    version = await ContentVersion.get(version_id)
    if not content or not version:
         raise HTTPException(status_code=404, detail="Content or Version not found")
    
    content.title = version.title
    content.body = version.body
    content.updated_at = datetime.utcnow()
    await content.save()
    
    # Create a restoration version? Optional but good practice.
    return {"message": f"Restored to version {version.version_number}"}

# --- Comments ---
@router.post("/comments", response_model=Comment)
async def create_comment(comment: Comment):
    # comment.organization_id = current_user.organization_id
    await comment.create()
    
    # Broadcast comment
    if comment.content_id:
         await manager.broadcast(f"New Comment: {comment.text}", str(comment.content_id.id))

    return comment

@router.get("/content/{id}/comments", response_model=List[Comment])
async def get_content_comments(id: str):
    return await Comment.find(Comment.content_id.id == id).to_list()

# --- Tasks ---
from app.modules.generic.schemas import TaskCreate, TaskSchema
from app.api.deps import get_current_user
from app.modules.core.models import User
from fastapi import Depends

@router.post("/tasks", response_model=TaskSchema)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    # Create task with proper user association
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        due_date=task_in.due_date,
        created_by=current_user.id,
        organization_id=current_user.organization_id
    )
    
    # Handle optional fields
    if task_in.content_id:
        from bson import ObjectId
        task.content_id = ObjectId(task_in.content_id)
    if task_in.assignee:
        from bson import ObjectId
        task.assignee = ObjectId(task_in.assignee)
    
    await task.create()
    
    # Notify Assignee (Email stub)
    if task.assignee:
        pass # sending_email_service.send_assignment_email(...)

    # Return with properly serialized ObjectIds
    return TaskSchema(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        due_date=task.due_date,
        content_id=str(task.content_id) if task.content_id else None,
        assignee=str(task.assignee) if task.assignee else None,
        created_by=str(task.created_by) if task.created_by else None,
        organization_id=task.organization_id,
        created_at=task.created_at
    )

@router.get("/tasks", response_model=list[TaskSchema])
async def get_tasks(current_user: User = Depends(get_current_user)):
    # Filter by org_id in real app
    tasks = await Task.find_all().to_list()
    
    # Convert to schemas with serialized ObjectIds
    return [
        TaskSchema(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            due_date=task.due_date,
            content_id=str(task.content_id) if task.content_id else None,
            assignee=str(task.assignee) if task.assignee else None,
            created_by=str(task.created_by) if task.created_by else None,
            organization_id=task.organization_id,
            created_at=task.created_at
        )
        for task in tasks
    ]


@router.get("/content/{id}/export")
async def export_content(id: str, format: str = "pdf"):
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
