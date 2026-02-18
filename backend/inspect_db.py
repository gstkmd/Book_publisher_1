import sqlite3
import os

DB_PATH = 'd:/Book_publisher/backend/monitoring.db'

def inspect_db():
    if not os.path.exists(DB_PATH):
        # Try relative to backend
        DB_PATH_REL = 'monitoring.db'
        if not os.path.exists(DB_PATH_REL):
             # Try project root
             DB_PATH_ROOT = 'd:/Book_publisher/monitoring.db'
             if not os.path.exists(DB_PATH_ROOT):
                 print(f"Database not found at {DB_PATH}, {DB_PATH_REL}, or {DB_PATH_ROOT}")
                 return
             else:
                 path = DB_PATH_ROOT
        else:
            path = DB_PATH_REL
    else:
        path = DB_PATH

    print(f"Inspecting database at: {path}")
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    
    tables = ["agents", "screenshots", "app_usage", "idle_time", "daily_summary"]
    for table in tables:
        try:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"Table {table}: {count} rows")
            if count > 0:
                rows = conn.execute(f"SELECT * FROM {table} LIMIT 5").fetchall()
                for row in rows:
                    print(dict(row))
        except Exception as e:
            print(f"Error reading {table}: {e}")
    
    conn.close()

if __name__ == "__main__":
    inspect_db()
