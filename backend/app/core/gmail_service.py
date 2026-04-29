import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core.security import decrypt_string

class EmailService:
    def __init__(self):
        pass

    async def _get_smtp_config(self):
        """Fetch SMTP configuration from GlobalSettings in DB."""
        from app.modules.core.models import GlobalSettings
        settings = await GlobalSettings.find_one()
        if not settings or not settings.smtp_server:
            return None
        
        return {
            "server": settings.smtp_server,
            "port": settings.smtp_port,
            "user": settings.smtp_user,
            "password": decrypt_string(settings.smtp_password_encrypted),
            "from_email": settings.smtp_from_email,
            "use_tls": settings.smtp_use_tls
        }

    async def test_connection(self, server: str, port: int, user: str, password: str, from_email: str, use_tls: bool, to_email: str) -> bool:
        """Test SMTP connection with provided credentials."""
        try:
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = "Connect Publisher: SMTP Connection Test"
            body = "Your SMTP connection to Connect Publisher is working perfectly!"
            msg.attach(MIMEText(body, 'plain'))

            server_conn = smtplib.SMTP(server, port, timeout=10)
            if use_tls:
                server_conn.starttls()
            
            if user and password:
                server_conn.login(user, password)
            
            server_conn.send_message(msg)
            server_conn.quit()
            return True
        except Exception as e:
            print(f"[EmailService] SMTP Test failed: {e}")
            return False

    async def send_email(self, to_email: str, subject: str, content: str):
        config = await self._get_smtp_config()
        
        if not config:
            print(f"[EmailService] MOCK SEND (No SMTP Config) -> To: {to_email}, Subject: {subject}")
            print(f"Content: {content}")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = config["from_email"]
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(content, 'html'))

            server_conn = smtplib.SMTP(config["server"], config["port"], timeout=10)
            if config["use_tls"]:
                server_conn.starttls()
            
            if config["user"] and config["password"]:
                server_conn.login(config["user"], config["password"])
            
            server_conn.send_message(msg)
            server_conn.quit()
            print(f"[EmailService] Email sent to {to_email}")
        except Exception as e:
            print(f"[EmailService] Failed to send email: {e}")

    async def send_password_reset_email(self, email: str, token: str, host: str):
        subject = "Reset your password - Connect Publisher"
        link = f"{host}/login/reset-password?token={token}"
        
        content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Connect Publisher</h2>
            <p>You requested a password reset. Click the button below to set a new password. This link will expire in 24 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 10px; color: #999;">{link}</p>
        </div>
        """
        await self.send_email(email, subject, content)

gmail_service = EmailService() # Keeping variable name for compatibility
