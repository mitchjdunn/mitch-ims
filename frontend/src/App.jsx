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

    // Form tracking states
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormError, setItemFormError] = useState('');
    const [catFormError, setCatFormError] = useState('');
    const [locFormError, setLocFormError] = useState('');

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

    const [categoryFields, setCategoryFields] = useState({ name: '', description: '' });
    const [locationFields, setLocationFields] = useState({ name: '', description: '' });

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
            fetchLogs()
        ]);
        await fetchItems();
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

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setCatFormValidated(true);
        const form = e.target;
        if (!form.checkValidity()) return;

        const payload = {
            name: categoryFields.name,
            description: categoryFields.description || null
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

            setCategoryFields({ name: '', description: '' });
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
            description: locationFields.description || null
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

            setLocationFields({ name: '', description: '' });
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

    // --- Statistics Computations ---

    const stats = {
        totalItems: items.length,
        totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
        lowStock: items.filter(item => item.status === 'low_stock').length,
        outOfStock: items.filter(item => item.status === 'out_of_stock').length,
        totalValue: items.reduce((sum, item) => sum + (item.quantity * (item.purchase_price || 0)), 0)
    };

    return (
        <>
            <div className="glass-bg"></div>

            <header className="app-header">
                <div className="logo-area">
                    <span className="logo-icon">▲</span>
                    <h1 className="logo-title">I<span>M</span>S</h1>
                </div>

                {/* Stats Dashboard */}
                <section class="stats-container" aria-label="Inventory Statistics">
                    <div className="stat-card">
                        <span className="stat-label">Total Items</span>
                        <span className="stat-value">{stats.totalItems}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Total Stock</span>
                        <span className="stat-value">{stats.totalQty}</span>
                    </div>
                    <div className="stat-card highlight-warning">
                        <span className="stat-label">Low Stock</span>
                        <span className="stat-value">{stats.lowStock}</span>
                    </div>
                    <div className="stat-card highlight-danger">
                        <span className="stat-label">Out of Stock</span>
                        <span className="stat-value">{stats.outOfStock}</span>
                    </div>
                    <div className="stat-card highlight-success">
                        <span className="stat-label">Est. Value</span>
                        <span className="stat-value">
                            ${stats.totalValue.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </section>
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
                            <div 
                                className={`chip ${selectedCategory === '' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                All Categories
                            </div>
                            {categories.map(cat => (
                                <div 
                                    key={cat.id} 
                                    className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                                    title={cat.description || ''}
                                >
                                    {cat.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="panel-section">
                        <div className="section-header">
                            <h2>Locations</h2>
                            <button className="btn-icon" onClick={() => locationDialogRef.current.showModal()} title="Add Location">＋</button>
                        </div>
                        <div className="chip-container">
                            <div 
                                className={`chip ${selectedLocation === '' ? 'active' : ''}`}
                                onClick={() => setSelectedLocation('')}
                            >
                                All Locations
                            </div>
                            {locations.map(loc => (
                                <div 
                                    key={loc.id} 
                                    className={`chip ${selectedLocation === loc.id ? 'active' : ''}`}
                                    onClick={() => setSelectedLocation(selectedLocation === loc.id ? '' : loc.id)}
                                    title={loc.description || ''}
                                >
                                    {loc.name}
                                </div>
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
                            <div className="items-grid">
                                {items.map(item => (
                                    <article key={item.id} className="item-card">
                                        <div>
                                            <header className="item-card-header">
                                                <h3 className="item-title">{item.name}</h3>
                                                <span className={`status-pill status-${item.status}`}>
                                                    {item.status.replace('_', ' ')}
                                                </span>
                                            </header>
                                            <p className="item-desc">{item.description || 'No description provided.'}</p>
                                            <div className="item-metadata">
                                                <div className="meta-row">
                                                    <span>Category:</span>
                                                    <span className="meta-value">{item.category_name || 'Uncategorized'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span>Location:</span>
                                                    <span className="meta-value">{item.location_name || 'Unknown'}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span>Quantity:</span>
                                                    <span className="meta-value">{item.quantity}</span>
                                                </div>
                                                <div className="meta-row">
                                                    <span>Price:</span>
                                                    <span className="meta-value">
                                                        {item.purchase_price !== null ? `$${item.purchase_price.toFixed(2)}` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn-action-edit" onClick={() => openEditItem(item)}>Edit</button>
                                            <button className="btn-action-delete" onClick={() => handleItemDelete(item.id)}>Delete</button>
                                        </div>
                                    </article>
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
                            <select 
                                value={itemFields.category_id}
                                onChange={(e) => setItemFields({ ...itemFields, category_id: e.target.value })}
                            >
                                <option value="">Uncategorized</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Location</label>
                            <select 
                                value={itemFields.location_id}
                                onChange={(e) => setItemFields({ ...itemFields, location_id: e.target.value })}
                            >
                                <option value="">Unknown Location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
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

                        <div className="form-group">
                            <label>Serial Number</label>
                            <input 
                                type="text" 
                                value={itemFields.serial_number}
                                onChange={(e) => setItemFields({ ...itemFields, serial_number: e.target.value })}
                                placeholder="S/N or Tag ID"
                            />
                        </div>

                        <div className="form-group">
                            <label>Model Number</label>
                            <input 
                                type="text" 
                                value={itemFields.model_number}
                                onChange={(e) => setItemFields({ ...itemFields, model_number: e.target.value })}
                                placeholder="Model Name/No."
                            />
                        </div>

                        <div className="form-group">
                            <label>Purchase Date</label>
                            <input 
                                type="date" 
                                value={itemFields.purchase_date}
                                onChange={(e) => setItemFields({ ...itemFields, purchase_date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Purchase Price ($)</label>
                            <input 
                                type="number" 
                                value={itemFields.purchase_price}
                                onChange={(e) => setItemFields({ ...itemFields, purchase_price: e.target.value })}
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                            />
                            <span className="error-msg">Price must be positive</span>
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
                        <label>Description</label>
                        <textarea 
                            value={categoryFields.description}
                            onChange={(e) => setCategoryFields({ ...categoryFields, description: e.target.value })}
                            rows="3" 
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
                        <label>Description</label>
                        <textarea 
                            value={locationFields.description}
                            onChange={(e) => setLocationFields({ ...locationFields, description: e.target.value })}
                            rows="3" 
                            placeholder="Location details"
                        />
                    </div>

                    <div className="dialog-actions">
                        <button type="button" className="btn-secondary" onClick={() => locationDialogRef.current.close()}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Location</button>
                    </div>
                </form>
            </dialog>
        </>
    );
}
