import os
import base64
from email.mime.text import MIMEText
from typing import List, Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Scopes required
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class GmailService:
    def __init__(self):
        self.creds = None
        # In production, we'd load these from env vars or a secure vault
        # For 'Trojan Horse' demo, we assume a 'token.json' exists or we use env vars to build creds
        self.service = None

    def authenticate(self):
        # Placeholder for real OAuth flow or Service Account load
        # For simplicity in this demo, we'll check for a mock Setup or just log
        if os.path.exists('token.json'):
            self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
        # If valid creds, build service
        if self.creds and self.creds.valid:
            self.service = build('gmail', 'v1', credentials=self.creds)

    def send_email(self, to_email: str, subject: str, content: str):
        if not self.service:
            print(f"[GmailService] Mock Send -> To: {to_email}, Subject: {subject}")
            return

        message = MIMEText(content)
        message['to'] = to_email
        message['subject'] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {'raw': raw}

        try:
            message = (self.service.users().messages().send(userId="me", body=body)
                       .execute())
            print(f'Message Id: {message["id"]}')
        except Exception as error:
            print(f'An error occurred: {error}')

gmail_service = GmailService()
