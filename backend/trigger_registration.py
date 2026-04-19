import sqlite3
import os
import requests

db_path = r'C:\Users\lenov\AppData\Roaming\agent\monitoring.db'
registration_url = 'https://publisher.connecterp.cloud/api/v1/monitoring/agent/register'

def trigger_registration():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    # 1. Get token and other info from local DB
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM session WHERE id = 1")
    session = cursor.fetchone()
    
    if not session or not session['token']:
        print("No active session or token found in local database.")
        conn.close()
        return

    token = session['token']
    user_email = session['user_email']
    print(f"Triggering registration for: {user_email}")
    print(f"Target URL: {registration_url}")

    # 2. Prepare request params
    import socket
    import platform
    
    data = {
        'computer_name': socket.gethostname(),
        'os_version': f"{platform.system()} {platform.release()}"
    }

    # 3. Send request
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        print("Sending POST request...")
        response = requests.post(registration_url, data=data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")

        if response.status_code == 200:
            res_json = response.json()
            agent_id = res_json.get('agent_id')
            if agent_id:
                print(f"\nSUCCESS! Received Agent ID: {agent_id}")
                # 4. Save back to DB
                cursor.execute("UPDATE session SET agent_id = ? WHERE id = 1", (agent_id,))
                conn.commit()
                print("Agent ID saved to local database.")
            else:
                print("Registration successful but no agent_id returned.")
        else:
            print("\nRegistration failed.")
            if response.status_code == 404:
                print("Error 404: This likely means either the route is missing on the server or your user ID is not found in the server's database (stale token).")

    except Exception as e:
        print(f"Error during registration call: {e}")

    conn.close()

if __name__ == "__main__":
    trigger_registration()
