/**
 * FreshCart - React Frontend Application
 * Production Hyperlocal Grocery Delivery Platform
 */

const { useState, useEffect, useMemo } = React;

function FreshCartApp() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState('store'); // 'store' | 'admin' | 'tracking'
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  
  // Data State
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Cart State (stored in localStorage for persistence)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('freshcart_cart');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Orders & Tracking State
  const [activeOrder, setActiveOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  
  // Inventory Stats State (for Admin Dashboard)
  const [inventoryStats, setInventoryStats] = useState(null);

  // Product CRUD Modal State
  const [productModalMode, setProductModalMode] = useState(null); // 'create' | 'edit' | null
  const [productToEdit, setProductToEdit] = useState(null);

  // Authentication State (Login System at Start)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('freshcart_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    return !localStorage.getItem('freshcart_user');
  });

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('freshcart_user', JSON.stringify(user));
      if (token) localStorage.setItem('freshcart_token', token);
    } catch (e) {}
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('freshcart_user');
      localStorage.removeItem('freshcart_token');
    } catch (e) {}
    setIsAuthModalOpen(true);
    setCurrentView('store');
  };

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('freshcart_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Load Initial Products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await window.FreshCartAPI.getProducts({
        category: selectedCategory,
        search: searchQuery
      });
      setProducts(Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      const [stats, orders] = await Promise.all([
        window.FreshCartAPI.getInventoryStats(),
        window.FreshCartAPI.getOrders()
      ]);
      setInventoryStats(stats);
      setAllOrders(orders);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    if (currentView === 'admin') {
      loadAdminData();
    }
  }, [currentView]);

  // Cart Operations
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) return;
    setCart(prev => {
      const currentQty = prev[product.id || product._id]?.quantity || 0;
      if (currentQty >= product.stockQuantity) {
        alert(`Cannot add more. Only ${product.stockQuantity} items in stock!`);
        return prev;
      }
      return {
        ...prev,
        [product.id || product._id]: {
          product,
          quantity: currentQty + 1
        }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1
        }
      };
    });
  };

  // Cart Totals
  const cartList = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartList.reduce((sum, item) => sum + item.quantity, 0), [cartList]);
  const subtotal = useMemo(() => {
    return cartList.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cartList]);

  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  // Checkout Handler
  const handleCheckoutSubmit = async (customerData) => {
    try {
      const orderPayload = {
        customer: {
          name: customerData.name || currentUser?.name || 'Customer',
          phone: customerData.phone || currentUser?.phone || '9876543210',
          email: customerData.email || currentUser?.email || 'customer@freshcart.com',
          address: customerData.address
        },
        paymentMethod: customerData.paymentMethod || 'COD',
        items: cartList.map(item => ({
          productId: item.product.id || item.product._id,
          name: item.product.name,
          quantity: item.quantity
        }))
      };

      const res = await window.FreshCartAPI.createOrder(orderPayload);
      setActiveOrder(res.data);
      setCart({});
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setCurrentView('tracking');
      loadProducts(); // Refresh stocks
    } catch (err) {
      alert(`Checkout Failed: ${err.message}`);
    }
  };

  // Restock Handler (Admin)
  const handleRestock = async (productId, amount = 15) => {
    try {
      await window.FreshCartAPI.restockProduct(productId, amount);
      loadAdminData();
      loadProducts();
    } catch (err) {
      alert(`Restock failed: ${err.message}`);
    }
  };

  // Order Status Transition Handler (Admin)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await window.FreshCartAPI.updateOrderStatus(orderId, newStatus);
      loadAdminData();
      if (activeOrder && (activeOrder.id === orderId || activeOrder._id === orderId)) {
        const refreshed = await window.FreshCartAPI.trackOrder(activeOrder.orderNumber);
        setActiveOrder(refreshed);
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Delete order ${orderNumber} from database?`)) return;
    try {
      await window.FreshCartAPI.deleteOrder(orderId);
      loadAdminData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Product CRUD Handlers (Admin)
  const openCreateProductModal = () => {
    setProductToEdit(null);
    setProductModalMode('create');
  };

  const openEditProductModal = (product) => {
    setProductToEdit(product);
    setProductModalMode('edit');
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (productModalMode === 'edit') {
        const id = productToEdit.id || productToEdit._id;
        await window.FreshCartAPI.updateProduct(id, productData);
        alert('Product updated successfully!');
      } else {
        await window.FreshCartAPI.createProduct(productData);
        alert('New grocery product added to catalog!');
      }
      setProductModalMode(null);
      setProductToEdit(null);
      loadProducts();
      loadAdminData();
    } catch (err) {
      alert(`Error saving product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}" from the catalog?`)) {
      return;
    }
    try {
      await window.FreshCartAPI.deleteProduct(productId);
      alert(`Successfully removed "${productName}" from inventory.`);
      loadProducts();
      loadAdminData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const categories = [
    { label: 'All', icon: '🛒' },
    { label: 'Fruits & Vegetables', icon: '🥦' },
    { label: 'Dairy & Breakfast', icon: '🥛' },
    { label: 'Staples & Grains', icon: '🌾' },
    { label: 'Snacks & Drinks', icon: '🍪' },
    { label: 'Household & Personal', icon: '🧼' }
  ];

  return (
    <div className={isPhoneMode ? "phone-mode-active" : ""}>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo-brand" onClick={() => setCurrentView('store')}>
            <span>🥬 FreshCart</span>
            <span className="badge">Instant 15m</span>
            <a
              href="/api/health"
              target="_blank"
              style={{
                fontSize: '0.72rem',
                background: '#d1fae5',
                color: '#065f46',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: '0.4rem'
              }}
              title="Click to view live MongoDB system health"
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
              MongoDB 27017
            </a>
          </div>

          {currentView === 'store' && (
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search fresh mangoes, milk, brown bread, atta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="nav-actions">
            <button
              className={`btn ${currentView === 'store' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCurrentView('store')}
            >
              🛒 Store
            </button>

            <button
              className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (currentUser?.role !== 'admin') {
                  alert('🔒 Access Restricted: Store Manager (Admin) login required to manage warehouse inventory and CRUD operations.');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentView('admin');
              }}
            >
              📦 Inventory & Orders
            </button>

            {activeOrder && (
              <button
                className={`btn ${currentView === 'tracking' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCurrentView('tracking')}
              >
                🛵 Track
              </button>
            )}

            <button
              className="btn btn-outline"
              title="Toggle Phone Simulator Frame for Mobile UI Review"
              onClick={() => setIsPhoneMode(!isPhoneMode)}
            >
              {isPhoneMode ? '🖥️ Desktop' : '📱 Mobile View'}
            </button>

            {currentView === 'store' && (
              <button className="btn btn-cart" onClick={() => setIsCartOpen(true)}>
                🛒 Cart
                {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
              </button>
            )}

            {/* User Profile Badge / Login Trigger */}
            {currentUser ? (
              <div
                className="user-profile-badge"
                title="Click to switch account"
                onClick={() => setIsAuthModalOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                <span>{currentUser.role === 'admin' ? '🛡️' : '👤'} {currentUser.name}</span>
                <span className={`user-role-tag ${currentUser.role === 'admin' ? 'user-role-admin' : 'user-role-customer'}`}>
                  {currentUser.role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', marginLeft: '4px' }}
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsAuthModalOpen(true)}>
                🔑 Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container">
        {currentView === 'store' && (
          <div>
            {/* Hero Promotional Banner */}
            <div className="hero-banner">
              <div className="hero-text">
                <h1>⚡ Instant Grocery Delivery in 15 Mins</h1>
                <p>Farm-fresh fruits, organic dairy, daily essentials, and pantry items directly at your doorstep in Bengaluru.</p>
                <div className="hero-pills">
                  <span className="hero-pill">🌱 100% Organic & Farm Fresh</span>
                  <span className="hero-pill">🛵 Free Delivery above ₹499</span>
                  <span className="hero-pill">📦 Real-time Inventory</span>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="category-bar">
              {categories.map(cat => (
                <button
                  key={cat.label}
                  className={`category-pill ${selectedCategory === cat.label ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.label)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Section Header */}
            <div className="section-header">
              <h2 className="section-title">
                {selectedCategory === 'All' ? 'All Groceries & Daily Essentials' : selectedCategory}
              </h2>
              <span className="item-count-text">
                Showing {products.length} fresh products
              </span>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>Loading fresh grocery inventory...</h3>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px' }}>
                <h3>No grocery items found matching your search.</h3>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Try clearing your search keyword or switching category.</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map(product => {
                  const prodId = product.id || product._id;
                  const inCartQty = cart[prodId]?.quantity || 0;
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;

                  return (
                    <div key={prodId} className="product-card">
                      <div className="product-image-box">
                        <img src={product.image} alt={product.name} className="product-image" />
                        {product.discountPrice && (
                          <span className="discount-badge">
                            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                          </span>
                        )}
                        <span className={`stock-tag ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stockQuantity} left!` : 'In Stock'}
                        </span>
                      </div>

                      <div className="product-info">
                        <span className="product-category">{product.category}</span>
                        <h3 className="product-name">{product.name}</h3>
                        <span className="product-unit">{product.unit}</span>
                        <div className="product-rating">
                          ⭐ {product.rating} / 5.0
                        </div>

                        <div className="product-bottom">
                          <div className="price-box">
                            <span className="current-price">₹{product.discountPrice || product.price}</span>
                            {product.discountPrice && (
                              <span className="original-price">₹{product.price}</span>
                            )}
                          </div>

                          {isOutOfStock ? (
                            <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                              Sold Out
                            </button>
                          ) : inCartQty > 0 ? (
                            <div className="stepper">
                              <button className="stepper-btn" onClick={() => removeFromCart(prodId)}>-</button>
                              <span className="stepper-qty">{inCartQty}</span>
                              <button className="stepper-btn" onClick={() => addToCart(product)}>+</button>
                            </div>
                          ) : (
                            <button className="btn btn-primary" onClick={() => addToCart(product)}>
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Order Tracking View */}
        {currentView === 'tracking' && activeOrder && (
          <div className="tracking-card">
            <div className="tracking-header">
              <div>
                <h2>🛵 Live Delivery Tracking</h2>
                <p style={{ color: '#64748b' }}>Order Number: <strong>{activeOrder.orderNumber}</strong></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stock-tag in-stock" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                  Status: {activeOrder.orderStatus}
                </span>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Estimated Delivery: <strong>18 minutes</strong>
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="stepper-horizontal">
              {['Placed', 'Packing', 'Out for Delivery', 'Delivered'].map((stepName, idx) => {
                const statuses = ['Placed', 'Packing', 'Out for Delivery', 'Delivered'];
                const currentIdx = statuses.indexOf(activeOrder.orderStatus);
                const isCompleted = currentIdx >= idx;
                const isActive = activeOrder.orderStatus === stepName;

                return (
                  <div key={stepName} className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="step-circle">{isCompleted ? '✓' : idx + 1}</div>
                    <span className="step-label">{stepName}</span>
                  </div>
                );
              })}
            </div>

            {/* Delivery Partner Info */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>Rider: Ramesh Kumar (Electric Scooter)</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Delivery Address: {activeOrder.customer.address.street}, {activeOrder.customer.address.city} - {activeOrder.customer.address.pincode}</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Payment: {activeOrder.paymentMethod} (₹{activeOrder.totalAmount})</p>
              </div>
              <div style={{ textAlign: 'center', background: '#d1fae5', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>DELIVERY OTP</span>
                <h3 style={{ color: '#065f46', letterSpacing: '2px' }}>{activeOrder.deliveryOtp || '4829'}</h3>
              </div>
            </div>

            {/* Ordered Items Summary */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Items in this package:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeOrder.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>{it.quantity}x {it.name} ({it.unit})</span>
                    <strong>₹{it.price * it.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setCurrentView('store')}>
                ← Back to Shopping
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleStatusChange(activeOrder.id || activeOrder._id, 'Delivered')}
              >
                Simulate Delivery Completed (Demo)
              </button>
            </div>
          </div>
        )}

        {/* Warehouse Inventory & Order Management Dashboard (Admin View) */}
        {currentView === 'admin' && (
          <div style={{ margin: '1.5rem 0 3rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>📦 Warehouse Inventory & Order Dispatch</h2>
                <p style={{ color: '#64748b' }}>Real-time stock deduction, low stock alerts, and full CRUD grocery item management.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={openCreateProductModal}>
                  ➕ Add New Grocery Item
                </button>
                <span className="admin-badge">ADMIN DASHBOARD</span>
              </div>
            </div>

            {/* KPI Metrics */}
            {inventoryStats && (
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-val">{inventoryStats.totalSKUs}</div>
                  <div className="kpi-label">Active SKUs in Catalog</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="kpi-val" style={{ color: '#d97706' }}>{inventoryStats.lowStockCount}</div>
                  <div className="kpi-label">Low Stock Warnings (&lt;10)</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div className="kpi-val" style={{ color: '#ef4444' }}>{inventoryStats.outOfStockCount}</div>
                  <div className="kpi-label">Out of Stock Items</div>
                </div>
                <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="kpi-val" style={{ color: '#059669' }}>₹{inventoryStats.totalValuationINR.toLocaleString()}</div>
                  <div className="kpi-label">Total Inventory Valuation</div>
                </div>
              </div>
            )}

            {/* Low Stock Alerts & Quick Restock */}
            <div className="section-header">
              <h3 className="section-title">⚠️ Low Stock Alerts & Warehouse Restocking</h3>
            </div>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Available Stock</th>
                    <th>Unit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.stockQuantity < 10).map(p => (
                    <tr key={p.id || p._id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.category}</td>
                      <td>
                        <span className={`stock-tag ${p.stockQuantity === 0 ? 'out-of-stock' : 'low-stock'}`}>
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td>{p.unit}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleRestock(p.id || p._id, 15)}
                        >
                          + Restock 15 Units
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Complete Grocery Catalog CRUD Table */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
              <div>
                <h3 className="section-title">🥦 Full Product Catalog (CRUD: Create, Read, Update, Delete)</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>View, edit prices & stock, or delete items directly from the database.</p>
              </div>
              <button className="btn btn-primary" onClick={openCreateProductModal} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                + Add Product
              </button>
            </div>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price (INR)</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Actions (Update / Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const pid = p.id || p._id;
                    return (
                      <tr key={pid}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                            <div>
                              <strong>{p.name}</strong>
                              {p.discountPrice && (
                                <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
                                  ({Math.round(((p.price - p.discountPrice) / p.price) * 100)}% off)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td>
                          <strong>₹{p.discountPrice || p.price}</strong>
                          {p.discountPrice && <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.8rem', marginLeft: '4px' }}>₹{p.price}</span>}
                        </td>
                        <td>
                          <span className={`stock-tag ${p.stockQuantity === 0 ? 'out-of-stock' : p.stockQuantity < 10 ? 'low-stock' : 'in-stock'}`}>
                            {p.stockQuantity} units
                          </span>
                        </td>
                        <td>{p.unit}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              title="Edit price, stock, or details"
                              onClick={() => openEditProductModal(p)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              title="Delete from database"
                              onClick={() => handleDeleteProduct(pid, p.name)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Customer Orders Table */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
              <div>
                <h3 className="section-title">📋 Customer Orders Management</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>View real-time customer orders from MongoDB, update delivery status, or remove test orders.</p>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name & Account</th>
                    <th>Items</th>
                    <th>Total (INR)</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(ord => (
                    <tr key={ord.id || ord._id}>
                      <td><strong>{ord.orderNumber}</strong></td>
                      <td>
                        <strong>{ord.customer?.name}</strong>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          {ord.customer?.email || ord.customer?.phone}
                        </div>
                      </td>
                      <td>{ord.items?.length} items</td>
                      <td><strong>₹{ord.totalAmount}</strong></td>
                      <td>{ord.paymentMethod} ({ord.paymentStatus})</td>
                      <td>
                        <span className="stock-tag in-stock">{ord.orderStatus}</span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                          value={ord.orderStatus}
                          onChange={(e) => handleStatusChange(ord.id || ord._id, e.target.value)}
                        >
                          <option value="Placed">Placed</option>
                          <option value="Packing">Packing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Delete test order"
                          onClick={() => handleDeleteOrder(ord.id || ord._id, ord.orderNumber)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>My Grocery Basket ({cartItemCount})</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cartList.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <h3 style={{ marginTop: '1rem' }}>Your cart is empty</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Add fresh fruits, veggies, milk, or snacks to start shopping!</p>
              </div>
            ) : (
              <div className="cart-items">
                {cartList.map(({ product, quantity }) => {
                  const prodId = product.id || product._id;
                  const itemPrice = product.discountPrice || product.price;

                  return (
                    <div key={prodId} className="cart-item">
                      <img src={product.image} alt={product.name} className="cart-item-img" />
                      <div className="cart-item-details">
                        <div className="cart-item-title">{product.name}</div>
                        <div className="cart-item-unit">{product.unit}</div>
                        <div className="cart-item-price">₹{itemPrice * quantity}</div>
                      </div>

                      <div className="stepper">
                        <button className="stepper-btn" onClick={() => removeFromCart(prodId)}>-</button>
                        <span className="stepper-qty">{quantity}</span>
                        <button className="stepper-btn" onClick={() => addToCart(product)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cartList.length > 0 && (
              <div className="cart-footer">
                <div className="bill-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                {deliveryFee > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.5rem' }}>
                    💡 Add items worth ₹{499 - subtotal} more to get <strong>FREE delivery</strong>!
                  </p>
                )}
                <div className="bill-row total">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Proceed to Checkout (₹{grandTotal})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          currentUser={currentUser}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleCheckoutSubmit}
          totalAmount={grandTotal}
        />
      )}

      {/* Product Create/Edit CRUD Modal */}
      {productModalMode && (
        <ProductModal
          mode={productModalMode}
          initialData={productToEdit}
          onClose={() => { setProductModalMode(null); setProductToEdit(null); }}
          onSave={handleSaveProduct}
        />
      )}

      {/* Login / Authentication Modal (Shown at Start) */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => currentUser && setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

// Checkout Modal Subcomponent
function CheckoutModal({ currentUser, onClose, onSubmit, totalAmount }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [street, setStreet] = useState('100 Feet Road, Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560038');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !street || !pincode) {
      alert('Please fill in all delivery details');
      return;
    }
    onSubmit({
      name,
      phone,
      email: currentUser?.email || 'customer@freshcart.com',
      address: { street, city, pincode },
      paymentMethod
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2>Delivery Address & Payment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street Address & Landmark</label>
            <input
              type="text"
              className="form-input"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                className="form-input"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">💵 Cash on Delivery (COD)</option>
              <option value="UPI">📱 Instant UPI (GPay / PhonePe / Paytm)</option>
              <option value="CARD">💳 Credit / Debit Card</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', fontSize: '1rem' }}
          >
            Confirm & Place Grocery Order (₹{totalAmount})
          </button>
        </form>
      </div>
    </div>
  );
}

// Product Modal Component (CRUD: Create & Update)
function ProductModal({ mode, initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Fruits & Vegetables');
  const [price, setPrice] = useState(initialData?.price || '');
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice || '');
  const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity !== undefined ? initialData.stockQuantity : 20);
  const [unit, setUnit] = useState(initialData?.unit || '1 kg');
  const [image, setImage] = useState(initialData?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || stockQuantity === '') {
      alert('Please provide product name, price, and stock count');
      return;
    }

    onSave({
      name,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stockQuantity: Number(stockQuantity),
      unit,
      image,
      description
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2>{mode === 'edit' ? '✏️ Edit Grocery Item' : '➕ Add New Grocery Item'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Fresh Organic Strawberries"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Dairy & Breakfast">Dairy & Breakfast</option>
                <option value="Staples & Grains">Staples & Grains</option>
                <option value="Snacks & Drinks">Snacks & Drinks</option>
                <option value="Household & Personal">Household & Personal</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit / Packaging</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. 500 g, 1 kg, 1 Litre"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Regular Price (₹ INR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                placeholder="40"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Price (₹ INR, Optional)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="32"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Stock Quantity</label>
            <input
              type="number"
              min="0"
              className="form-input"
              required
              placeholder="25"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              className="form-input"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Product description and freshness details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Item to Catalog'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Authentication & Login Modal Component
function AuthModal({ currentUser, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('customer'); // 'customer' | 'admin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1-Click Fast Login Helper
  const handleQuickDemoLogin = (role) => {
    if (role === 'admin') {
      onLoginSuccess({
        id: 'usr_admin',
        name: 'Store Manager',
        email: 'admin@freshcart.com',
        role: 'admin'
      }, 'demo_token_admin_2026');
    } else {
      onLoginSuccess({
        id: 'usr_yashas',
        name: 'Yashas',
        email: 'yashas@freshcart.com',
        role: 'customer'
      }, 'demo_token_customer_2026');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone, role: 'customer' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        onLoginSuccess(data.user, data.token);
      } else {
        // Admin or Customer Login
        const targetEmail = tab === 'admin' && !email ? 'admin@freshcart.com' : email;
        const targetPassword = tab === 'admin' && !password ? 'admin123' : password;

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, password: targetPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid email or password');
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-header">
          <h2>🥬 FreshCart Login</h2>
          <p>Fast, Fresh & Hyperlocal 15-Minute Grocery Delivery</p>
        </div>

        <div className="auth-body">
          {/* 1-Click Fast Login */}
          <div className="demo-login-box">
            <h4>⚡ 1-Click Instant Demo Login</h4>
            <div className="demo-buttons">
              <button
                type="button"
                className="btn-demo"
                onClick={() => handleQuickDemoLogin('customer')}
              >
                👤 Yashas (Customer)
              </button>
              <button
                type="button"
                className="btn-demo"
                onClick={() => handleQuickDemoLogin('admin')}
              >
                🛡️ Store Manager (Admin)
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${tab === 'customer' ? 'active' : ''}`}
              onClick={() => { setTab('customer'); setEmail(''); setPassword(''); setError(''); }}
            >
              Customer Login
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => { setTab('admin'); setEmail('admin@freshcart.com'); setPassword('admin123'); setError(''); }}
            >
              Admin Login
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              New Sign Up
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Yashas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                required
                placeholder={tab === 'admin' ? 'admin@freshcart.com' : 'customer@freshcart.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
            >
              {loading ? 'Authenticating...' : tab === 'register' ? 'Create Account & Enter' : tab === 'admin' ? 'Login as Store Manager' : 'Login as Customer'}
            </button>

            {currentUser && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={onClose}
              >
                Cancel / Return to Store
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// Mount React Root
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<FreshCartApp />);
