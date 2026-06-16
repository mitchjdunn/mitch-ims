import sqlite3
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import date
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from database.db import get_db, init_db

# Initialize database schema and seeds on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Inventory Management System API",
    description="Backend API for personal inventory tracking, categorization, and physical location mapping.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Validation ---

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique name of the category")
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None, description="Optional parent category ID")

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Category name cannot be empty or only whitespace")
        return v.strip()

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    created_at: str
    updated_at: str

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Unique physical location name")
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None, description="Optional parent location ID")

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Location name cannot be empty or only whitespace")
        return v.strip()

class LocationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    created_at: str
    updated_at: str

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Category name cannot be empty or only whitespace")
        return v.strip() if v else v

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Location name cannot be empty or only whitespace")
        return v.strip() if v else v

class CategoryBookmarksUpdate(BaseModel):
    category_ids: List[int] = Field(..., description="List of category IDs to bookmark")

class LocationBookmarksUpdate(BaseModel):
    location_ids: List[int] = Field(..., description="List of location IDs to bookmark")

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Name of the inventory item")
    description: Optional[str] = Field(None, max_length=1000)
    category_id: Optional[int] = Field(None, description="Reference to a category ID")
    location_id: Optional[int] = Field(None, description="Reference to a location ID")
    quantity: int = Field(1, ge=0, description="Current stock quantity")
    status: str = Field("in_stock", description="Status code of the item")
    serial_number: Optional[str] = Field(None, max_length=100)
    model_number: Optional[str] = Field(None, max_length=100)
    purchase_date: Optional[str] = Field(None, description="Date of purchase in YYYY-MM-DD format")
    purchase_price: Optional[float] = Field(None, ge=0.0, description="Unit cost of the item")
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Item name cannot be empty or only whitespace")
        return v.strip()

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: str) -> str:
        valid_statuses = {"in_stock", "low_stock", "out_of_stock", "borrowed", "lost"}
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        try:
            date.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Purchase date must be in YYYY-MM-DD ISO format")

class ItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    category_id: Optional[int] = Field(None)
    location_id: Optional[int] = Field(None)
    quantity: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None)
    serial_number: Optional[str] = Field(None, max_length=100)
    model_number: Optional[str] = Field(None, max_length=100)
    purchase_date: Optional[str] = Field(None)
    purchase_price: Optional[float] = Field(None, ge=0.0)
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Item name cannot be empty or only whitespace")
        return v.strip() if v else v

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_statuses = {"in_stock", "low_stock", "out_of_stock", "borrowed", "lost"}
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        try:
            date.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Purchase date must be in YYYY-MM-DD ISO format")

class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category_id: Optional[int]
    category_name: Optional[str]
    location_id: Optional[int]
    location_name: Optional[str]
    quantity: int
    status: str
    serial_number: Optional[str]
    model_number: Optional[str]
    purchase_date: Optional[str]
    purchase_price: Optional[float]
    notes: Optional[str]
    created_at: str
    updated_at: str

class LogResponse(BaseModel):
    id: int
    item_id: Optional[int]
    item_name: str
    action: str
    previous_quantity: Optional[int]
    new_quantity: Optional[int]
    previous_location: Optional[str]
    new_location: Optional[str]
    previous_status: Optional[str]
    new_status: Optional[str]
    notes: Optional[str]
    timestamp: str


# --- Helper Database Operations ---

def check_cycle(conn: sqlite3.Connection, table_name: str, entity_id: int, new_parent_id: Optional[int]) -> bool:
    if new_parent_id is None:
        return False
    if entity_id == new_parent_id:
        return True
    
    query = f"""
        WITH RECURSIVE descendants(id) AS (
            SELECT id FROM {table_name} WHERE parent_id = ?
            UNION ALL
            SELECT t.id FROM {table_name} t JOIN descendants d ON t.parent_id = d.id
        )
        SELECT 1 FROM descendants WHERE id = ?
    """
    cursor = conn.execute(query, (entity_id, new_parent_id))
    return cursor.fetchone() is not None

def get_location_name(conn: sqlite3.Connection, location_id: Optional[int]) -> Optional[str]:
    if not location_id:
        return None
    cursor = conn.execute("SELECT name FROM locations WHERE id = ?", (location_id,))
    row = cursor.fetchone()
    return row["name"] if row else None

