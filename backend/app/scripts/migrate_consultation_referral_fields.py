from sqlalchemy import text

from app.database import engine


DDL_STATEMENTS = [
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS referred_dermatologists JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS referral_note TEXT",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS symptom_keyword_hits JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS severity_rationale TEXT",
]


def main() -> None:
    with engine.begin() as connection:
        for ddl in DDL_STATEMENTS:
            connection.execute(text(ddl))
    print("Consultation referral/NLP columns migration complete.")


if __name__ == "__main__":
    main()
