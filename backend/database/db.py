import sqlite3
import os
from contextlib import contextmanager

# Define paths relative to this file
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "inventory.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

@contextmanager
def get_db():
    """
    Context manager to obtain a SQLite connection.
    Enforces foreign keys and returns dictionary-like rows.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Crucial for SQLite foreign key constraint enforcement
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    else:
        conn.commit()
    finally:
        conn.close()

def init_db():
    """Reads schema.sql and initializes the SQLite tables and seeds."""
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Schema SQL file not found at {SCHEMA_PATH}")
    
    print(f"Initializing database at: {DB_PATH}")
    with get_db() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
