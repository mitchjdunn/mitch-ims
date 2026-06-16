# Feature: Form Simplification & List View Layout

## 1. Overview
As the IMS system matures, layout changes are needed to streamline item logging and display. This feature includes:
1. **Vertical-Only Form Fitting**: Refactoring the Add/Edit Item popup form to prevent horizontal scrolling and ensure it fits within the browser window.
2. **Simplified Fields**: Removing purchase information (purchase date, purchase price), serial numbers, and model numbers from the item form.
3. **List View Transformation**: Replacing the items card-grid display with a clean, row-based list/table format to display bulk items clearly.
4. **Header Cleanup**: Removing the aggregated statistics dashboard widgets from the top header to maximize screen space.

---

## 2. User Stories
- **As a** user, **I want to** fill out the item form without horizontal scrolling or screen overflows **so that** data entry is comfortable.
- **As a** user, **I want** the item form to contain only essential fields (Name, Description, Category, Location, Quantity, Status, Notes) **so that** logging items is fast and lightweight.
- **As a** user, **I want to** view my inventory as a list table **so that** I can scan many items rapidly, see their nested locations, and edit/delete them inline.
- **As a** user, **I want** a cleaner screen layout without unused statistics widgets **so that** the app feels spacious.

---

## 3. UI/UX & Styling Requirements
- **Item Form Restructuring**:
  - Remove input blocks for `serial_number`, `model_number`, `purchase_date`, and `purchase_price`.
  - Arrange remaining fields in a single-column layout for small viewports, or a compact dual-column layout. Set dialog width to `max-width: 550px` with vertical scroll only (`overflow-y: auto`, `overflow-x: hidden`).
- **List View Layout**:
  - Re-style `.items-view` grid into vertical rows.
  - Columns within the row:
    - **Status Indicator**: Colored status indicator pill.
    - **Item Info**: Bold name, and description underneath.
    - **Location & Category Paths**: Breadcrumb style (`Category > Sub-category`).
    - **Quantity**: Large aligned digit.
    - **Actions**: Inline `Edit` and `Delete` buttons at the right end of the row.
  - Add borders between rows and a subtle background change on hover.
- **Header Cleanup**:
  - Remove `.stats-container` and its constituent `.stat-card` wrappers entirely.

---

## 4. API Endpoints
None. Uses existing items REST endpoints.

---

## 5. Database Schema Changes
None (the schema columns remain for backup consistency, but are not exposed in the frontend forms).

---

## 6. QA & Verification Checklist
- [ ] Verify form fits within standard dialog sizes without horizontal scrollbars.
- [ ] Verify serial number, model number, purchase price, and purchase date input fields are removed from the HTML.
- [ ] Verify the header stats widgets are gone and logo-area takes full height alignment.
- [ ] Verify items render in list view rows, maintaining fully responsive vertical alignment.
- [ ] Verify inline Edit/Delete actions in list rows function correctly.
