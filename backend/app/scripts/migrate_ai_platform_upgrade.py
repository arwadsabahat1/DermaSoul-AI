from sqlalchemy import text

from app.database import engine


DDL_STATEMENTS = [
    # Consultation AI fields
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS clinical_entities JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS negated_entities JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS severity_confidence DOUBLE PRECISION",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS urgency_class VARCHAR(50)",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS urgency_confidence DOUBLE PRECISION",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS urgency_rationale TEXT",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS followup_candidates JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS nlp_model_version VARCHAR(120)",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS retrieval_trace JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS retrieval_confidence DOUBLE PRECISION",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS retrieval_metrics JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_summary TEXT",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_differential_notes JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_next_steps JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_followup_questions JSONB",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_confidence_statement TEXT",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS llm_generation_mode VARCHAR(40)",
    "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100)",
    # Dermatologist intelligence fields
    "ALTER TABLE dermatologists ADD COLUMN IF NOT EXISTS supported_conditions TEXT",
    "ALTER TABLE dermatologists ADD COLUMN IF NOT EXISTS specialty_tags TEXT",
    "ALTER TABLE dermatologists ADD COLUMN IF NOT EXISTS regions_served TEXT",
    "ALTER TABLE dermatologists ADD COLUMN IF NOT EXISTS telemedicine_available BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE dermatologists ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN NOT NULL DEFAULT FALSE",
]

CREATE_TABLE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS rag_documents (
        id VARCHAR PRIMARY KEY,
        source_type VARCHAR(50) NOT NULL,
        source_id VARCHAR(200),
        title VARCHAR(300) NOT NULL,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL DEFAULT 0,
        metadata_json JSONB,
        embedding_json JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS consultation_messages (
        id VARCHAR PRIMARY KEY,
        consultation_id VARCHAR NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata_json JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
    """,
]

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_rag_documents_source ON rag_documents(source_type, source_id)",
    "CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation ON consultation_messages(consultation_id, created_at)",
]


def main() -> None:
    with engine.begin() as connection:
        for ddl in CREATE_TABLE_STATEMENTS:
            connection.execute(text(ddl))
        for ddl in DDL_STATEMENTS:
            connection.execute(text(ddl))
        for ddl in INDEX_STATEMENTS:
            connection.execute(text(ddl))
    print("AI platform upgrade migration complete.")


if __name__ == "__main__":
    main()
