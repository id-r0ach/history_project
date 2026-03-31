# 🔴 СССР — Диалоги с историей

Веб-сервис для диалогов с историческими личностями СССР на базе модели Qwen 2.5.

## Стек технологий

| Слой      | Технологии                                         |
|-----------|----------------------------------------------------|
| Backend   | Python 3.10+, FastAPI, httpx, SQLAlchemy, Alembic  |
| AI Model  | Qwen 2.5 (OpenAI-compatible API via DashScope)     |
| Database  | PostgreSQL + asyncpg                               |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, Lucide   |

---

## Структура проекта

```
soviet-history-chat/
├── backend/
│   ├── characters/
│   │   ├── __init__.py
│   │   └── data.py          # Персонажи и их system prompts
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Pydantic Settings из .env
│   ├── services/
│   │   ├── __init__.py
│   │   └── qwen.py          # Async клиент для Qwen API
│   ├── main.py              # FastAPI приложение, CORS, эндпоинты
│   ├── schemas.py           # Pydantic модели запросов/ответов
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CharacterSidebar.tsx
    │   │   ├── ChatWindow.tsx
    │   │   ├── MessageBubble.tsx
    │   │   └── TypingIndicator.tsx
    │   ├── services/
    │   │   └── api.ts       # Typed API client
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts
    └── tsconfig.json
```

---

## Быстрый старт

### 1. Настройка Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate        # Linux/macOS
# или: venv\Scripts\activate   # Windows

# Установить зависимости
pip install -r requirements.txt

# Создать .env на основе примера
cp .env.example .env
# Отредактировать .env — вставить QWEN_API_KEY

# Запустить сервер
uvicorn main:app --reload --port 8000
```

Документация API: http://localhost:8000/docs

### 2. Настройка Frontend

```bash
cd frontend

npm install
npm run dev
```

Приложение: http://localhost:5173

---

## API Эндпоинты

| Метод | Путь               | Описание                          |
|-------|--------------------|-----------------------------------|
| GET   | `/api/characters`  | Список доступных персонажей       |
| POST  | `/api/chat`        | Отправить сообщение персонажу     |
| GET   | `/health`          | Проверка состояния сервера        |

### POST `/api/chat`

**Request:**
```json
{
  "character_id": "khrushchev",
  "message": "Расскажите о Карибском кризисе"
}
```

**Response:**
```json
{
  "character_id": "khrushchev",
  "reply": "Товарищ, это был напряжённый момент...",
  "model": "qwen2.5-72b-instruct"
}
```

---

## Персонажи

| ID           | Имя               | Роль                                          |
|--------------|-------------------|-----------------------------------------------|
| `khrushchev` | Никита Хрущёв     | Первый секретарь ЦК КПСС (1953–1964)          |
| `stalin`     | Иосиф Сталин      | Генеральный секретарь ВКП(б)/КПСС (1922–1953) |
| `lenin`      | Владимир Ленин    | Председатель Совнаркома (1917–1924)            |

---

## Переменные окружения

```env
QWEN_API_KEY=        # API ключ DashScope (обязательно)
QWEN_BASE_URL=       # https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=          # qwen2.5-72b-instruct
DATABASE_URL=        # postgresql+asyncpg://user:pass@host:5432/db
ALLOWED_ORIGINS=     # http://localhost:5173
```
