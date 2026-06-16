-- Database schema for Inventory Management System (SQLite)

-- Enforce foreign keys (must also be run at connection time in SQLite)
PRAGMA foreign_keys = ON;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, parent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_root_name ON categories(name) WHERE parent_id IS NULL;

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT,
    parent_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, parent_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_root_name ON locations(name) WHERE parent_id IS NULL;

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 0),
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'low_stock', 'out_of_stock', 'borrowed', 'lost')),
    serial_number TEXT,
    model_number TEXT,
    purchase_date TEXT, -- ISO8601 string (YYYY-MM-DD)
    purchase_price REAL CHECK(purchase_price IS NULL OR purchase_price >= 0),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory logs for audit trail
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER, -- Retained even if item is deleted
    item_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('create', 'update_quantity', 'update_location', 'update_status', 'delete', 'check_out', 'check_in', 'update_details')),
    previous_quantity INTEGER,
    new_quantity INTEGER,
    previous_location TEXT,
    new_location TEXT,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks tables for categories and locations
CREATE TABLE IF NOT EXISTS category_bookmarks (
    category_id INTEGER PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS location_bookmarks (
    location_id INTEGER PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE
);

-- Triggers to auto-update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
AFTER UPDATE ON categories
FOR EACH ROW
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_locations_timestamp 
AFTER UPDATE ON locations
FOR EACH ROW
BEGIN
    UPDATE locations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_items_timestamp 
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Seed data: default categories and locations
INSERT OR IGNORE INTO categories (id, name, description) VALUES 
(1, 'Electronics', 'Devices, gadgets, components, and cables'),
(2, 'Tools', 'Hand tools, power tools, and hardware'),
(3, 'Kitchenware', 'Cooking utensils, appliances, and pantry storage'),
(4, 'Books & Media', 'Physical books, guides, and document folders'),
(5, 'Office Supplies', 'Pens, paper, envelopes, and desk items'),
(6, 'Miscellaneous', 'Other items that do not fit standard categories');

INSERT OR IGNORE INTO locations (id, name, description) VALUES 
(1, 'Kitchen Pantry', 'Main food and kitchen storage pantry'),
(2, 'Living Room Shelf', 'Bookshelf in the main living room area'),
(3, 'Garage Workbench', 'Main tool storage area and workbench in the garage'),
(4, 'Office Desk', 'Primary work desk and drawers'),
(5, 'Bedroom Closet', 'Storage shelves in the master bedroom closet'),
(6, 'Storage Box A', 'Plastic storage bin labeled A in garage');
