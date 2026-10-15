import sqlite3
import os
import shutil
from pathlib import Path

# Database path: on Vercel serverless, root directory is read-only so use /tmp
if os.environ.get("VERCEL"):
    TMP_DIR = Path("/tmp")
    DB_PATH = TMP_DIR / "fest.db"
    ORIG_DB = Path(__file__).parent.parent / "fest.db"
    if not DB_PATH.exists() and ORIG_DB.exists():
        shutil.copy2(ORIG_DB, DB_PATH)
else:
    DB_PATH = Path(__file__).parent.parent / "fest.db"

def get_db_connection() -> sqlite3.Connection:
    """Provide a sqlite3 connection configured with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            event_time TEXT NOT NULL,
            venue TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            fee INTEGER NOT NULL DEFAULT 0,
            icon TEXT
        );
    """)

    # 2. Registrations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL REFERENCES events(id),
            student_name TEXT NOT NULL,
            roll_number TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            registered_at TEXT NOT NULL,
            UNIQUE(event_id, email)
        );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema initialized successfully in fest.db")
