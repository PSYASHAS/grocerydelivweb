/**
 * FreshCart - Order Routes
 * Day 3: Express Router & Order Processing
 */

const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderByIdOrNumber,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.route('/:idOrNumber')
  .get(getOrderByIdOrNumber)
  .delete(deleteOrder);

router.route('/:id/status')
  .patch(updateOrderStatus);

module.exports = router;
