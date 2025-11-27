import pytest


def test_unregister_success(client):
    # Sanity check: participant exists initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert "Chess Club" in activities
    assert "michael@mergington.edu" in activities["Chess Club"]["participants"]

    # Unregister michael from Chess Club
    unregister_resp = client.delete("/activities/Chess%20Club/unregister?email=michael@mergington.edu")
    assert unregister_resp.status_code == 200
    assert "message" in unregister_resp.json()

    # Verify removed
    resp2 = client.get("/activities")
    activities2 = resp2.json()
    assert "michael@mergington.edu" not in activities2["Chess Club"]["participants"]


def test_unregister_not_signed_up(client):
    # try to unregister someone who isn't in the activity
    resp = client.delete("/activities/Chess%20Club/unregister?email=noone@example.com")
    assert resp.status_code == 400


def test_unregister_activity_not_found(client):
    resp = client.delete("/activities/NotAnActivity/unregister?email=test@example.com")
    assert resp.status_code == 404
