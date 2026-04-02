"""
services/session.py — постоянное хранилище истории диалогов на SQLite.

Используем стандартную библиотеку Python (sqlite3) — никаких новых зависимостей.
База данных создаётся автоматически в файле chat_history.db рядом с main.py.
"""

import sqlite3
from pathlib import Path
from typing import TypedDict
import os

# Путь к файлу БД — корень папки backend
DB_PATH = Path(os.getenv("DB_PATH", "/app/data/chat_history.db"))


class Message(TypedDict):
    role: str      # "system" | "user" | "assistant"
    content: str


def init_db() -> None:
    """
    Создаёт таблицу messages, если она ещё не существует.
    Вызывается один раз при старте FastAPI через lifespan.
    """
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT    NOT NULL,
                role       TEXT    NOT NULL,
                content    TEXT    NOT NULL
            )
        """)
        # Индекс ускоряет выборку по session_id
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_session_id ON messages (session_id)
        """)
        conn.commit()


class SessionStore:
    """
    Читает и пишет историю сообщений в SQLite.
    Каждый вызов открывает соединение и сразу закрывает его —
    просто и надёжно для однопоточного учебного проекта.
    """

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # доступ к полям по имени
        return conn

    # ------------------------------------------------------------------
    # Публичный API (тот же интерфейс, что был у in-memory версии)
    # ------------------------------------------------------------------

    def get_or_create(self, session_id: str, system_prompt: str) -> list[Message]:
        """
        Возвращает историю сессии из БД.
        Если сессия новая — записывает system prompt первым сообщением.
        """
        history = self.get_history(session_id)

        if not history:
            # Новая сессия — сохраняем system prompt
            self._insert(session_id, "system", system_prompt)
            history = self.get_history(session_id)

        return history

    def append_user(self, session_id: str, content: str) -> None:
        """Сохраняет сообщение пользователя в БД."""
        self._insert(session_id, "user", content)

    def append_assistant(self, session_id: str, content: str) -> None:
        """Сохраняет ответ ассистента в БД."""
        self._insert(session_id, "assistant", content)

    def get_history(self, session_id: str) -> list[Message]:
        """Возвращает все сообщения сессии в порядке добавления."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id",
                (session_id,),
            ).fetchall()
        return [Message(role=row["role"], content=row["content"]) for row in rows]

    def delete(self, session_id: str) -> bool:
        """Удаляет все сообщения сессии. Возвращает True если они были."""
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM messages WHERE session_id = ?",
                (session_id,),
            )
            conn.commit()
        return cursor.rowcount > 0

    def rollback_last_user_message(self, session_id: str) -> None:
        """
        Удаляет последнее сообщение пользователя если API вернул ошибку.
        Так история не «застревает» в невалидном состоянии.
        """
        with self._connect() as conn:
            conn.execute("""
                DELETE FROM messages
                WHERE id = (
                    SELECT id FROM messages
                    WHERE session_id = ? AND role = 'user'
                    ORDER BY id DESC
                    LIMIT 1
                )
            """, (session_id,))
            conn.commit()

    @property
    def active_sessions(self) -> int:
        """Количество уникальных сессий в БД."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(DISTINCT session_id) AS cnt FROM messages"
            ).fetchone()
        return row["cnt"] if row else 0

    # ------------------------------------------------------------------
    # Приватный хелпер
    # ------------------------------------------------------------------

    def _insert(self, session_id: str, role: str, content: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
                (session_id, role, content),
            )
            conn.commit()


# Синглтон — используется во всём приложении
session_store = SessionStore()
