"""Prepare the PostgreSQL database for DermaSoul AI on a new machine (safe to run again at any time).

    cd backend
    python -m app.scripts.setup_database

Steps:
  1. create the database named in DATABASE_URL (backend/.env) if it does not exist yet
  2. create all tables
  3. seed the educational articles and the curated OTC products (updates existing rows, no duplicates)
  4. build the RAG vector index (rag_documents) from the local knowledge base

Run `python -m app.scripts.download_models` first so the index is built with the real embedding model.
"""
from __future__ import annotations

import sys

from sqlalchemy.engine import make_url


def ensure_database_exists(database_url: str) -> None:
    import psycopg2
    from psycopg2 import sql

    url = make_url(database_url)
    if not url.drivername.startswith("postgresql"):
        print(f"= skipping database creation for {url.drivername}")
        return
    target = url.database
    conn = psycopg2.connect(dbname="postgres", user=url.username, password=url.password,
                            host=url.host or "localhost", port=url.port or 5432, connect_timeout=15)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target,))
            if cur.fetchone():
                print(f"= database '{target}' already exists")
            else:
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target)))
                print(f"+ created database '{target}'")
    finally:
        conn.close()


def main() -> int:
    from app.config import settings

    print("1/4 Database")
    try:
        ensure_database_exists(settings.DATABASE_URL)
    except Exception as exc:
        print(f"Could not connect to PostgreSQL: {exc}")
        print("Check that PostgreSQL is running and that DATABASE_URL in backend/.env has the right password.")
        return 1

    print("2/4 Tables")
    from app import models  # noqa: F401  (registers every model with SQLAlchemy)
    from app.database import Base, engine

    Base.metadata.create_all(bind=engine)
    print(f"= {len(Base.metadata.tables)} tables ready")

    print("3/4 Seed data")
    from app.scripts import seed_education_articles, seed_products_from_rag

    seed_education_articles.main()
    seed_products_from_rag.main()

    print("4/4 RAG vector index")
    from app.services.rag_embedding_service import _get_sentence_transformer
    from app.tasks.rag_tasks import run_rag_reindex_job

    if _get_sentence_transformer() is None:
        print("! embedding model not found - run `python -m app.scripts.download_models` first, then run this again")
        return 1
    print(f"= {run_rag_reindex_job()}")
    print("Database setup complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
