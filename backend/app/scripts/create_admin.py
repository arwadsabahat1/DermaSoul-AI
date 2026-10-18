import argparse
import getpass

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or promote an admin user."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Admin user email address."
    )
    parser.add_argument(
        "--password",
        help="Password for new admin user. If omitted, will prompt securely."
    )
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="If user exists, also reset password to provided/prompted password."
    )
    return parser.parse_args()


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")


def main() -> None:
    args = parse_args()
    email = args.email.strip().lower()

    if not email:
        raise ValueError("Email is required.")

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            existing_user.role = "admin"
            existing_user.is_active = True

            if args.reset_password:
                password = args.password or getpass.getpass("New password: ")
                validate_password(password)
                existing_user.hashed_password = hash_password(password)

            db.commit()
            print(f"Promoted existing user to admin: {email}")
            return

        password = args.password or getpass.getpass("Admin password: ")
        validate_password(password)

        user = User(
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"Created new admin user: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
