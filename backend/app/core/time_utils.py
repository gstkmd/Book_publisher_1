from datetime import datetime, timedelta, timezone
try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo

IST = zoneinfo.ZoneInfo("Asia/Kolkata")

def get_ist_now():
    """Returns current time in IST."""
    return datetime.now(IST)

def ensure_ist(dt: datetime):
    """Converts a timezone-awre datetime to IST, or localized naive datetime to IST."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume UTC if naive, or just set to IST? 
        # Safest is to assume UTC for stored dates, then convert.
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)
