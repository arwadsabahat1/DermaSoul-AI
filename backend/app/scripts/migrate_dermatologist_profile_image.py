"""Add optional provider profile-photo URL column to existing databases."""

from sqlalchemy import text

from app.database import engine


def main() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE dermatologists "
                "ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(1000)"
            )
        )
    print("Dermatologist profile image URL migration complete.")


if __name__ == "__main__":
    main()
