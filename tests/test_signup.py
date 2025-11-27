def test_signup_success(client):
    # ensure starter participant not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    activities = resp.json()
    assert "Chess Club" in activities
    assert "newstudent@example.com" not in activities["Chess Club"]["participants"]

    # Sign up a new email
    signup_resp = client.post("/activities/Chess%20Club/signup?email=newstudent@example.com")
    assert signup_resp.status_code == 200
    assert "Signed up newstudent@example.com" in signup_resp.json().get("message", "")

    # Verify participant added
    resp2 = client.get("/activities")
    activities2 = resp2.json()
    assert "newstudent@example.com" in activities2["Chess Club"]["participants"]


def test_signup_duplicate(client):
    # Michael is already in Chess Club based on initial data
    resp = client.post("/activities/Chess%20Club/signup?email=michael@mergington.edu")
    assert resp.status_code == 400


def test_signup_activity_not_found(client):
    resp = client.post("/activities/NoSuchActivity/signup?email=test@example.com")
    assert resp.status_code == 404
