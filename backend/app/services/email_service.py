"""Send emails (used for password reset).

If SMTP is not configured (typical on a fresh local setup) nothing is sent; the
email is printed in the backend terminal instead so you can still test the flow.
"""

import html
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app import config

logger = logging.getLogger(__name__)


def is_email_configured() -> bool:
    return bool(config.SMTP_HOST and config.SMTP_USERNAME and config.SMTP_PASSWORD)


def send_email(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
    """Send one email. Returns True if it was handed to the SMTP server."""
    if not is_email_configured():
        logger.warning(
            "SMTP is not configured, so no email was sent. (Set SMTP_HOST, SMTP_USERNAME, "
            "SMTP_PASSWORD in backend/.env.)\n--- DEV EMAIL ---\nTo: %s\nSubject: %s\n\n%s\n--- END ---",
            to_email,
            subject,
            text_body,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = config.SMTP_FROM or config.SMTP_USERNAME
    message["To"] = to_email
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        if config.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(
                config.SMTP_HOST, config.SMTP_PORT, timeout=20, context=ssl.create_default_context()
            ) as server:
                server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as server:
                server.starttls(context=ssl.create_default_context())
                server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
                server.send_message(message)
        return True
    except Exception:  # never crash the request because of a mail problem
        logger.exception("Could not send email to %s", to_email)
        return False


def send_password_reset_email(to_email: str, full_name: str, reset_url: str) -> bool:
    minutes = config.PASSWORD_RESET_EXPIRE_MINUTES
    subject = "Reset your StudyHub password"
    text_body = (
        f"Hi {full_name},\n\n"
        "We received a request to reset your StudyHub password.\n"
        f"Open this link to choose a new password (valid for {minutes} minutes):\n\n"
        f"{reset_url}\n\n"
        "If you did not ask for this, you can ignore this email. Your password will not change."
    )
    safe_name = html.escape(full_name)
    safe_url = html.escape(reset_url, quote=True)
    html_body = f"""\
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#111">
  <h2 style="color:#2563eb">StudyHub</h2>
  <p>Hi {safe_name},</p>
  <p>We received a request to reset your password. Click the button below to choose a new one.
     This link is valid for {minutes} minutes and can be used only once.</p>
  <p><a href="{safe_url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
     text-decoration:none;border-radius:8px;font-weight:bold">Reset password</a></p>
  <p style="font-size:13px;color:#555">Button not working? Copy this link into your browser:<br>{safe_url}</p>
  <p style="font-size:13px;color:#555">If you did not ask for this, ignore this email. Your password will not change.</p>
</div>"""
    return send_email(to_email, subject, text_body, html_body)
