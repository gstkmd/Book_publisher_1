from app.modules.core.models import User, UserRole

def can_publish(user: User) -> bool:
    return user.role in [UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF]

def can_edit_content(user: User) -> bool:
    return user.role in [UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.SECTION_EDITOR, UserRole.AUTHOR]

def can_review(user: User) -> bool:
    return user.role in [UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.SECTION_EDITOR, UserRole.REVIEWER]

def can_access_media(user: User) -> bool:
    return user.role in [UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.SECTION_EDITOR, UserRole.AUTHOR, UserRole.ILLUSTRATOR]

def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN
