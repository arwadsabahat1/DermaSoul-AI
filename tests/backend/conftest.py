"""
Pytest configuration and fixtures for Phase 1 (30%) backend tests.
Provides shared setup for database, authentication, and test client.
"""

import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import app dependencies
from app.main import app
from app.database import Base, get_db

# Test database configuration
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine for the entire test session."""
    engine = create_engine(
        TEST_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provide database session for each test function."""
    connection = test_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = Session()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Provide FastAPI test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    """Create and register a test user."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "full_name": "Test User"
        }
    )
    return {
        "email": "testuser@example.com",
        "password": "TestPass123!",
        "user_id": response.json()["user"]["id"]
    }


@pytest.fixture
def auth_token(client, registered_user):
    """Get authentication token for registered user."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"]
        }
    )
    return response.json()["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Provide authorization headers with token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_token(client):
    """Get admin authentication token."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@dermasoul.ai",
            "password": "AdminPass123!"
        }
    )
    if response.status_code == 200:
        return response.json()["token"]
    return None


@pytest.fixture
def admin_headers(admin_token):
    """Provide admin authorization headers."""
    if admin_token:
        return {"Authorization": f"Bearer {admin_token}"}
    return None
