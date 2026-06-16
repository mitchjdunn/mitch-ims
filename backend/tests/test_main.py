import unittest
import os

# 1. Override the database path to a separate test database BEFORE importing modules
import database.db
TEST_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
    "test_inventory.db"
)
database.db.DB_PATH = TEST_DB_PATH

# 2. Import app and test resources
from fastapi.testclient import TestClient
from main import app
from database.db import init_db


class TestInventoryAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Clean up database if left from a failed crash run
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except OSError:
                pass
        
        # Initialize test tables and seed records
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        # Remove test database file
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except OSError:
                pass

    def test_01_read_categories_seeds(self):
        """Verify the database has default categories seeded correctly on start."""
        response = self.client.get("/api/v1/categories")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertGreaterEqual(len(data), 6)
        names = [c["name"] for c in data]
        self.assertIn("Electronics", names)
        self.assertIn("Tools", names)
        self.assertIn("Kitchenware", names)

    def test_02_create_category_constraints(self):
        """Verify category creation rules, including uniqueness and spacing validation."""
        # 1. Create valid category
        payload = {"name": "Gardening", "description": "Plants and outdoor tools"}
        response = self.client.post("/api/v1/categories", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "Gardening")
        self.assertEqual(data["description"], "Plants and outdoor tools")
        self.assertTrue("id" in data)

        # 2. Duplicate validation
        dup_res = self.client.post("/api/v1/categories", json=payload)
        self.assertEqual(dup_res.status_code, 409)
        self.assertIn("already exists", dup_res.json()["detail"])

        # 3. Empty name spacing validation (FastAPI Pydantic rule + SQLite check)
        invalid_payload = {"name": "   ", "description": "Empty space name"}
        err_res = self.client.post("/api/v1/categories", json=invalid_payload)
        self.assertEqual(err_res.status_code, 422)

    def test_03_create_location_constraints(self):
        """Verify physical location creation rules and duplicates validation."""
        payload = {"name": "Backyard Shed", "description": "Locked outdoor shed"}
        response = self.client.post("/api/v1/locations", json=payload)
        self.assertEqual(response.status_code, 201)
        
        # Duplicate
        dup_res = self.client.post("/api/v1/locations", json=payload)
        self.assertEqual(dup_res.status_code, 409)

    def test_04_create_item_flow(self):
        """Verify item creation and check constraint checks (e.g. quantity >= 0)."""
        item_payload = {
            "name": "Circular Saw",
            "description": "Corded circular saw with 7-1/4 inch blade",
            "category_id": 2,  # Tools (seeded ID 2)
            "location_id": 3,  # Garage Workbench (seeded ID 3)
            "quantity": 1,
            "status": "in_stock",
            "purchase_price": 59.99
        }
        
        # 1. Create valid item
        response = self.client.post("/api/v1/items", json=item_payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "Circular Saw")
        self.assertEqual(data["category_name"], "Tools")
        self.assertEqual(data["location_name"], "Garage Workbench")
        self.assertEqual(data["quantity"], 1)

        # 2. Check negative quantity constraint
        item_payload["quantity"] = -5
        err_res = self.client.post("/api/v1/items", json=item_payload)
        self.assertEqual(err_res.status_code, 422) # Pydantic block

        # 3. Check invalid status check constraint
        item_payload["quantity"] = 2
        item_payload["status"] = "on_loan" # Invalid status
        err_res2 = self.client.post("/api/v1/items", json=item_payload)
        self.assertEqual(err_res2.status_code, 422)

        # 4. Check audit log entry creation
        log_res = self.client.get("/api/v1/logs")
        self.assertEqual(log_res.status_code, 200)
        logs = log_res.json()
        self.assertGreater(len(logs), 0)
        self.assertEqual(logs[0]["item_name"], "Circular Saw")
        self.assertEqual(logs[0]["action"], "create")

    def test_05_update_item_audit_log_flow(self):
        """Verify item updates successfully generate distinct entries in the activity log."""
        # 1. Retrieve current item ID
        items_res = self.client.get("/api/v1/items?search=Circular")
        self.assertEqual(items_res.status_code, 200)
        item_id = items_res.json()[0]["id"]

        # 2. Perform updates
        update_payload = {
            "quantity": 5,
            "status": "low_stock",
            "location_id": 6  # Storage Box A
        }
        update_res = self.client.put(f"/api/v1/items/{item_id}", json=update_payload)
        self.assertEqual(update_res.status_code, 200)

        # 3. Read audit logs to assert updates
        log_res = self.client.get("/api/v1/logs?limit=5")
        logs = log_res.json()
        
        # Verify specific details logged
        actions = [log["action"] for log in logs]
        self.assertIn("update_quantity", actions)
        self.assertIn("update_location", actions)
        self.assertIn("update_status", actions)
        
        # Verify status transitions are logged
        status_logs = [log for log in logs if log["action"] == "update_status"]
        self.assertEqual(status_logs[0]["previous_status"], "in_stock")
        self.assertEqual(status_logs[0]["new_status"], "low_stock")

    def test_06_delete_item_audit_log_flow(self):
        """Verify deleting an item records details and checks it out of lists."""
        # Get item ID
        items_res = self.client.get("/api/v1/items?search=Circular")
        item_id = items_res.json()[0]["id"]

        # Delete it
        del_res = self.client.delete(f"/api/v1/items/{item_id}")
        self.assertEqual(del_res.status_code, 200)

        # Verify not found
        get_res = self.client.get(f"/api/v1/items/{item_id}")
        self.assertEqual(get_res.status_code, 404)

        # Verify audit log captures deletion
        log_res = self.client.get("/api/v1/logs?limit=5")
        logs = log_res.json()
        self.assertEqual(logs[0]["action"], "delete")
        self.assertEqual(logs[0]["item_name"], "Circular Saw")
        self.assertIn("removed from inventory", logs[0]["notes"])

    def test_07_bookmark_endpoints_and_cascades(self):
        """Verify bookmark retrieval, updates, validation, and cascade deletion."""
        # 1. Initially bookmarks should be empty
        cat_res = self.client.get("/api/v1/bookmarks/categories")
        self.assertEqual(cat_res.status_code, 200)
        self.assertEqual(cat_res.json(), [])

        loc_res = self.client.get("/api/v1/bookmarks/locations")
        self.assertEqual(loc_res.status_code, 200)
        self.assertEqual(loc_res.json(), [])

        # 2. Update bookmarks (valid IDs)
        put_cat = self.client.put("/api/v1/bookmarks/categories", json={"category_ids": [1, 2]})
        self.assertEqual(put_cat.status_code, 200)
        
        put_loc = self.client.put("/api/v1/bookmarks/locations", json={"location_ids": [1, 3]})
        self.assertEqual(put_loc.status_code, 200)

        # 3. Read back and verify
        cat_res = self.client.get("/api/v1/bookmarks/categories")
        self.assertEqual(cat_res.json(), [1, 2])

        loc_res = self.client.get("/api/v1/bookmarks/locations")
        self.assertEqual(loc_res.json(), [1, 3])

        # 4. Error state: try adding non-existent category/location IDs
        err_cat = self.client.put("/api/v1/bookmarks/categories", json={"category_ids": [999]})
        self.assertEqual(err_cat.status_code, 400)

        err_loc = self.client.put("/api/v1/bookmarks/locations", json={"location_ids": [999]})
        self.assertEqual(err_loc.status_code, 400)

        # 5. Verify Cascade Deletion: delete category 2 in DB and check cascade
        from database.db import get_db
        with get_db() as conn:
            conn.execute("DELETE FROM categories WHERE id = 2")
        
        cat_res_after = self.client.get("/api/v1/bookmarks/categories")
        self.assertEqual(cat_res_after.json(), [1])

    def test_08_hierarchical_filters_and_cycles(self):
        """Verify recursive hierarchical queries and cycle prevention rules."""
        # 1. Create a parent category
        res = self.client.post("/api/v1/categories", json={"name": "Audio", "description": "Audio items"})
        self.assertEqual(res.status_code, 201)
        audio_id = res.json()["id"]

        # 2. Create subcategory
        res2 = self.client.post("/api/v1/categories", json={"name": "Headphones", "parent_id": audio_id})
        self.assertEqual(res2.status_code, 201)
        headphones_id = res2.json()["id"]

        # 3. Create sub-subcategory
        res3 = self.client.post("/api/v1/categories", json={"name": "Wireless", "parent_id": headphones_id})
        self.assertEqual(res3.status_code, 201)
        wireless_id = res3.json()["id"]

        # 4. Attempt to create cycle: set parent of Audio to Wireless (Wireless is descendant of Audio)
        cycle_res = self.client.put(f"/api/v1/categories/{audio_id}", json={"parent_id": wireless_id})
        self.assertEqual(cycle_res.status_code, 400)
        self.assertIn("Cycle detected", cycle_res.json()["detail"])

        # 5. Create items in parent, child, grandchild categories
        item_audio = self.client.post("/api/v1/items", json={
            "name": "Audio Mixer",
            "category_id": audio_id,
            "quantity": 1
        })
        self.assertEqual(item_audio.status_code, 201)

        item_headphones = self.client.post("/api/v1/items", json={
            "name": "Sony WH-1000XM4",
            "category_id": headphones_id,
            "quantity": 1
        })
        self.assertEqual(item_headphones.status_code, 201)

        item_wireless = self.client.post("/api/v1/items", json={
            "name": "AirPods Pro",
            "category_id": wireless_id,
            "quantity": 2
        })
        self.assertEqual(item_wireless.status_code, 201)

        # 6. Retrieve items filtered by parent category Audio -> should return all 3
        res_audio = self.client.get(f"/api/v1/items?category_id={audio_id}")
        self.assertEqual(res_audio.status_code, 200)
        audio_items = [i["name"] for i in res_audio.json()]
        self.assertEqual(len(audio_items), 3)
        self.assertIn("Audio Mixer", audio_items)
        self.assertIn("Sony WH-1000XM4", audio_items)
        self.assertIn("AirPods Pro", audio_items)

        # 7. Retrieve items filtered by Headphones -> should return Headphones and Wireless (2 items)
        res_headphones = self.client.get(f"/api/v1/items?category_id={headphones_id}")
        self.assertEqual(res_headphones.status_code, 200)
        hp_items = [i["name"] for i in res_headphones.json()]
        self.assertEqual(len(hp_items), 2)
        self.assertNotIn("Audio Mixer", hp_items)
        self.assertIn("Sony WH-1000XM4", hp_items)
        self.assertIn("AirPods Pro", hp_items)

        # 8. Retrieve items filtered by Wireless -> should return only AirPods Pro (1 item)
        res_wireless = self.client.get(f"/api/v1/items?category_id={wireless_id}")
        self.assertEqual(res_wireless.status_code, 200)
        wl_items = [i["name"] for i in res_wireless.json()]
        self.assertEqual(len(wl_items), 1)
        self.assertEqual(wl_items[0], "AirPods Pro")


if __name__ == "__main__":
    unittest.main()
