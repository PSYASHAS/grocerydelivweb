/**
 * FreshCart - Order Schema & Model
 * MongoDB Schema Design & Validation
 */

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let OrderModel = null;

if (mongoose) {
  const orderItemSchema = new mongoose.Schema({
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unit: String,
    image: String
  });

  const orderSchema = new mongoose.Schema(
    {
      orderNumber: {
        type: String,
        required: true,
        unique: true
      },
      customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        address: {
          street: { type: String, required: true },
          city: { type: String, default: 'Bengaluru' },
          pincode: { type: String, required: true }
        }
      },
      items: [orderItemSchema],
      subtotal: {
        type: Number,
        required: true
      },
      deliveryFee: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        required: true
      },
      paymentMethod: {
        type: String,
        enum: ['COD', 'UPI', 'CARD'],
        default: 'COD'
      },
      paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
      },
      orderStatus: {
        type: String,
        enum: ['Placed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Placed'
      },
      deliveryOtp: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString()
      },
      timeline: [
        {
          status: String,
          timestamp: { type: Date, default: Date.now },
          note: String
        }
      ]
    },
    {
      timestamps: true
    }
  );

  OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
}

module.exports = OrderModel;
