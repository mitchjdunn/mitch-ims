# Feature: Filter Bookmarking (Categories & Locations)

## 1. Overview
Currently, the personal Inventory Management System (IMS) lists all categories and locations in the left-hand sidebar under their respective filter headings. As the inventory grows, the list of categories and locations can become very long and clutter the sidebar. 

This feature introduces the ability to "bookmark" favorite or frequently-used categories and locations. Bookmarked values will remain pinned to the screen (always visible), while non-bookmarked values can be collapsed or hidden to keep the interface clean and focused.

## 2. User Stories
- **As a** user, **I want to** select my most active categories and locations as "bookmarked" **so that** they appear as quick filter buttons on the sidebar.
- **As a** user, **I want to** toggle a "Show Bookmarked Only" view **so that** only my bookmarked categories and locations are displayed as filter buttons (chips), hiding the rest of the long list.
- **As a** user, **I want to** edit my bookmarked list via a clean modal selection **so that** I can easily add or remove items from my quick filter bookmarks.
- **As a** user, **I want** my bookmarked selections and filter states to persist across page reloads.

## 3. UI/UX & Styling Requirements
- **Bookmark and Edit Buttons next to "All Categories" / "All Locations"**:
  - We will render two buttons inline next to the "All Categories" and "All Locations" filter chips in the sidebar:
    1. **Show/Hide Bookmarks Toggle (`🔖`)**: Toggles the display state for that sidebar list. When active, only bookmarked categories or locations are rendered as filter buttons. When inactive, all categories/locations are rendered.
    2. **Edit Bookmarks Button (`⚙️` or `✏️`)**: Opens a modal dialog checklist with all options, allowing the user to select/deselect which items are bookmarked.
- **Individual Filter Buttons**:
  - The bookmarked items are listed as standard button chips. Clicking one filters the inventory product list by that category or location, just like before.
- **Persistence**:
  - Bookmarked category IDs, bookmarked locationIds, and the toggle visibility states (`showBookmarkedCategoriesOnly`, `showBookmarkedLocationsOnly`) are saved to and loaded from `localStorage`.

## 4. API Endpoints
- **GET `/api/v1/bookmarks/categories`**: Retrieves the list of bookmarked category IDs (returns a list of integers).
- **PUT `/api/v1/bookmarks/categories`**: Updates the set of bookmarked categories. Request body: `{"category_ids": [1, 3]}`.
- **GET `/api/v1/bookmarks/locations`**: Retrieves the list of bookmarked location IDs (returns a list of integers).
- **PUT `/api/v1/bookmarks/locations`**: Updates the set of bookmarked locations. Request body: `{"location_ids": [2, 5]}`.

## 5. Database Schema Changes
Two new tables are created in the database to track bookmarks with cascading deletes:
```sql
CREATE TABLE IF NOT EXISTS category_bookmarks (
    category_id INTEGER PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS location_bookmarks (
    location_id INTEGER PRIMARY KEY REFERENCES locations(id) ON DELETE CASCADE
);
```

## 6. QA & Verification Checklist
- [ ] Verify that clicking the bookmark button next to "All Categories" or "All Locations" opens the bookmark management modal.
- [ ] Verify that selecting categories/locations in the modal and saving them updates the sidebar to only show those bookmarked values when filtered.
- [ ] Verify that bookmarks persist after refreshing the browser window.
- [ ] Verify that clearing bookmarks restores the default view where all options are visible.
