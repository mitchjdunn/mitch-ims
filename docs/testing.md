# Testing Strategy & Test Cases

This document details the testing architecture of the personal Inventory Management System (IMS). It explains the different testing layers (API Unit/Integration, End-to-End Browser, and Manual Verification), the tools used, and the specific test cases covered.

---

## 1. API Integration & Unit Testing

The primary test suite resides in the [tests/test_main.py](file:///Users/mitch/projects/ims/tests/test_main.py) file. It uses Python's standard `unittest` framework and FastAPI's `TestClient` to perform synchronous, network-isolated validation checks directly on the API routing layer.

### 1.1 Test Isolation & Fixtures
- **Isolated Database**: To avoid modifying production inventory records, the test class overrides the database path dynamically:
  ```python
  import database.db
  database.db.DB_PATH = "test_inventory.db"
  ```
- **Automatic Setup/Teardown**: On startup (`setUpClass`), the test script cleans any existing test database and calls `init_db()` to create fresh tables and seed data. On shutdown (`tearDownClass`), the temporary `test_inventory.db` file is deleted.

### 1.2 Test Cases Covered

#### A. Seed Verification (`test_01_read_categories_seeds`)
- **Action**: Fetch all categories on startup.
- **Assertion**: Asserts that default seeded categories (*Electronics*, *Tools*, *Kitchenware*, *Books & Media*, *Office Supplies*, *Miscellaneous*) exist and match standard IDs.

#### B. Category Creation & Constraints (`test_02_create_category_constraints`)
- **Action**: Create a valid category (`Gardening`), a duplicate category, and an invalid category (empty string/whitespace).
- **Assertion**:
  - Valid category returns HTTP 201 and contains its auto-incremented ID.
  - Duplicate category names are caught by SQLite unique constraints and return HTTP 409.
  - Empty or whitespace-only names are caught by validation and return HTTP 422.

#### C. Location Creation & Constraints (`test_03_create_location_constraints`)
- **Action**: Create a physical location (`Backyard Shed`) and try to create a duplicate.
- **Assertion**:
  - Valid location returns HTTP 201.
  - Duplicate location names fail and return HTTP 409.

#### D. Item Creation & Schema Validation (`test_04_create_item_flow`)
- **Action**: Submit item payloads (e.g. name, category, location, quantity, status, price).
- **Assertion**:
  - Valid item returns HTTP 201 and resolves category/location name references on output.
  - Negative quantities (e.g., `-5`) fail validation and return HTTP 422.
  - Status strings not matching the schema list (e.g. `'on_loan'`) fail validation and return HTTP 422.
  - Confirms an audit log with action `'create'` is automatically written to `inventory_logs`.

#### E. Item Updates & Audit Trails (`test_05_update_item_audit_log_flow`)
- **Action**: Modify an item's quantity, status, and physical location.
- **Assertion**:
  - Updates return HTTP 200 with new data.
  - Three distinct transaction log rows are written: `update_quantity`, `update_location`, and `update_status`.
  - Asserts that status transition data (e.g., `'in_stock'` ➔ `'low_stock'`) is recorded accurately.

#### F. Item Deletion (`test_06_delete_item_audit_log_flow`)
- **Action**: Delete an existing item ID and attempt to fetch it again.
- **Assertion**:
  - Delete returns HTTP 200.
  - Subsequence GET request for the same ID returns HTTP 404.
  - Asserts that a log with action `'delete'` and item name is recorded in the activity table.

---

## 2. End-to-End (E2E) Browser Testing

Visual and functional end-to-end user journeys are validated using **Playwright / Chromium headless browser automation** via the Antigravity `browser_subagent`.

### 2.1 E2E Test Flow
The browser agent executes the following steps:
1. Navigates to [http://localhost:3000/](http://localhost:3000/) (Frontend UI server).
2. Asserts the page title "IMS" and light glassmorphic headers are loaded.
3. Clicks the "Add Item" button to summon the `<dialog>` element.
4. Inputs form values (Name: `Laser Cutter`, Category: `Electronics`, Location: `Garage Workbench`, Qty: `1`, Price: `499.99`).
5. Submits the form.
6. Asserts the item card is appended to the dashboard grid layout.
7. Clicks the "Electronics" sidebar category chip.
8. Asserts that the grid filters correctly, showing the item card.
9. Inspects the right-hand "Activity Log" drawer to confirm the creation event lists the transaction description correctly.

---

## 3. Manual Verification & QA Checklist

In addition to automated tests, the following visual indicators should be verified manually during development cycles:

- **Form Validation UI States**: Focus on a field, insert invalid data (e.g., negative price), and check that browser validation displays the red border via CSS `:user-invalid` / `.was-validated` classes and reveals the helper warning message.
- **Light Dismiss Dialogs**: Click anywhere on the soft translucent backdrop outside a dialog popup and confirm that the modal closes automatically.
- **Responsive Layout Check**: Resize the browser window to less than `1200px` (drawer collapses to bottom panel) and less than `768px` (sidebar hides, header stacks vertically) and verify that layout grid remains readable.
- **Scrollbar Thumb distinctness**: Scroll lists and drawer sections to verify custom scrollbar colors remain visible on the light background.
