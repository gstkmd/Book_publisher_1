def normalize_role(role: str) -> str:
    """
    Normalizes the user role to ensure the system is resilient to unknown or dynamic roles.
    Defaults to 'user' if role is empty.
    """
    if not role:
        return "user"
    return str(role).lower()
