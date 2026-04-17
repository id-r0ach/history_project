"""
Persistent SQLite-backed chat history store.
"""

import os
import sqlite3
from pathlib import Path
from typing import TypedDict

# Database file lives in backend data dir by default inside the container.
DB_PATH = Path(os.getenv("DB_PATH", "/app/data/chat_history.db"))


class Message(TypedDict):
    role: str
    content: str


def init_db() -> None:
    """Create the messages table if it does not exist yet."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT    NOT NULL,
                role       TEXT    NOT NULL,
                content    TEXT    NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_session_id ON messages (session_id)
            """
        )
        conn.commit()


class SessionStore:
    """Simple SQLite session storage used across the backend."""

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def get_or_create(self, session_id: str, system_prompt: str) -> list[Message]:
        """
        Return session history, creating a new session with a system prompt if needed.

        Existing sessions also receive a refreshed system prompt so prompt changes
        apply immediately without forcing users to start a brand new chat.
        """
        history = self.get_history(session_id)

        if not history:
            self._insert(session_id, "system", system_prompt)
            return self.get_history(session_id)

        if history[0]["role"] == "system" and history[0]["content"] != system_prompt:
            self._update_first_system_message(session_id, system_prompt)
            return self.get_history(session_id)

        return history

    def append_user(self, session_id: str, content: str) -> None:
        self._insert(session_id, "user", content)

    def append_assistant(self, session_id: str, content: str) -> None:
        self._insert(session_id, "assistant", content)

    def get_history(self, session_id: str) -> list[Message]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
                (session_id,),
            ).fetchall()
        return [Message(role=row["role"], content=row["content"]) for row in rows]

    def delete(self, session_id: str) -> bool:
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM messages WHERE session_id = ?",
                (session_id,),
            )
            conn.commit()
        return cursor.rowcount > 0

    def rollback_last_user_message(self, session_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                DELETE FROM messages
                WHERE id = (
                    SELECT id FROM messages
                    WHERE session_id = ? AND role = 'user'
                    ORDER BY id DESC
                    LIMIT 1
                )
                """,
                (session_id,),
            )
            conn.commit()

    @property
    def active_sessions(self) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(DISTINCT session_id) AS cnt FROM messages"
            ).fetchone()
        return row["cnt"] if row else 0

    def _insert(self, session_id: str, role: str, content: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
                (session_id, role, content),
            )
            conn.commit()

    def _update_first_system_message(self, session_id: str, content: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE messages
                SET content = ?
                WHERE id = (
                    SELECT id FROM messages
                    WHERE session_id = ? AND role = 'system'
                    ORDER BY id ASC
                    LIMIT 1
                )
                """,
                (content, session_id),
            )
            conn.commit()


session_store = SessionStore()
