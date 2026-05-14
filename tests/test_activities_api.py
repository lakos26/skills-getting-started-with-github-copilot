from src.app import activities


def test_get_activities_returns_all_activities(client):
    response = client.get("/activities")

    assert response.status_code == 200

    payload = response.json()
    assert len(payload) == 9
    assert "Chess Club" in payload

    chess_club = payload["Chess Club"]
    assert chess_club["description"] == "Learn strategies and compete in chess tournaments"
    assert chess_club["schedule"] == "Fridays, 3:30 PM - 5:00 PM"
    assert chess_club["max_participants"] == 12
    assert isinstance(chess_club["participants"], list)


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_signup_adds_participant_to_activity(client):
    activity_name = "Basketball"
    email = "new.student@mergington.edu"

    before_count = len(activities[activity_name]["participants"])

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]
    assert len(activities[activity_name]["participants"]) == before_count + 1


def test_signup_returns_404_for_unknown_activity(client):
    response = client.post("/activities/Robotics/signup", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_returns_400_for_duplicate_registration(client):
    activity_name = "Basketball"
    email = activities[activity_name]["participants"][0]

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}


def test_unregister_removes_participant_from_activity(client):
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    before_count = len(activities[activity_name]["participants"])

    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]
    assert len(activities[activity_name]["participants"]) == before_count - 1


def test_unregister_returns_404_for_unknown_activity(client):
    response = client.delete("/activities/Robotics/signup", params={"email": "student@mergington.edu"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_returns_400_for_missing_participant(client):
    response = client.delete(
        "/activities/Basketball/signup",
        params={"email": "not-registered@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Student is not signed up for this activity"}
