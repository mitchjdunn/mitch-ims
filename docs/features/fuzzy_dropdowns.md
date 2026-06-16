# Feature: Fuzzy Search Dropdowns (Categories & Locations)

## 1. Overview
Selecting categories and locations from a static dropdown select element becomes tedious when the list is long. This feature replaces standard HTML select elements in the item form with custom React dropdown controls that feature:
1. **Fuzzy Search**: Type in the box to dynamically filter matching names.
2. **Bookmarked Items**: Show bookmarked categories/locations at the top of the list for quick access.
3. **Inline Creation**: A "＋ Create [search text]" button appears if the typed name does not exist, enabling users to register categories and locations on the fly.

---

## 2. User Stories
- **As a** user, **I want to** select categories and locations by typing their names **so that** I don't have to scroll through a large list.
- **As a** user, **I want to** see my bookmarked categories and locations at the top of the select dropdown **so that** I can pick my favorite folders instantly.
- **As a** user, **I want to** add a missing category/location directly from the select dropdown **so that** I don't have to interrupt my workflow to open another modal.

---

## 3. UI/UX & Styling Requirements
- **Custom Dropdown Selector**:
  - Resembles a clean input box showing the selected name (or placeholder).
  - Clicking it opens a glassmorphic floating panel underneath.
- **Fuzzy Search Input**:
  - The top of the floating panel has a text input field focused automatically.
- **Grouped Categories/Locations List**:
  - Group 1: "Bookmarks" (if any are set, highlighted with a star/bookmark icon).
  - Group 2: "All Options" (showing full hierarchy paths).
- **Inline Create Option**:
  - If the typed search string has no exact match, the last item in the list shows: `＋ Create "Search Text"`.
  - Clicking this saves the category/location and automatically selects it.

---

## 4. API Endpoints
Uses the standard categories/locations endpoints:
- `POST /api/v1/categories` (adding a new category inline).
- `POST /api/v1/locations` (adding a new location inline).

---

## 5. Database Schema Changes
None (utilizes existing table structures).

---

## 6. QA & Verification Checklist
- [ ] Verify that bookmarked category IDs appear in a pinned section at the top of the category select box.
- [ ] Verify that typing a search term filters the options list dynamically (case-insensitive fuzzy search).
- [ ] Verify that typing a name that does not exist renders the `＋ Create` option.
- [ ] Verify that clicking `＋ Create` calls the API, saves the record, closes the dropdown, and selects the new category.
