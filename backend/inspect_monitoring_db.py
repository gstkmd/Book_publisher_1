import sqlite3
import os

db_path = r'C:\Users\lenov\AppData\Roaming\agent\monitoring.db'

def inspect_db():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"--- Inspection of {db_path} ---")
    
    for table_row in tables:
        table_name = table_row['name']
        if table_name == 'sqlite_sequence': continue
        
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"\nTable: {table_name} ({count} rows)")
        
        # Check sync status if column exists
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col['name'] for col in cursor.fetchall()]
        
        if 'synced' in columns:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE synced = 0")
            unsynced = cursor.fetchone()[0]
            print(f"  - Unsynced: {unsynced}")
            
        # Show sample of last 3 rows
        if count > 0:
            print(f"  - Latest 3 entries:")
            # Use 'id' if it exists, otherwise just limit
            order_by = "id" if "id" in columns else (columns[0] if columns else "")
            try:
                cursor.execute(f"SELECT * FROM {table_name} ORDER BY {order_by} DESC LIMIT 3")
                rows = cursor.fetchall()
                for i, row in enumerate(rows):
                    row_dict = dict(row)
                    # Truncate some long fields for readability
                    if 'window_title' in row_dict and row_dict['window_title']:
                        if len(row_dict['window_title']) > 50:
                            row_dict['window_title'] = row_dict['window_title'][:47] + "..."
                    print(f"    {i+1}. {row_dict}")
            except Exception as e:
                print(f"    Error fetching samples: {e}")

    # Special check for session
    cursor.execute("SELECT * FROM session WHERE id = 1")
    session = cursor.fetchone()
    if session:
        s = dict(session)
        # Mask token
        if s.get('token'): s['token'] = s['token'][:10] + "..."
        print(f"\nActive Session: {s}")
    else:
        print("\nNo active session found.")

    conn.close()

if __name__ == "__main__":
    inspect_db()
