from fastapi.testclient import TestClient
import pytest
import copy

import src.app as app_module
from src.app import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities object for each test so tests are isolated
    original = copy.deepcopy(app_module.activities)
    try:
        yield
    finally:
        app_module.activities = original
