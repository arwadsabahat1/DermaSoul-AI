import smtplib
from email.message import EmailMessage

from app.config import settings


def send_email(subject: str, body: str, recipient_email: str) -> bool:
    if not settings.SMTP_ENABLED:
        return False

    if not recipient_email:
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()

            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            server.send_message(message)
        return True
    except Exception:
        # Intentionally swallow errors so diagnosis flow never fails due to email.
        return False


def send_high_risk_alert_email(
    recipient_email: str,
    consultation_id: str,
    predicted_disease: str,
    risk_level: str,
) -> bool:
    subject = f"DermaSoul Alert: {risk_level} Risk Result"
    body = (
        "Your latest DermaSoul AI consultation indicates elevated concern.\n\n"
        f"Consultation ID: {consultation_id}\n"
        f"Predicted condition: {predicted_disease}\n"
        f"Risk level: {risk_level}\n\n"
        "Please consult a qualified dermatologist or healthcare professional as soon as possible.\n"
        "This is an AI support output and not a medical diagnosis."
    )
    return send_email(subject=subject, body=body, recipient_email=recipient_email)
