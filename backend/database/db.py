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
    
    # Check if DB_PATH exists and see if categories has parent_id column
    if os.path.exists(DB_PATH):
        try:
            with get_db() as conn:
                # Check if categories table exists first
                table_check = conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
                ).fetchone()
                if table_check:
                    cursor = conn.execute("PRAGMA table_info(categories)")
                    columns = [row["name"] for row in cursor.fetchall()]
                    if "parent_id" not in columns:
                        print("Schema upgrade required: parent_id missing. Dropping old tables...")
                        # Drop tables in safe order
                        conn.execute("DROP TABLE IF EXISTS items")
                        conn.execute("DROP TABLE IF EXISTS category_bookmarks")
                        conn.execute("DROP TABLE IF EXISTS location_bookmarks")
                        conn.execute("DROP TABLE IF EXISTS categories")
                        conn.execute("DROP TABLE IF EXISTS locations")
                        conn.execute("DROP TABLE IF EXISTS inventory_logs")
        except Exception as e:
            print(f"Warning during schema validation check: {e}")

    with get_db() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
