import sqlite3
import os

db_path = r'C:\Users\lenov\AppData\Roaming\agent\monitoring.db'

def clear_backlog():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"--- Clearing Backlog for {db_path} ---")

    # 1. Handle Screenshots backlog
    try:
        # Get paths of unsynced screenshots to delete files
        cursor.execute("SELECT file_path FROM screenshots WHERE synced = 0")
        unsynced_screenshots = cursor.fetchall()
        
        deleted_files_count = 0
        for row in unsynced_screenshots:
            file_path = row['file_path']
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted_files_count += 1
                except Exception as e:
                    print(f"  - Failed to delete file {file_path}: {e}")
        
        # Delete records from DB
        cursor.execute("DELETE FROM screenshots WHERE synced = 0")
        deleted_records_count = cursor.rowcount
        print(f"Screenshots:")
        print(f"  - Deleted {deleted_files_count} physical files.")
        print(f"  - Removed {deleted_records_count} unsynced records from database.")
        
    except Exception as e:
        print(f"Error clearing screenshots: {e}")

    # 2. Handle Activity Logs backlog
    try:
        cursor.execute("DELETE FROM activity_logs WHERE synced = 0")
        deleted_logs_count = cursor.rowcount
        print(f"Activity Logs:")
        print(f"  - Removed {deleted_logs_count} unsynced records from database.")
    except Exception as e:
        print(f"Error clearing activity logs: {e}")

    conn.commit()
    conn.close()
    print("\n--- Backlog cleanup complete ---")

if __name__ == "__main__":
    clear_backlog()
