"""Comprehensive backend API test suite."""

import io
import os
import unittest
from fastapi.testclient import TestClient

from pathlib import Path

TEST_DB_PATH = Path(__file__).resolve().parent.parent / "test.db"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink(missing_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-purposes-only"
os.environ["GEMINI_MODEL"] = "gemini-3.6-flash"
# Empty key => tests always use the offline mock path (no network, no API cost).
os.environ["GEMINI_API_KEY"] = ""

from app.database import Base, engine, get_db
from app.main import app
from app.services.ai_service import is_gemini_configured
from app.services.quiz_service import generate_quiz_questions, grade_quiz


class APITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if TEST_DB_PATH.exists():
            try:
                TEST_DB_PATH.unlink(missing_ok=True)
            except Exception:
                pass

    def setUp(self):
        # Unique email per test
        self.email = f"student_{self._testMethodName.lower()}@example.com"
        self.password = "StudyPassword123!"
        self.full_name = "Test Student"

        # Register and login
        signup_res = self.client.post(
            "/api/auth/signup",
            json={
                "full_name": self.full_name,
                "email": self.email,
                "password": self.password,
            },
        )
        self.assertEqual(signup_res.status_code, 201)

        login_res = self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password},
        )
        self.assertEqual(login_res.status_code, 200)
        self.token = login_res.json()["access_token"]
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "ai-study-assistant-backend")
        self.assertIn("gemini_configured", data)
        self.assertIn("gemini_model", data)
        self.assertEqual(data["gemini_model"], "gemini-3.6-flash")

    def test_auth_me_and_profile_update(self):
        res = self.client.get("/api/auth/me", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], self.email)

        update_res = self.client.put(
            "/api/users/me",
            headers=self.auth_headers,
            json={"full_name": "Updated Name"},
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["full_name"], "Updated Name")

    def test_notes_crud_and_ai_enhance(self):
        # Create note
        res = self.client.post(
            "/api/notes",
            headers=self.auth_headers,
            json={"title": "Data Structures", "content": "Arrays, Linked Lists, Trees"},
        )
        self.assertEqual(res.status_code, 201)
        note_id = res.json()["id"]

        # List notes
        list_res = self.client.get("/api/notes", headers=self.auth_headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(any(n["id"] == note_id for n in list_res.json()))

        # Get single note
        get_res = self.client.get(f"/api/notes/{note_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["title"], "Data Structures")

        # Update note
        put_res = self.client.put(
            f"/api/notes/{note_id}",
            headers=self.auth_headers,
            json={"title": "Data Structures & Algorithms", "content": "Updated content"},
        )
        self.assertEqual(put_res.status_code, 200)
        self.assertEqual(put_res.json()["title"], "Data Structures & Algorithms")

        # Test AI enhance endpoint
        enhance_res = self.client.post(
            "/api/notes/ai-enhance",
            headers=self.auth_headers,
            json={
                "title": "Sorting Algorithms",
                "content": "Quicksort has O(n log n) average time complexity. Mergesort is stable.",
            },
        )
        self.assertEqual(enhance_res.status_code, 200)
        self.assertIn("enhanced_content", enhance_res.json())
        self.assertIn("used_mock_ai", enhance_res.json())

        # Delete note
        del_res = self.client.delete(f"/api/notes/{note_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 204)

    def test_quizzes_lifecycle_and_deletion(self):
        # Create manual quiz
        quiz_payload = {
            "title": "Python Basics",
            "description": "Introductory test",
            "questions": [
                {
                    "question_text": "Which keyword defines a function?",
                    "options": ["def", "func", "function", "lambda"],
                    "correct_answer": "def",
                    "explanation": "In Python, def defines a standard function.",
                },
                {
                    "question_text": "What is the boolean of empty string?",
                    "options": ["True", "False", "None", "Error"],
                    "correct_answer": "False",
                    "explanation": "Empty strings evaluate to False.",
                },
            ],
        }
        create_res = self.client.post("/api/quizzes", headers=self.auth_headers, json=quiz_payload)
        self.assertEqual(create_res.status_code, 201)
        quiz_data = create_res.json()
        quiz_id = quiz_data["id"]
        q1_id = quiz_data["questions"][0]["id"]
        q2_id = quiz_data["questions"][1]["id"]

        # Submit quiz
        submit_res = self.client.post(
            f"/api/quizzes/{quiz_id}/submit",
            headers=self.auth_headers,
            json={
                "answers": [
                    {"question_id": q1_id, "selected_option": "def"},
                    {"question_id": q2_id, "selected_option": "False"},
                ]
            },
        )
        self.assertEqual(submit_res.status_code, 200)
        result = submit_res.json()
        self.assertEqual(result["attempt"]["score"], 2)
        self.assertEqual(result["attempt"]["total_questions"], 2)
        self.assertEqual(len(result["questions"]), 2)
        self.assertTrue(result["questions"][0]["is_correct"])

        # Delete quiz
        del_res = self.client.delete(f"/api/quizzes/{quiz_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 204)

        # Confirm deleted
        get_res = self.client.get(f"/api/quizzes/{quiz_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 404)

    def test_chat_session_and_messages(self):
        # Create chat session
        session_res = self.client.post(
            "/api/chat/sessions",
            headers=self.auth_headers,
            json={"title": "Algorithms Revision"},
        )
        self.assertEqual(session_res.status_code, 201)
        session_id = session_res.json()["id"]

        # Send message
        msg_res = self.client.post(
            f"/api/chat/sessions/{session_id}/messages",
            headers=self.auth_headers,
            json={"content": "What is dynamic programming in computer science?"},
        )
        self.assertEqual(msg_res.status_code, 200)
        data = msg_res.json()
        self.assertIn("user_message", data)
        self.assertIn("assistant_message", data)
        self.assertIn("used_mock_ai", data)
        self.assertTrue(data["used_mock_ai"])  # no API key in tests -> mock reply

    def test_materials_upload_and_download(self):
        # Upload a markdown study material
        file_content = b"# Study Notes\n\nOperating systems manage hardware and software resources."
        files = {
            "file": ("notes.md", io.BytesIO(file_content), "text/markdown"),
        }
        data = {"title": "OS Summary", "description": "Operating system overview"}

        upload_res = self.client.post(
            "/api/materials/upload",
            headers=self.auth_headers,
            data=data,
            files=files,
        )
        self.assertEqual(upload_res.status_code, 201)
        mat_id = upload_res.json()["id"]

        # Download with Bearer header
        download_res = self.client.get(
            f"/api/materials/{mat_id}/download",
            headers=self.auth_headers,
        )
        self.assertEqual(download_res.status_code, 200)
        self.assertEqual(download_res.content, file_content)

        # Download with ?token= query parameter (for direct browser downloads)
        query_download_res = self.client.get(
            f"/api/materials/{mat_id}/download?token={self.token}",
        )
        self.assertEqual(query_download_res.status_code, 200)
        self.assertEqual(query_download_res.content, file_content)

        # Delete material
        del_res = self.client.delete(f"/api/materials/{mat_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 204)

    def test_dashboard_and_progress(self):
        dash_res = self.client.get("/api/dashboard", headers=self.auth_headers)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        self.assertIn("stats", dash_data)
        self.assertIn("user", dash_data)

        prog_res = self.client.get("/api/progress", headers=self.auth_headers)
        self.assertEqual(prog_res.status_code, 200)
        prog_data = prog_res.json()
        self.assertIn("total_notes", prog_data)
        self.assertIn("total_quizzes", prog_data)

    # ---- Forgot / reset password ----
    def _forgot(self, email):
        from unittest.mock import patch

        with patch("app.routers.auth.send_password_reset_email") as mocked:
            res = self.client.post("/api/auth/forgot-password", json={"email": email})
        return res, mocked

    def _token_from_mock(self, mocked):
        from urllib.parse import parse_qs, urlparse

        mocked.assert_called_once()
        reset_url = mocked.call_args.args[2]
        return parse_qs(urlparse(reset_url).query)["token"][0]

    def test_forgot_password_same_answer_for_unknown_email(self):
        known, known_mock = self._forgot(self.email)
        unknown, unknown_mock = self._forgot("nobody_registered_here@example.com")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(known.json(), unknown.json())
        known_mock.assert_called_once()
        self.assertEqual(known_mock.call_args.args[0], self.email)
        unknown_mock.assert_not_called()

    def test_forgot_password_cooldown(self):
        _, first = self._forgot(self.email)
        _, second = self._forgot(self.email)
        first.assert_called_once()
        second.assert_not_called()

    def test_reset_password_full_flow(self):
        _, mocked = self._forgot(self.email)
        token = self._token_from_mock(mocked)
        new_password = "BrandNewPass456!"

        ok = self.client.post("/api/auth/reset-password", json={"token": token, "new_password": new_password})
        self.assertEqual(ok.status_code, 200)

        old_login = self.client.post("/api/auth/login", json={"email": self.email, "password": self.password})
        self.assertEqual(old_login.status_code, 401)
        new_login = self.client.post("/api/auth/login", json={"email": self.email, "password": new_password})
        self.assertEqual(new_login.status_code, 200)

        # the link works only once
        again = self.client.post("/api/auth/reset-password", json={"token": token, "new_password": "AnotherPass789!"})
        self.assertEqual(again.status_code, 400)

    def test_reset_password_rejects_bad_tokens(self):
        garbage = self.client.post(
            "/api/auth/reset-password", json={"token": "not-a-real-token-123", "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(garbage.status_code, 400)
        # a normal login token must not be accepted as a reset token
        login_token = self.client.post(
            "/api/auth/reset-password", json={"token": self.token, "new_password": "BrandNewPass456!"}
        )
        self.assertEqual(login_token.status_code, 400)

    def test_reset_token_cannot_be_used_to_log_in(self):
        _, mocked = self._forgot(self.email)
        token = self._token_from_mock(mocked)
        me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me.status_code, 401)

    def test_reset_password_validates_new_password(self):
        _, mocked = self._forgot(self.email)
        token = self._token_from_mock(mocked)
        short = self.client.post("/api/auth/reset-password", json={"token": token, "new_password": "short"})
        self.assertEqual(short.status_code, 422)


if __name__ == "__main__":
    unittest.main()
