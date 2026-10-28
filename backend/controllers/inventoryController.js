/**
 * FreshCart - Inventory Management Controller
 * Day 3: Node.js, Express, REST API
 * Handles real-time grocery warehouse inventory, low-stock warnings, and restocking.
 */

const { isMongo, store } = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get real-time warehouse inventory dashboard stats
// @route   GET /api/inventory/stats
// @access  Admin / Warehouse Manager
exports.getInventoryStats = async (req, res) => {
  try {
    if (isMongo() && Product && Order) {
      const allProducts = await Product.find({});
      const pendingOrders = await Order.countDocuments({
        orderStatus: { $in: ['Placed', 'Packing', 'Out for Delivery'] }
      });

      const totalSKUs = allProducts.length;
      const lowStockItems = allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10);
      const outOfStockItems = allProducts.filter(p => p.stockQuantity === 0);
      const totalInventoryUnits = allProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
      const totalValuation = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.price, 0);

      return res.status(200).json({
        success: true,
        data: {
          totalSKUs,
          totalInventoryUnits,
          totalValuationINR: totalValuation,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          pendingDeliveries: pendingOrders,
          lowStockAlerts: lowStockItems.map(p => ({
            id: p._id,
            name: p.name,
            category: p.category,
            stockQuantity: p.stockQuantity,
            unit: p.unit
          }))
        }
      });
    }

    const allProducts = store.data.products;
    const pendingOrders = store.data.orders.filter(o =>
      ['placed', 'packing', 'out for delivery'].includes((o.orderStatus || '').toLowerCase())
    ).length;

    const totalSKUs = allProducts.length;
    const lowStockItems = allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10);
    const outOfStockItems = allProducts.filter(p => p.stockQuantity === 0);
    const totalInventoryUnits = allProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalValuation = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.price, 0);

    res.status(200).json({
      success: true,
      data: {
        totalSKUs,
        totalInventoryUnits,
        totalValuationINR: totalValuation,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        pendingDeliveries: pendingOrders,
        lowStockAlerts: lowStockItems.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          stockQuantity: p.stockQuantity,
          unit: p.unit
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Restock grocery product quantity
// @route   PATCH /api/inventory/:id/restock
// @access  Admin
exports.restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { addQuantity } = req.body;

    const qtyToAdd = parseInt(addQuantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid positive quantity to add (e.g. 10, 25)'
      });
    }

    if (isMongo() && Product) {
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

      product.stockQuantity += qtyToAdd;
      await product.save();

      return res.status(200).json({
        success: true,
        message: `Restocked ${qtyToAdd} units of "${product.name}". New stock: ${product.stockQuantity}`,
        data: product
      });
    }

    const prod = store.data.products.find(p => p.id === id || p._id === id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    prod.stockQuantity = (prod.stockQuantity || 0) + qtyToAdd;
    store.persist();

    res.status(200).json({
      success: true,
      message: `Restocked ${qtyToAdd} units of "${prod.name}". New stock: ${prod.stockQuantity}`,
      data: prod
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
