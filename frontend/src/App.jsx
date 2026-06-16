import React, { useState, useEffect, useRef } from 'react';

// API Base URL - decoupled microservice endpoint
const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App() {
    // Inventory state variables
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [logs, setLogs] = useState([]);

    // Filtering & search states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Modal dialog control references
    const itemDialogRef = useRef(null);
    const categoryDialogRef = useRef(null);
    const locationDialogRef = useRef(null);
    const catBookmarkDialogRef = useRef(null);
    const locBookmarkDialogRef = useRef(null);

    // Form tracking states
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormError, setItemFormError] = useState('');
    const [catFormError, setCatFormError] = useState('');
    const [locFormError, setLocFormError] = useState('');

    // Bookmarks states
    const [bookmarkedCategoryIds, setBookmarkedCategoryIds] = useState([]);
    const [bookmarkedLocationIds, setBookmarkedLocationIds] = useState([]);
    const [tempCatBookmarks, setTempCatBookmarks] = useState([]);
    const [tempLocBookmarks, setTempLocBookmarks] = useState([]);
    const [showBookmarkedCategoriesOnly, setShowBookmarkedCategoriesOnly] = useState(() => {
        const saved = localStorage.getItem('ims_show_bookmarked_categories_only');
        return saved ? JSON.parse(saved) : false;
    });
    const [showBookmarkedLocationsOnly, setShowBookmarkedLocationsOnly] = useState(() => {
        const saved = localStorage.getItem('ims_show_bookmarked_locations_only');
        return saved ? JSON.parse(saved) : false;
    });

    // Sync toggle states to local storage
    useEffect(() => {
        localStorage.setItem('ims_show_bookmarked_categories_only', JSON.stringify(showBookmarkedCategoriesOnly));
    }, [showBookmarkedCategoriesOnly]);

    useEffect(() => {
        localStorage.setItem('ims_show_bookmarked_locations_only', JSON.stringify(showBookmarkedLocationsOnly));
    }, [showBookmarkedLocationsOnly]);

    // Form inputs state
    const [itemFields, setItemFields] = useState({
        name: '',
        description: '',
        category_id: '',
        location_id: '',
        quantity: 1,
        status: 'in_stock',
        serial_number: '',
        model_number: '',
        purchase_date: '',
        purchase_price: '',
        notes: ''
    });

    const [categoryFields, setCategoryFields] = useState({ name: '', description: '', parent_id: '' });
    const [locationFields, setLocationFields] = useState({ name: '', description: '', parent_id: '' });

    // Was form validated (triggers custom validation borders)
    const [itemFormValidated, setItemFormValidated] = useState(false);
    const [catFormValidated, setCatFormValidated] = useState(false);
    const [locFormValidated, setLocFormValidated] = useState(false);

    // Initial Loading
    useEffect(() => {
        refreshAllData();
    }, []);

    // Filter Trigger Sync
    useEffect(() => {
        fetchItems();
    }, [searchQuery, selectedCategory, selectedLocation, selectedStatus]);

    // --- API Async Actions ---

    const refreshAllData = async () => {
        await Promise.all([
            fetchCategories(),
            fetchLocations(),
            fetchLogs(),
            fetchBookmarks()
        ]);
        await fetchItems();
    };

    const fetchBookmarks = async () => {
        try {
            const [catRes, locRes] = await Promise.all([
                fetch(`${API_BASE}/bookmarks/categories`),
                fetch(`${API_BASE}/bookmarks/locations`)
            ]);
            if (catRes.ok) {
                const catIds = await catRes.json();
                setBookmarkedCategoryIds(catIds);
            }
            if (locRes.ok) {
                const locIds = await locRes.json();
                setBookmarkedLocationIds(locIds);
            }
        } catch (err) {
            console.error('Error fetching bookmarks:', err);
        }
    };

    const handleSaveCategoryBookmarks = async (selectedIds) => {
        try {
            const res = await fetch(`${API_BASE}/bookmarks/categories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_ids: selectedIds })
            });
            if (!res.ok) throw new Error('Failed to update category bookmarks');
            setBookmarkedCategoryIds(selectedIds);
            catBookmarkDialogRef.current.close();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSaveLocationBookmarks = async (selectedIds) => {
        try {
            const res = await fetch(`${API_BASE}/bookmarks/locations`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_ids: selectedIds })
            });
            if (!res.ok) throw new Error('Failed to update location bookmarks');
            setBookmarkedLocationIds(selectedIds);
            locBookmarkDialogRef.current.close();
        } catch (err) {
            alert(err.message);
        }
    };

    const openEditCategoryBookmarks = () => {
        setTempCatBookmarks([...bookmarkedCategoryIds]);
        catBookmarkDialogRef.current.showModal();
    };

    const openEditLocationBookmarks = () => {
        setTempLocBookmarks([...bookmarkedLocationIds]);
        locBookmarkDialogRef.current.showModal();
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/categories`);
            if (!res.ok) throw new Error('Failed to retrieve categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE}/locations`);
            if (!res.ok) throw new Error('Failed to retrieve locations');
            const data = await res.json();
            setLocations(data);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const fetchItems = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
            if (selectedCategory) queryParams.append('category_id', selectedCategory);
            if (selectedLocation) queryParams.append('location_id', selectedLocation);
            if (selectedStatus) queryParams.append('status', selectedStatus);

            const res = await fetch(`${API_BASE}/items?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to retrieve items');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${API_BASE}/logs?limit=30`);
            if (!res.ok) throw new Error('Failed to retrieve logs');
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    // --- Modal Management Helpers ---

    const handleDialogBackdropClick = (e, dialogRef) => {
        if (!dialogRef.current) return;
        const rect = dialogRef.current.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            dialogRef.current.close();
        }
    };

    const openAddItem = () => {
        setEditingItemId(null);
        setItemFormError('');
        setItemFormValidated(false);
        setItemFields({
            name: '',
            description: '',
            category_id: '',
            location_id: '',
            quantity: 1,
            status: 'in_stock',
            serial_number: '',
            model_number: '',
            purchase_date: '',
            purchase_price: '',
            notes: ''
        });
        itemDialogRef.current.showModal();
    };

    const openEditItem = async (item) => {
        setEditingItemId(item.id);
        setItemFormError('');
        setItemFormValidated(false);
        try {
            const res = await fetch(`${API_BASE}/items/${item.id}`);
            if (!res.ok) throw new Error('Could not pull item details');
            const data = await res.json();
            
            setItemFields({
                name: data.name,
                description: data.description || '',
                category_id: data.category_id || '',
                location_id: data.location_id || '',
                quantity: data.quantity,
                status: data.status,
                serial_number: data.serial_number || '',
                model_number: data.model_number || '',
                purchase_date: data.purchase_date || '',
                purchase_price: data.purchase_price !== null ? data.purchase_price : '',
                notes: data.notes || ''
            });
            itemDialogRef.current.showModal();
        } catch (err) {
            alert(err.message);
        }
    };

    // --- CRUD Form Submissions ---

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        setItemFormValidated(true);
        const form = e.target;
        
        if (!form.checkValidity()) return;

        const payload = {
            name: itemFields.name,
            description: itemFields.description || null,
            category_id: itemFields.category_id ? parseInt(itemFields.category_id) : null,
            location_id: itemFields.location_id ? parseInt(itemFields.location_id) : null,
            quantity: parseInt(itemFields.quantity),
            status: itemFields.status,
            serial_number: itemFields.serial_number || null,
            model_number: itemFields.model_number || null,
            purchase_date: itemFields.purchase_date || null,
            purchase_price: itemFields.purchase_price !== '' ? parseFloat(itemFields.purchase_price) : null,
            notes: itemFields.notes || null
        };

        try {
            let url = `${API_BASE}/items`;
            let method = 'POST';

            if (editingItemId !== null) {
                url += `/${editingItemId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save item');
            }

            itemDialogRef.current.close();
            refreshAllData();
        } catch (err) {
            setItemFormError(err.message);
        }
    };

    const handleCreateCategoryInline = async (name) => {
        try {
            const res = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: 'Created inline' })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to create category');
            }
            const newCat = await res.json();
            await fetchCategories();
            setItemFields(prev => ({ ...prev, category_id: newCat.id }));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateLocationInline = async (name) => {
        try {
            const res = await fetch(`${API_BASE}/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: 'Created inline' })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to create location');
            }
            const newLoc = await res.json();
            await fetchLocations();
            setItemFields(prev => ({ ...prev, location_id: newLoc.id }));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setCatFormValidated(true);
        const form = e.target;
        if (!form.checkValidity()) return;

        const payload = {
            name: categoryFields.name,
            description: categoryFields.description || null,
            parent_id: categoryFields.parent_id ? Number(categoryFields.parent_id) : null
        };

        try {
            const res = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to create category');
            }

            setCategoryFields({ name: '', description: '', parent_id: '' });
            setCatFormValidated(false);
            categoryDialogRef.current.close();
            refreshAllData();
        } catch (err) {
            setCatFormError(err.message);
        }
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        setLocFormValidated(true);
        const form = e.target;
        if (!form.checkValidity()) return;

        const payload = {
            name: locationFields.name,
            description: locationFields.description || null,
            parent_id: locationFields.parent_id ? Number(locationFields.parent_id) : null
        };

        try {
            const res = await fetch(`${API_BASE}/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to create location');
            }

            setLocationFields({ name: '', description: '', parent_id: '' });
            setLocFormValidated(false);
            locationDialogRef.current.close();
            refreshAllData();
        } catch (err) {
            setLocFormError(err.message);
        }
    };

    const handleItemDelete = async (itemId) => {
        if (!confirm('Are you sure you want to permanently delete this item? This action will log a transaction.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to delete item');
            }
            refreshAllData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    // --- Tree Hierarchy States and Handlers ---
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [expandedLocations, setExpandedLocations] = useState([]);

    const handleToggleCategoryExpand = (id) => {
        setExpandedCategories(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleToggleLocationExpand = (id) => {
        setExpandedLocations(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const rootCategories = categories.filter(cat => {
        return !cat.parent_id || !categories.some(c => c.id === cat.parent_id);
    });

    const rootLocations = locations.filter(loc => {
        return !loc.parent_id || !locations.some(l => l.id === loc.parent_id);
    });

    const getCategoryPath = (catId, categoriesList) => {
        const path = [];
        let current = categoriesList.find(c => c.id === catId);
        while (current) {
            path.unshift(current.name);
            if (current.parent_id) {
                current = categoriesList.find(c => c.id === current.parent_id);
            } else {
                current = null;
            }
        }
        return path.join(' > ');
    };

    const getLocationPath = (locId, locationsList) => {
        const path = [];
        let current = locationsList.find(l => l.id === locId);
        while (current) {
            path.unshift(current.name);
            if (current.parent_id) {
                current = locationsList.find(l => l.id === current.parent_id);
            } else {
                current = null;
            }
        }
        return path.join(' > ');
    };

    return (
        <>
            <div className="glass-bg"></div>

            <header className="app-header">
                <div className="logo-area">
                    <span className="logo-icon">▲</span>
                    <h1 className="logo-title">I<span>M</span>S</h1>
                </div>
            </header>

            <div className="app-layout">
                {/* Sidebar Navigation */}
                <aside className="sidebar">
                    <section className="panel-section">
                        <div className="section-header">
                            <h2>Categories</h2>
                            <button className="btn-icon" onClick={() => categoryDialogRef.current.showModal()} title="Add Category">＋</button>
                        </div>
                        <div className="chip-container">
                            <div className="all-chip-row">
                                <div 
                                    className={`chip ${selectedCategory === '' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('')}
                                    style={{ flex: 1 }}
                                >
                                    All Categories
                                </div>
                                {bookmarkedCategoryIds.length > 0 && (
                                    <button 
                                        className={`btn-bookmark-toggle ${showBookmarkedCategoriesOnly ? 'active' : ''}`}
                                        onClick={() => setShowBookmarkedCategoriesOnly(!showBookmarkedCategoriesOnly)}
                                        title={showBookmarkedCategoriesOnly ? "Show All Categories" : "Show Bookmarked Only"}
                                    >
                                        🔖
                                    </button>
                                )}
                                <button 
                                    className="btn-bookmark-edit"
                                    onClick={openEditCategoryBookmarks}
                                    title="Manage Bookmarks"
                                >
                                    ⚙️
                                </button>
                            </div>
                            {rootCategories.map(cat => (
                                <SidebarTreeNode
                                    key={cat.id}
                                    node={cat}
                                    allNodes={categories}
                                    selectedId={selectedCategory}
                                    onSelect={(id) => setSelectedCategory(selectedCategory === id ? '' : id)}
                                    depth={0}
                                    expandedIds={expandedCategories}
                                    onToggleExpand={handleToggleCategoryExpand}
                                    bookmarkedIds={bookmarkedCategoryIds}
                                    showBookmarkedOnly={showBookmarkedCategoriesOnly}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="panel-section">
                        <div className="section-header">
                            <h2>Locations</h2>
                            <button className="btn-icon" onClick={() => locationDialogRef.current.showModal()} title="Add Location">＋</button>
                        </div>
                        <div className="chip-container">
                            <div className="all-chip-row">
                                <div 
                                    className={`chip ${selectedLocation === '' ? 'active' : ''}`}
                                    onClick={() => setSelectedLocation('')}
                                    style={{ flex: 1 }}
                                >
                                    All Locations
                                </div>
                                {bookmarkedLocationIds.length > 0 && (
                                    <button 
                                        className={`btn-bookmark-toggle ${showBookmarkedLocationsOnly ? 'active' : ''}`}
                                        onClick={() => setShowBookmarkedLocationsOnly(!showBookmarkedLocationsOnly)}
                                        title={showBookmarkedLocationsOnly ? "Show All Locations" : "Show Bookmarked Only"}
                                    >
                                        🔖
                                    </button>
                                )}
                                <button 
                                    className="btn-bookmark-edit"
                                    onClick={openEditLocationBookmarks}
                                    title="Manage Bookmarks"
                                >
                                    ⚙️
                                </button>
                            </div>
                            {rootLocations.map(loc => (
                                <SidebarTreeNode
                                    key={loc.id}
                                    node={loc}
                                    allNodes={locations}
                                    selectedId={selectedLocation}
                                    onSelect={(id) => setSelectedLocation(selectedLocation === id ? '' : id)}
                                    depth={0}
                                    expandedIds={expandedLocations}
                                    onToggleExpand={handleToggleLocationExpand}
                                    bookmarkedIds={bookmarkedLocationIds}
                                    showBookmarkedOnly={showBookmarkedLocationsOnly}
                                />
                            ))}
                        </div>
                    </section>
                </aside>

                {/* Main Dynamic Panel */}
                <section className="main-content">
                    <div className="control-panel">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search items, model, serial..." 
                                aria-label="Search items"
                            />
                        </div>
                        
                        <div className="filters">
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                aria-label="Filter by Category"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={selectedLocation} 
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                aria-label="Filter by Location"
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                aria-label="Filter by Status"
                            >
                                <option value="">All Statuses</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="borrowed">Borrowed</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>

                        <button className="btn-primary" onClick={openAddItem}>＋ Add Item</button>
                    </div>

                    {/* Items Grid View */}
                    <div className="items-view">
                        {items.length === 0 ? (
                            <div className="empty-state">
                                <p className="empty-emoji">📦</p>
                                <h3>No items match your filters</h3>
                                <p>Try adjusting your search criteria or register a new item.</p>
                            </div>
                        ) : (
                            <div className="items-list">
                                {items.map(item => (
                                    <div key={item.id} className="item-list-row">
                                        <div className="item-status-col">
                                            <span className={`status-pill status-${item.status}`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="item-info-col">
                                            <h3 className="item-title">{item.name}</h3>
                                            <p className="item-desc">{item.description || 'No description provided.'}</p>
                                        </div>
                                        <div className="item-path-col">
                                            <div className="path-label">Category</div>
                                            <div className="path-value">{item.category_id ? getCategoryPath(item.category_id, categories) : 'Uncategorized'}</div>
                                        </div>
                                        <div className="item-path-col">
                                            <div className="path-label">Location</div>
                                            <div className="path-value">{item.location_id ? getLocationPath(item.location_id, locations) : 'Unknown Location'}</div>
                                        </div>
                                        <div className="item-quantity-col">
                                            <div className="qty-label">Qty</div>
                                            <div className="qty-value">{item.quantity}</div>
                                        </div>
                                        <div className="item-actions-col">
                                            <button className="btn-action-edit" onClick={() => openEditItem(item)}>Edit</button>
                                            <button className="btn-action-delete" onClick={() => handleItemDelete(item.id)}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Audit Logs Right Sidebar */}
                <section className="activity-drawer">
                    <div className="drawer-header">
                        <h2>Activity Log</h2>
                        <span className="drawer-subtitle">Recent transactions</span>
                    </div>
                    <div className="drawer-content">
                        {logs.length === 0 ? (
                            <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '20px' }}>
                                No recent history logs.
                            </p>
                        ) : (
                            logs.map(log => {
                                const logDate = new Date(log.timestamp + 'Z');
                                const displayTime = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const displayDate = logDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                
                                return (
                                    <div key={log.id} className={`log-entry log-${log.action}`}>
                                        <div className="log-header">
                                            <span className="log-item-name">{log.item_name}</span>
                                            <span className="log-time" title={logDate.toLocaleString()}>
                                                {displayDate}, {displayTime}
                                            </span>
                                        </div>
                                        <div className="log-desc">{log.notes || log.action.replace('_', ' ')}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* Form Dialog Modals */}

            {/* Add / Edit Item Dialog */}
            <dialog 
                ref={itemDialogRef} 
                className="glass-dialog"
                onClick={(e) => handleDialogBackdropClick(e, itemDialogRef)}
            >
                <form 
                    onSubmit={handleItemSubmit} 
                    className={itemFormValidated ? 'was-validated' : ''} 
                    noValidate
                >
                    <h2>{editingItemId !== null ? 'Edit Item' : 'Add New Item'}</h2>
                    {itemFormError && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '10px' }}>{itemFormError}</div>}
                    
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Item Name *</label>
                            <input 
                                type="text" 
                                value={itemFields.name}
                                onChange={(e) => setItemFields({ ...itemFields, name: e.target.value })}
                                required 
                                placeholder="e.g. Laser Cutter"
                            />
                            <span className="error-msg">Item name is required and cannot be empty</span>
                        </div>

                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea 
                                value={itemFields.description}
                                onChange={(e) => setItemFields({ ...itemFields, description: e.target.value })}
                                rows="3" 
                                placeholder="Describe the item specifications"
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <FuzzySelect
                                options={categories}
                                selectedId={itemFields.category_id}
                                onSelect={(id) => setItemFields({ ...itemFields, category_id: id })}
                                bookmarkedIds={bookmarkedCategoryIds}
                                placeholder="Uncategorized"
                                onCreate={handleCreateCategoryInline}
                                typeLabel="Category"
                            />
                        </div>

                        <div className="form-group">
                            <label>Location</label>
                            <FuzzySelect
                                options={locations}
                                selectedId={itemFields.location_id}
                                onSelect={(id) => setItemFields({ ...itemFields, location_id: id })}
                                bookmarkedIds={bookmarkedLocationIds}
                                placeholder="Unknown Location"
                                onCreate={handleCreateLocationInline}
                                typeLabel="Location"
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity *</label>
                            <input 
                                type="number" 
                                value={itemFields.quantity}
                                onChange={(e) => setItemFields({ ...itemFields, quantity: e.target.value })}
                                min="0" 
                                required
                            />
                            <span className="error-msg">Quantity must be 0 or higher</span>
                        </div>

                        <div className="form-group">
                            <label>Status *</label>
                            <select 
                                value={itemFields.status}
                                onChange={(e) => setItemFields({ ...itemFields, status: e.target.value })}
                                required
                            >
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="borrowed">Borrowed</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Notes / Context</label>
                            <textarea 
                                value={itemFields.notes}
                                onChange={(e) => setItemFields({ ...itemFields, notes: e.target.value })}
                                rows="2" 
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => itemDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Item</button>
                    </div>
                </form>
            </dialog>

            {/* Add Category Dialog */}
            <dialog 
                ref={categoryDialogRef} 
                className="glass-dialog"
                onClick={(e) => handleDialogBackdropClick(e, categoryDialogRef)}
            >
                <form 
                    onSubmit={handleCategorySubmit} 
                    className={catFormValidated ? 'was-validated' : ''} 
                    noValidate
                >
                    <h2>Create Category</h2>
                    {catFormError && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '10px' }}>{catFormError}</div>}

                    <div className="form-group">
                        <label>Category Name *</label>
                        <input 
                            type="text" 
                            value={categoryFields.name}
                            onChange={(e) => setCategoryFields({ ...categoryFields, name: e.target.value })}
                            required 
                            placeholder="e.g. Garden Tools"
                        />
                        <span className="error-msg">Category name is required</span>
                    </div>

                    <div className="form-group">
                        <label>Parent Category</label>
                        <select 
                            value={categoryFields.parent_id || ''}
                            onChange={(e) => setCategoryFields({ ...categoryFields, parent_id: e.target.value ? Number(e.target.value) : '' })}
                        >
                            <option value="">None (Root Category)</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{getCategoryPath(c.id, categories)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            value={categoryFields.description}
                            onChange={(e) => setCategoryFields({ ...categoryFields, description: e.target.value })}
                            rows="2" 
                            placeholder="Category description"
                        />
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => categoryDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Category</button>
                    </div>
                </form>
            </dialog>

            {/* Add Location Dialog */}
            <dialog 
                ref={locationDialogRef} 
                className="glass-dialog"
                onClick={(e) => handleDialogBackdropClick(e, locationDialogRef)}
            >
                <form 
                    onSubmit={handleLocationSubmit} 
                    className={locFormValidated ? 'was-validated' : ''} 
                    noValidate
                >
                    <h2>Create Location</h2>
                    {locFormError && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '10px' }}>{locFormError}</div>}

                    <div className="form-group">
                        <label>Location Name *</label>
                        <input 
                            type="text" 
                            value={locationFields.name}
                            onChange={(e) => setLocationFields({ ...locationFields, name: e.target.value })}
                            required 
                            placeholder="e.g. Attic Box 12"
                        />
                        <span className="error-msg">Location name is required</span>
                    </div>

                    <div className="form-group">
                        <label>Parent Location</label>
                        <select 
                            value={locationFields.parent_id || ''}
                            onChange={(e) => setLocationFields({ ...locationFields, parent_id: e.target.value ? Number(e.target.value) : '' })}
                        >
                            <option value="">None (Root Location)</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{getLocationPath(l.id, locations)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            value={locationFields.description}
                            onChange={(e) => setLocationFields({ ...locationFields, description: e.target.value })}
                            rows="2" 
                            placeholder="Location details"
                        />
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => locationDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Location</button>
                    </div>
                </form>
            </dialog>

            {/* Edit Category Bookmarks Dialog */}
            <dialog 
                ref={catBookmarkDialogRef} 
                className="glass-dialog"
                onClick={(e) => handleDialogBackdropClick(e, catBookmarkDialogRef)}
            >
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCategoryBookmarks(tempCatBookmarks);
                    }}
                >
                    <h2>Manage Bookmarked Categories</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Select the categories to pin to your sidebar filter list.
                    </p>

                    <div className="checkbox-list">
                        {categories.map(cat => {
                            const isChecked = tempCatBookmarks.includes(cat.id);
                            return (
                                <label key={cat.id} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTempCatBookmarks([...tempCatBookmarks, cat.id]);
                                            } else {
                                                setTempCatBookmarks(tempCatBookmarks.filter(id => id !== cat.id));
                                            }
                                        }}
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => catBookmarkDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Bookmarks</button>
                    </div>
                </form>
            </dialog>

            {/* Edit Location Bookmarks Dialog */}
            <dialog 
                ref={locBookmarkDialogRef} 
                className="glass-dialog"
                onClick={(e) => handleDialogBackdropClick(e, locBookmarkDialogRef)}
            >
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveLocationBookmarks(tempLocBookmarks);
                    }}
                >
                    <h2>Manage Bookmarked Locations</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Select the physical locations to pin to your sidebar filter list.
                    </p>

                    <div className="checkbox-list">
                        {locations.map(loc => {
                            const isChecked = tempLocBookmarks.includes(loc.id);
                            return (
                                <label key={loc.id} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTempLocBookmarks([...tempLocBookmarks, loc.id]);
                                            } else {
                                                setTempLocBookmarks(tempLocBookmarks.filter(id => id !== loc.id));
                                            }
                                        }}
                                    />
                                    <span>{loc.name}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => locBookmarkDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Bookmarks</button>
                    </div>
                </form>
            </dialog>
        </>
    );
}

// Recursive sidebar node component
function SidebarTreeNode({ 
    node, 
    allNodes, 
    selectedId, 
    onSelect, 
    depth, 
    expandedIds, 
    onToggleExpand,
    bookmarkedIds,
    showBookmarkedOnly
}) {
    const children = allNodes.filter(n => n.parent_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.includes(node.id);
    const isVisible = !showBookmarkedOnly || bookmarkedIds.includes(node.id);
    
    const hasVisibleChildren = children.some(child => {
        const checkVisible = (n) => {
            if (bookmarkedIds.includes(n.id)) return true;
            const sub = allNodes.filter(c => c.parent_id === n.id);
            return sub.some(checkVisible);
        };
        return !showBookmarkedOnly || checkVisible(child);
    });

    if (!isVisible && !hasVisibleChildren) return null;

    return (
        <div className="sidebar-tree-node-wrapper" style={{ textTransform: 'none' }}>
            <div 
                className="sidebar-tree-row" 
                style={{ paddingLeft: `${depth * 14}px` }}
            >
                {hasChildren ? (
                    <button 
                        type="button"
                        className="btn-tree-expand" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(node.id);
                        }}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                ) : (
                    <span className="tree-dot">•</span>
                )}
                
                <div 
                    className={`chip tree-chip ${Number(selectedId) === node.id ? 'active' : ''}`}
                    onClick={() => onSelect(node.id)}
                    title={node.description || ''}
                >
                    {node.name}
                    {bookmarkedIds.includes(node.id) && <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>⭐</span>}
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="sidebar-tree-children">
                    {children.map(child => (
                        <SidebarTreeNode
                            key={child.id}
                            node={child}
                            allNodes={allNodes}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            bookmarkedIds={bookmarkedIds}
                            showBookmarkedOnly={showBookmarkedOnly}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Custom Fuzzy Select Component
function FuzzySelect({ 
    options, 
    selectedId, 
    onSelect, 
    bookmarkedIds, 
    placeholder, 
    onCreate, 
    typeLabel 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    const exactMatch = options.some(opt => opt.name.toLowerCase() === search.toLowerCase().trim());
    const selectedItem = options.find(opt => opt.id === Number(selectedId));
    
    const getPath = (id) => {
        const path = [];
        let curr = options.find(o => o.id === id);
        while (curr) {
            path.unshift(curr.name);
            curr = curr.parent_id ? options.find(o => o.id === curr.parent_id) : null;
        }
        return path.join(' > ') || placeholder;
    };

    const displayVal = selectedItem ? getPath(selectedItem.id) : placeholder;

    return (
        <div className="custom-select-container" ref={containerRef}>
            <div 
                className="custom-select-trigger" 
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch('');
                }}
            >
                <span>{displayVal}</span>
                <span className="select-arrow">▼</span>
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    <div className="custom-select-search-wrapper">
                        <input 
                            type="text" 
                            className="custom-select-search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${typeLabel.toLowerCase()}s...`}
                            autoFocus
                        />
                    </div>
                    <div className="custom-select-options-list">
                        {bookmarkedIds.length > 0 && search === '' && (
                            <div className="select-group-header">🔖 Bookmarked</div>
                        )}
                        {search === '' && bookmarkedIds.map(bid => {
                            const opt = options.find(o => o.id === bid);
                            if (!opt) return null;
                            return (
                                <div 
                                    key={`bookmark-${opt.id}`} 
                                    className={`custom-select-option ${Number(selectedId) === opt.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        onSelect(opt.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    ⭐ {getPath(opt.id)}
                                </div>
                            );
                        })}

                        {bookmarkedIds.length > 0 && search === '' && (
                            <div className="select-group-header">All Options</div>
                        )}
                        
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt.id} 
                                    className={`custom-select-option ${Number(selectedId) === opt.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        onSelect(opt.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    {getPath(opt.id)}
                                </div>
                            ))
                        ) : (
                            search.trim() === '' && <div className="custom-select-no-options">No options available</div>
                        )}

                        {search.trim() !== '' && !exactMatch && (
                            <div 
                                className="custom-select-create-option"
                                onClick={() => {
                                    onCreate(search.trim());
                                    setIsOpen(false);
                                }}
                            >
                                ＋ Create "{search.trim()}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
