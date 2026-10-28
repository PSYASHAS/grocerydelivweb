/**
 * FreshCart - Inventory Routes
 * Warehouse & Stock REST endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getInventoryStats,
  restockProduct
} = require('../controllers/inventoryController');

router.get('/stats', getInventoryStats);
router.patch('/:id/restock', restockProduct);

module.exports = router;
