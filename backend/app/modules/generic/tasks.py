from app.core.celery_app import celery_app
import time

@celery_app.task
def example_batch_task(word: str):
    time.sleep(5) # Simulate heavy processing
    return f"Processed {word}"

@celery_app.task
def batch_export_content(organization_id: str):
    # In a real scenario, this would:
    # 1. Fetch all content for org
    # 2. Convert to PDF
    # 3. Zip them
    # 4. Upload to S3
    # 5. Email link to user
    return f"Export initiated for Org {organization_id}"
