# Feature: Hierarchical Filters (Sub-categories & Sub-locations)

## 1. Overview
Items and locations are often nested (e.g., "Electronics > Components > Resistors" or "Garage > Workbench > Drawer 1"). This feature implements hierarchical relationships:
1. **Unbounded Nesting**: Categories and locations can have parents and child sub-items to arbitrary levels.
2. **Recursive CTE Database Queries**: Filtering by a parent category/location recursively searches and displays items belonging to all of its child sub-categories/sub-locations.
3. **Indented Sidebar Tree**: Renders the hierarchy in the left sidebar using clean visual nesting.

---

## 2. User Stories
- **As a** user, **I want to** configure a parent for categories or locations **so that** I can represent nested structures.
- **As a** user, **I want to** click a parent category chip (e.g., "Electronics") in the sidebar and **view all items** belonging to that category and any of its children (e.g., "Cables" or "Processors").
- **As a** user, **I want** the sidebar to show nested sub-categories indented beneath their parent **so that** I can easily understand my organization tree.

---

## 3. UI/UX & Styling Requirements
- **Sidebar Nested Render**:
  - Rather than a flat list, sidebar items are mapped recursively.
  - Sub-items are indented by 16px per depth level (e.g. `padding-left: calc(var(--spacing-md) + 16px * depth)`).
  - Add collapsible toggle buttons next to parents with children to show/hide sub-trees.
- **Breadcrumbs in Lists**:
  - Show category and location names as full paths: `Parent Category > Child Category`.

---

## 4. API Endpoints
- **GET `/api/v1/items`**:
  - Updated query parameter parsing:
    - If `category_id` is passed, the backend uses a recursive Common Table Expression (CTE) to retrieve all items belonging to that category ID or any of its descendant sub-category IDs.
    - If `location_id` is passed, it performs a similar recursive CTE fetch.

---

## 5. Database Schema Changes
- `categories` and `locations` tables are updated with `parent_id` foreign keys:
```sql
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, parent_id)
);

CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    description TEXT,
    parent_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, parent_id)
);
```
- Multi-column unique indices ensure names are unique at the same sub-level:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_root_name ON categories(name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_root_name ON locations(name) WHERE parent_id IS NULL;
```

---

## 6. QA & Verification Checklist
- [ ] Verify database schema successfully creates tables with `parent_id` self-references.
- [ ] Verify recursive CTE query in `GET /api/v1/items` returns items in child categories when parent is filtered.
- [ ] Verify parent-child cycles are prevented in updates (cannot set an item's parent to be itself or one of its descendants).
- [ ] Verify sidebar indents child chips appropriately and collapsible toggles work.
