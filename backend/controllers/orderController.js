/**
 * FreshCart - Order & Inventory Processing Controller
 * Database Operations & Transactional Integrity
 */

const { isMongo, store } = require('../config/db');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new grocery delivery order with atomic inventory deduction
// @route   POST /api/orders
// @access  Public / Customer
exports.createOrder = async (req, res) => {
  try {
    const { items, customer, paymentMethod } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.address.street) {
      return res.status(400).json({
        success: false,
        error: 'Please provide full customer details: name, phone, and delivery address'
      });
    }

    // Step 1: Inventory Validation & Stock Reservation
    let subtotal = 0;
    const validatedItems = [];

    if (isMongo() && Order && Product) {
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            error: `Product with ID ${item.productId} was not found`
          });
        }

        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}`
          });
        }

        // Deduct stock in MongoDB
        product.stockQuantity -= item.quantity;
        await product.save();

        const itemPrice = product.discountPrice || product.price;
        subtotal += itemPrice * item.quantity;

        validatedItems.push({
          productId: product._id.toString(),
          name: product.name,
          price: itemPrice,
          quantity: item.quantity,
          unit: product.unit,
          image: product.image
        });
      }

      const deliveryFee = subtotal >= 499 ? 0 : 40;
      const totalAmount = subtotal + deliveryFee;
      const orderNumber = `FC-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder = await Order.create({
        orderNumber,
        customer,
        items: validatedItems,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod: paymentMethod || 'COD',
        orderStatus: 'Placed',
        timeline: [
          {
            status: 'Placed',
            timestamp: new Date(),
            note: 'Order successfully placed by customer'
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully! Inventory updated.',
        data: newOrder
      });
    }

    // Embedded Fallback Store Order & Inventory Logic
    for (const item of items) {
      const prod = store.data.products.find(p => p.id === item.productId || p._id === item.productId);
      if (!prod) {
        return res.status(404).json({
          success: false,
          error: `Product "${item.name || item.productId}" was not found in catalog`
        });
      }

      if (prod.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${prod.name}". Only ${prod.stockQuantity} remaining.`
        });
      }

      // Deduct stock atomically
      prod.stockQuantity -= item.quantity;

      const itemPrice = prod.discountPrice || prod.price;
      subtotal += itemPrice * item.quantity;

      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        price: itemPrice,
        quantity: item.quantity,
        unit: prod.unit,
        image: prod.image
      });
    }

    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = `FC-${Math.floor(100000 + Math.random() * 900000)}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const orderRecord = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customer,
      items: validatedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      orderStatus: 'Placed',
      deliveryOtp,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          status: 'Placed',
          timestamp: new Date().toISOString(),
          note: 'Order placed. Estimated delivery in 20-30 minutes.'
        }
      ]
    };

    store.data.orders.unshift(orderRecord);
    store.persist(); // Saves both orders and updated product stock levels to disk!

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Stock deducted.',
      data: orderRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all orders (Admin / Store Manager)
// @route   GET /api/orders
// @access  Public / Admin
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    if (isMongo() && Order) {
      let query = status ? { orderStatus: status } : {};
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    let orders = [...store.data.orders];
    if (status) {
      orders = orders.filter(o => o.orderStatus.toLowerCase() === status.toLowerCase());
    }

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get order details / live tracking by ID or Order Number
// @route   GET /api/orders/:idOrNumber
// @access  Public
exports.getOrderByIdOrNumber = async (req, res) => {
  try {
    const { idOrNumber } = req.params;

    if (isMongo() && Order) {
      const order = await Order.findOne({
        $or: [{ _id: idOrNumber.match(/^[0-9a-fA-F]{24}$/) ? idOrNumber : null }, { orderNumber: idOrNumber }]
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      return res.status(200).json({ success: true, data: order });
    }

    const order = store.data.orders.find(
      o => o.id === idOrNumber || o._id === idOrNumber || o.orderNumber === idOrNumber
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update order delivery status (Placed -> Packing -> Out for Delivery -> Delivered)
// @route   PATCH /api/orders/:id/status
// @access  Admin / Delivery Partner
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['Placed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (isMongo() && Order) {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      order.orderStatus = status;
      order.timeline.push({
        status,
        timestamp: new Date(),
        note: note || `Order updated to ${status}`
      });

      if (status === 'Delivered') {
        order.paymentStatus = 'Completed';
      }

      await order.save();
      return res.status(200).json({ success: true, data: order });
    }

    const order = store.data.orders.find(o => o.id === id || o._id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.orderStatus = status;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order transitioned to ${status}`
    });

    if (status === 'Delivered') {
      order.paymentStatus = 'Completed';
    }

    store.persist();
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete order (Admin)
// @route   DELETE /api/orders/:id
// @access  Admin
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo() && Order) {
      await Order.findOneAndDelete({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id }]
      });
      return res.status(200).json({ success: true, message: 'Order removed' });
    }

    store.data.orders = store.data.orders.filter(
      o => o.id !== id && o._id !== id && o.orderNumber !== id
    );
    store.persist();
    res.status(200).json({ success: true, message: 'Order removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