def log_inventory_change(
    conn: sqlite3.Connection,
    item_id: Optional[int],
    item_name: str,
    action: str,
    prev_qty: Optional[int] = None,
    new_qty: Optional[int] = None,
    prev_loc: Optional[str] = None,
    new_loc: Optional[str] = None,
    prev_status: Optional[str] = None,
    new_status: Optional[str] = None,
    notes: Optional[str] = None
):
    conn.execute(
        """
        INSERT INTO inventory_logs (
            item_id, item_name, action, 
            previous_quantity, new_quantity, 
            previous_location, new_location, 
            previous_status, new_status, 
            notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (item_id, item_name, action, prev_qty, new_qty, prev_loc, new_loc, prev_status, new_status, notes)
    )


# --- API Endpoint Handlers ---

# --- Bookmarks Endpoints ---

@app.get("/api/v1/bookmarks/categories", response_model=List[int])
def read_category_bookmarks():
    with get_db() as conn:
        cursor = conn.execute("SELECT category_id FROM category_bookmarks")
        rows = cursor.fetchall()
        return [row["category_id"] for row in rows]

@app.put("/api/v1/bookmarks/categories", status_code=status.HTTP_200_OK)
def update_category_bookmarks(bookmarks: CategoryBookmarksUpdate):
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM category_bookmarks")
            for cid in bookmarks.category_ids:
                conn.execute("INSERT INTO category_bookmarks (category_id) VALUES (?)", (cid,))
        return {"detail": "Category bookmarks successfully updated."}
    except sqlite3.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category ID(s) provided. Database error: {str(e)}"
        )

@app.get("/api/v1/bookmarks/locations", response_model=List[int])
def read_location_bookmarks():
    with get_db() as conn:
        cursor = conn.execute("SELECT location_id FROM location_bookmarks")
        rows = cursor.fetchall()
        return [row["location_id"] for row in rows]

@app.put("/api/v1/bookmarks/locations", status_code=status.HTTP_200_OK)
def update_location_bookmarks(bookmarks: LocationBookmarksUpdate):
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM location_bookmarks")
            for lid in bookmarks.location_ids:
                conn.execute("INSERT INTO location_bookmarks (location_id) VALUES (?)", (lid,))
        return {"detail": "Location bookmarks successfully updated."}
    except sqlite3.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid location ID(s) provided. Database error: {str(e)}"
        )

# --- Categories Endpoints ---

@app.get("/api/v1/categories", response_model=List[CategoryResponse])
def read_categories():
    with get_db() as conn:
        cursor = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM categories ORDER BY name ASC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@app.post("/api/v1/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate):
    try:
        with get_db() as conn:
            if category.parent_id is not None:
                parent = conn.execute("SELECT id FROM categories WHERE id = ?", (category.parent_id,)).fetchone()
                if not parent:
                    raise HTTPException(status_code=400, detail=f"Parent category with ID {category.parent_id} does not exist.")
            cursor = conn.execute(
                "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?) RETURNING id, name, description, parent_id, created_at, updated_at",
                (category.name, category.description, category.parent_id)
            )
            row = cursor.fetchone()
            return dict(row)
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{category.name}' already exists at this hierarchy level."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(e)}"
        )

@app.put("/api/v1/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_update: CategoryUpdate):
    try:
        with get_db() as conn:
            current = conn.execute("SELECT id, name, description, parent_id FROM categories WHERE id = ?", (category_id,)).fetchone()
            if not current:
                raise HTTPException(status_code=404, detail=f"Category with ID {category_id} not found.")
            
            update_data = category_update.model_dump(exclude_unset=True)
            if not update_data:
                updated = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM categories WHERE id = ?", (category_id,)).fetchone()
                return dict(updated)
            
            if "parent_id" in update_data:
                new_parent_id = update_data["parent_id"]
                if new_parent_id is not None:
                    parent = conn.execute("SELECT id FROM categories WHERE id = ?", (new_parent_id,)).fetchone()
                    if not parent:
                        raise HTTPException(status_code=400, detail=f"Parent category with ID {new_parent_id} does not exist.")
                if check_cycle(conn, "categories", category_id, new_parent_id):
                    raise HTTPException(status_code=400, detail="Cycle detected: parent category cannot be itself or a descendant.")
            
            fields = []
            params = []
            for k, v in update_data.items():
                fields.append(f"{k} = ?")
                params.append(v)
            params.append(category_id)
            
            conn.execute(f"UPDATE categories SET {', '.join(fields)} WHERE id = ?", params)
            
            updated = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM categories WHERE id = ?", (category_id,)).fetchone()
            return dict(updated)
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists at this hierarchy level."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(e)}"
        )

# --- Locations Endpoints ---

@app.get("/api/v1/locations", response_model=List[LocationResponse])
def read_locations():
    with get_db() as conn:
        cursor = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM locations ORDER BY name ASC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@app.post("/api/v1/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(location: LocationCreate):
    try:
        with get_db() as conn:
            if location.parent_id is not None:
                parent = conn.execute("SELECT id FROM locations WHERE id = ?", (location.parent_id,)).fetchone()
                if not parent:
                    raise HTTPException(status_code=400, detail=f"Parent location with ID {location.parent_id} does not exist.")
            cursor = conn.execute(
                "INSERT INTO locations (name, description, parent_id) VALUES (?, ?, ?) RETURNING id, name, description, parent_id, created_at, updated_at",
                (location.name, location.description, location.parent_id)
            )
            row = cursor.fetchone()
            return dict(row)
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Location with name '{location.name}' already exists at this hierarchy level."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(e)}"
        )

@app.put("/api/v1/locations/{location_id}", response_model=LocationResponse)
def update_location(location_id: int, location_update: LocationUpdate):
    try:
        with get_db() as conn:
            current = conn.execute("SELECT id, name, description, parent_id FROM locations WHERE id = ?", (location_id,)).fetchone()
            if not current:
                raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found.")
            
            update_data = location_update.model_dump(exclude_unset=True)
            if not update_data:
                updated = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM locations WHERE id = ?", (location_id,)).fetchone()
                return dict(updated)
            
            if "parent_id" in update_data:
                new_parent_id = update_data["parent_id"]
                if new_parent_id is not None:
                    parent = conn.execute("SELECT id FROM locations WHERE id = ?", (new_parent_id,)).fetchone()
                    if not parent:
                        raise HTTPException(status_code=400, detail=f"Parent location with ID {new_parent_id} does not exist.")
                if check_cycle(conn, "locations", location_id, new_parent_id):
                    raise HTTPException(status_code=400, detail="Cycle detected: parent location cannot be itself or a descendant.")
            
            fields = []
            params = []
            for k, v in update_data.items():
                fields.append(f"{k} = ?")
                params.append(v)
            params.append(location_id)
            
            conn.execute(f"UPDATE locations SET {', '.join(fields)} WHERE id = ?", params)
            
            updated = conn.execute("SELECT id, name, description, parent_id, created_at, updated_at FROM locations WHERE id = ?", (location_id,)).fetchone()
            return dict(updated)
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Location with this name already exists at this hierarchy level."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(e)}"
        )

# --- Items Endpoints ---

@app.get("/api/v1/items", response_model=List[ItemResponse])
def read_items(
    category_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None)
):
    cte_clauses = []
    where_clauses = []
    params = []
    
    if category_id is not None:
        cte_clauses.append("""
            subcats(id) AS (
                SELECT id FROM categories WHERE id = ?
                UNION ALL
                SELECT c.id FROM categories c JOIN subcats s ON c.parent_id = s.id
            )
        """)
        where_clauses.append("i.category_id IN (SELECT id FROM subcats)")
        params.append(category_id)
        
    if location_id is not None:
        cte_clauses.append("""
            sublocs(id) AS (
                SELECT id FROM locations WHERE id = ?
                UNION ALL
                SELECT l.id FROM locations l JOIN sublocs s ON l.parent_id = s.id
            )
        """)
        where_clauses.append("i.location_id IN (SELECT id FROM sublocs)")
        params.append(location_id)
        
    cte_prefix = f"WITH {', '.join(cte_clauses)}" if cte_clauses else ""
    
    query = f"""
        {cte_prefix}
        SELECT 
            i.id, i.name, i.description, 
            i.category_id, c.name AS category_name,
            i.location_id, l.name AS location_name,
            i.quantity, i.status, i.serial_number, i.model_number,
            i.purchase_date, i.purchase_price, i.notes,
            i.created_at, i.updated_at
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN locations l ON i.location_id = l.id
        WHERE 1=1
    """
    
    for clause in where_clauses:
        query += f" AND {clause}"
        
    if status_filter is not None:
        query += " AND i.status = ?"
        params.append(status_filter)
        
    if search:
        query += " AND (i.name LIKE ? OR i.description LIKE ? OR i.serial_number LIKE ? OR i.model_number LIKE ?)"
        like_search = f"%{search}%"
        params.extend([like_search, like_search, like_search, like_search])
        
    query += " ORDER BY i.name ASC"
    
    with get_db() as conn:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@app.get("/api/v1/items/{item_id}", response_model=ItemResponse)
def read_item(item_id: int):
    query = """
        SELECT 
            i.id, i.name, i.description, 
            i.category_id, c.name AS category_name,
            i.location_id, l.name AS location_name,
            i.quantity, i.status, i.serial_number, i.model_number,
            i.purchase_date, i.purchase_price, i.notes,
            i.created_at, i.updated_at
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN locations l ON i.location_id = l.id
        WHERE i.id = ?
    """
    with get_db() as conn:
        cursor = conn.execute(query, (item_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found."
            )
        return dict(row)

@app.post("/api/v1/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    try:
        with get_db() as conn:
            # Enforce foreign key constraints exist before insert
            if item.category_id:
                c = conn.execute("SELECT id FROM categories WHERE id = ?", (item.category_id,)).fetchone()
                if not c:
                    raise HTTPException(status_code=400, detail=f"Category with ID {item.category_id} does not exist.")
            
            if item.location_id:
                l = conn.execute("SELECT id FROM locations WHERE id = ?", (item.location_id,)).fetchone()
                if not l:
                    raise HTTPException(status_code=400, detail=f"Location with ID {item.location_id} does not exist.")

            cursor = conn.execute(
                """
                INSERT INTO items (
                    name, description, category_id, location_id, quantity, status,
                    serial_number, model_number, purchase_date, purchase_price, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id, name, description, category_id, location_id, quantity, status,
                          serial_number, model_number, purchase_date, purchase_price, notes, created_at, updated_at
                """,
                (
                    item.name, item.description, item.category_id, item.location_id,
                    item.quantity, item.status, item.serial_number, item.model_number,
                    item.purchase_date, item.purchase_price, item.notes
                )
            )
            inserted_row = cursor.fetchone()
            inserted_dict = dict(inserted_row)
            
            # Retrieve category & location name for log and return payload
            loc_name = get_location_name(conn, item.location_id)
            cat_name = None
            if item.category_id:
                cat_row = conn.execute("SELECT name FROM categories WHERE id = ?", (item.category_id,)).fetchone()
                cat_name = cat_row["name"] if cat_row else None
            
            inserted_dict["category_name"] = cat_name
            inserted_dict["location_name"] = loc_name
            
            # Write audit log
            log_inventory_change(
                conn=conn,
                item_id=inserted_dict["id"],
                item_name=item.name,
                action="create",
                new_qty=item.quantity,
                new_loc=loc_name,
                new_status=item.status,
                notes=f"Initial item creation in category '{cat_name or 'Uncategorized'}'."
            )
            
            return inserted_dict
            
    except sqlite3.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraints violation: {str(e)}"
        )

@app.put("/api/v1/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate):
    try:
        with get_db() as conn:
            # 1. Fetch current item state
            current_cursor = conn.execute(
                """
                SELECT name, quantity, location_id, status, description, category_id, serial_number, model_number, purchase_date, purchase_price, notes 
                FROM items WHERE id = ?
                """, 
                (item_id,)
            )
            current_row = current_cursor.fetchone()
            if not current_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Item with ID {item_id} not found."
                )
            
            current_data = dict(current_row)

            # Enforce foreign key constraints exist if updated
            if item_update.category_id is not None:
                c = conn.execute("SELECT id FROM categories WHERE id = ?", (item_update.category_id,)).fetchone()
                if not c:
                    raise HTTPException(status_code=400, detail=f"Category with ID {item_update.category_id} does not exist.")
            
            if item_update.location_id is not None:
                l = conn.execute("SELECT id FROM locations WHERE id = ?", (item_update.location_id,)).fetchone()
                if not l:
                    raise HTTPException(status_code=400, detail=f"Location with ID {item_update.location_id} does not exist.")

            # 2. Build UPDATE statement dynamically
            update_fields = []
            params = []
            
            # Map request values or default to existing values
            for field, val in item_update.model_dump(exclude_unset=True).items():
                update_fields.append(f"{field} = ?")
                params.append(val)
            
            if not update_fields:
                # No updates requested, fetch and return item as is
                return read_item(item_id)

            params.append(item_id)
            conn.execute(
                f"UPDATE items SET {', '.join(update_fields)} WHERE id = ?",
                params
            )

            # 3. Retrieve updated row details
            updated_cursor = conn.execute(
                """
                SELECT 
                    i.id, i.name, i.description, 
                    i.category_id, c.name AS category_name,
                    i.location_id, l.name AS location_name,
                    i.quantity, i.status, i.serial_number, i.model_number,
                    i.purchase_date, i.purchase_price, i.notes,
                    i.created_at, i.updated_at
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                LEFT JOIN locations l ON i.location_id = l.id
                WHERE i.id = ?
                """,
                (item_id,)
            )
            updated_row = updated_cursor.fetchone()
            updated_dict = dict(updated_row)

            # 4. Audit Log Comparisons
            prev_loc_name = get_location_name(conn, current_data["location_id"])
            new_loc_name = updated_dict["location_name"]
            
            actions = []
            
            # Determine specific audit action types
            if current_data["quantity"] != updated_dict["quantity"]:
                actions.append(("update_quantity", f"Quantity changed from {current_data['quantity']} to {updated_dict['quantity']}"))
            
            if current_data["location_id"] != updated_dict["location_id"]:
                actions.append(("update_location", f"Location changed from '{prev_loc_name or 'None'}' to '{new_loc_name or 'None'}'"))
                
            if current_data["status"] != updated_dict["status"]:
                # Custom sub-action type check-in or check-out
                act_type = "update_status"
                if current_data["status"] == "in_stock" and updated_dict["status"] in ("borrowed", "lost"):
                    act_type = "check_out"
                elif current_data["status"] in ("borrowed", "lost") and updated_dict["status"] == "in_stock":
                    act_type = "check_in"
                actions.append((act_type, f"Status changed from '{current_data['status']}' to '{updated_dict['status']}'"))

            # Log other detail modifications if no key fields changed
            if not actions and current_data != updated_dict:
                actions.append(("update_details", "Item metadata fields updated."))

            # Write logs to database
            for act_type, note in actions:
                log_inventory_change(
                    conn=conn,
                    item_id=item_id,
                    item_name=updated_dict["name"],
                    action=act_type,
                    prev_qty=current_data["quantity"],
                    new_qty=updated_dict["quantity"],
                    prev_loc=prev_loc_name,
                    new_loc=new_loc_name,
                    prev_status=current_data["status"],
                    new_status=updated_dict["status"],
                    notes=note
                )

            return updated_dict

    except sqlite3.IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraints violation: {str(e)}"
        )

@app.delete("/api/v1/items/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(item_id: int):
    with get_db() as conn:
        # Retrieve name and details before deletion for final log entry
        cursor = conn.execute("SELECT name, quantity, location_id, status FROM items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found."
            )
        
        item_data = dict(row)
        loc_name = get_location_name(conn, item_data["location_id"])

        # Execute Delete
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))

        # Write Delete Log
        log_inventory_change(
            conn=conn,
            item_id=item_id,
            item_name=item_data["name"],
            action="delete",
            prev_qty=item_data["quantity"],
            prev_loc=loc_name,
            prev_status=item_data["status"],
            notes=f"Item '{item_data['name']}' was removed from inventory."
        )

    return {"detail": f"Item with ID {item_id} successfully deleted."}

# --- Inventory Logs Endpoints ---

@app.get("/api/v1/logs", response_model=List[LogResponse])
def read_logs(limit: int = Query(50, ge=1, le=200)):
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id, item_id, item_name, action, 
                   previous_quantity, new_quantity, 
                   previous_location, new_location, 
                   previous_status, new_status, 
                   notes, timestamp
            FROM inventory_logs 
            ORDER BY timestamp DESC, id DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


# Backend running as isolated API service
