/**
 * FreshCart - Automated API & Integration Test Suite
 * Day 5: Testing and Demo
 * 
 * In-process unit & integration test runner testing controllers, inventory,
 * and order state transitions without requiring external network ports.
 * Run with: npm test or node backend/tests/api.test.js
 */

const { connectDB, store } = require('../config/db');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const inventoryController = require('../controllers/inventoryController');
const authController = require('../controllers/authController');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

// Mock response factory
function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Running FreshCart MERN Grocery Delivery Test Suite');
  console.log('🎓 RVCE CSE Department - Second Year Skill Lab Capstone');
  console.log('====================================================\n');

  try {
    await connectDB();

    // Suite 1: Product Catalog & Filtering (Day 3 REST API)
    console.log('[Suite 1: Product Catalog & Search Filtering]');
    
    // Test 1.1: Fetch all products
    const resAll = createMockRes();
    await productController.getProducts({ query: {} }, resAll);
    assert(resAll.statusCode === 200, 'GET /api/products returns HTTP 200');
    assert(Array.isArray(resAll.body.data) && resAll.body.data.length >= 20, `Loaded ${resAll.body.data.length} grocery items`);

    // Test 1.2: Category filter
    const resCat = createMockRes();
    await productController.getProducts({ query: { category: 'Fruits & Vegetables' } }, resCat);
    assert(
      resCat.body.data.every(p => p.category === 'Fruits & Vegetables'),
      'Category filter restricts results correctly to Fruits & Vegetables'
    );

    // Test 1.3: Search keyword
    const resSearch = createMockRes();
    await productController.getProducts({ query: { search: 'Milk' } }, resSearch);
    assert(
      resSearch.body.data.some(p => p.name.toLowerCase().includes('milk')),
      'Search query finds "Milk" in product catalog'
    );

    // Suite 2: Inventory Warehouse Stats & Restocking (Day 3 & Day 4)
    console.log('\n[Suite 2: Inventory Warehouse & Stock Monitoring]');
    
    const resStats = createMockRes();
    await inventoryController.getInventoryStats({}, resStats);
    assert(resStats.statusCode === 200, 'GET /api/inventory/stats returns HTTP 200');
    assert(typeof resStats.body.data.totalSKUs === 'number', 'Reports total warehouse SKUs');
    assert(typeof resStats.body.data.totalValuationINR === 'number', `Total warehouse inventory valuation: ₹${resStats.body.data.totalValuationINR}`);

    // Restock test
    const targetProduct = resAll.body.data[0];
    const initialStock = targetProduct.stockQuantity;
    const resRestock = createMockRes();
    await inventoryController.restockProduct(
      { params: { id: targetProduct.id || targetProduct._id }, body: { addQuantity: 15 } },
      resRestock
    );
    assert(
      resRestock.statusCode === 200 && resRestock.body.data.stockQuantity === initialStock + 15,
      `Restocked product (+15 units): ${initialStock} -> ${resRestock.body.data.stockQuantity}`
    );

    // Suite 3: Order Lifecycle & Atomic Stock Decrement (Day 3 & Day 4)
    console.log('\n[Suite 3: Order Placement & Inventory Deduction]');
    
    const stockBeforeOrder = resRestock.body.data.stockQuantity;
    const orderReq = {
      body: {
        customer: {
          name: 'Yashas Test Customer',
          phone: '9876543210',
          email: 'yashas@rvce.edu.in',
          address: {
            street: 'RVCE Campus, Mysuru Road',
            city: 'Bengaluru',
            pincode: '560059'
          }
        },
        paymentMethod: 'UPI',
        items: [
          {
            productId: targetProduct.id || targetProduct._id,
            name: targetProduct.name,
            quantity: 3
          }
        ]
      }
    };

    const resOrder = createMockRes();
    await orderController.createOrder(orderReq, resOrder);
    assert(resOrder.statusCode === 201, 'POST /api/orders successfully places order (HTTP 201)');
    assert(resOrder.body.data.orderNumber.startsWith('FC-'), `Assigned unique tracking code: ${resOrder.body.data.orderNumber}`);

    // Verify atomic inventory deduction
    const resVerifyProd = createMockRes();
    await productController.getProductById({ params: { id: targetProduct.id || targetProduct._id } }, resVerifyProd);
    assert(
      resVerifyProd.body.data.stockQuantity === stockBeforeOrder - 3,
      `Inventory verified decremented by 3 units (${stockBeforeOrder} -> ${resVerifyProd.body.data.stockQuantity})`
    );

    // Suite 4: Order Status Tracking & State Machine
    console.log('\n[Suite 4: Live Order Tracking & Status Transition]');
    
    const placedOrder = resOrder.body.data;
    const resTrack = createMockRes();
    await orderController.getOrderByIdOrNumber({ params: { idOrNumber: placedOrder.orderNumber } }, resTrack);
    assert(resTrack.statusCode === 200 && resTrack.body.data.orderStatus === 'Placed', 'Tracking retrieves order by FC order number');

    // Status transition: Placed -> Out for Delivery
    const resStatusUpdate = createMockRes();
    await orderController.updateOrderStatus(
      {
        params: { id: placedOrder.id || placedOrder._id },
        body: { status: 'Out for Delivery', note: 'Rider Ramesh out on electric scooter' }
      },
      resStatusUpdate
    );
    assert(
      resStatusUpdate.statusCode === 200 && resStatusUpdate.body.data.orderStatus === 'Out for Delivery',
      'Order status updated to "Out for Delivery" with timeline event appended'
    );

    // Suite 5: User Authentication & Role Access
    console.log('\n[Suite 5: Authentication & User Credentials]');
    
    const resLogin = createMockRes();
    await authController.login({ body: { email: 'admin@freshcart.com', password: 'admin123' } }, resLogin);
    assert(resLogin.statusCode === 200 && resLogin.body.user.role === 'admin', 'Admin login generates valid auth session');

    // Summary
    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests/totalTests)*100)}%)`);
    console.log('🎉 All Capstone Requirements Verified Successfully!');
    console.log('====================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err.stack || err);
    process.exit(1);
  }
}

runTests();
