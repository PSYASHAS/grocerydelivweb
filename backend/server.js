/**
 * FreshCart - Grocery Delivery Full Stack Backend
 * RVCE CSE Department - Second Year Skill Lab Capstone
 * 
 * Supports both Express.js and zero-dependency native Node.js HTTP fallback.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Environment variables
const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Database initialization
const { connectDB, isMongo, store } = require('./config/db');

// Controllers
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const inventoryController = require('./controllers/inventoryController');
const authController = require('./controllers/authController');

let app = null;
let expressLoaded = false;

try {
  const express = require('express');
  const cors = require('cors');

  app = express();
  expressLoaded = true;

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/inventory', require('./routes/inventoryRoutes'));
  app.use('/api/auth', require('./routes/authRoutes'));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      appName: 'FreshCart Grocery Delivery API',
      version: '1.0.0',
      database: isMongo() ? 'MongoDB Connected' : 'Embedded JSON Datastore',
      timestamp: new Date().toISOString()
    });
  });

  // Serve Frontend Static Assets
  app.use(express.static(FRONTEND_DIR));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

} catch (err) {
  console.log('[Server] Express package not installed; starting built-in Zero-Dependency Server Engine.');
}

// Zero-dependency native HTTP fallback server
const createFallbackServer = () => {
  return http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    console.log(`[Native-HTTP] ${method} ${pathname}`);

    // Helper to send JSON
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Helper to parse JSON body
    const parseBody = () => new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
    });

    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        sendJson(this.statusCode || 200, data);
      }
    };

    // Health check
    if (pathname === '/api/health') {
      return sendJson(200, {
        status: 'UP',
        appName: 'FreshCart Grocery Delivery API',
        version: '1.0.0',
        database: 'Embedded JSON Datastore',
        engine: 'Node.js Native HTTP',
        timestamp: new Date().toISOString()
      });
    }

    // Auth Routes
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody();
      return authController.login({ body }, mockRes);
    }
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody();
      return authController.register({ body }, mockRes);
    }
    if (pathname === '/api/auth/me' && method === 'GET') {
      return authController.getMe({ headers: req.headers }, mockRes);
    }

    // Inventory Routes
    if (pathname === '/api/inventory/stats' && method === 'GET') {
      return inventoryController.getInventoryStats({}, mockRes);
    }
    const restockMatch = pathname.match(/^\/api\/inventory\/([^/]+)\/restock$/);
    if (restockMatch && method === 'PATCH') {
      const body = await parseBody();
      return inventoryController.restockProduct({ params: { id: restockMatch[1] }, body }, mockRes);
    }

    // Order Routes
    if (pathname === '/api/orders' && method === 'GET') {
      return orderController.getOrders({ query: parsedUrl.query }, mockRes);
    }
    if (pathname === '/api/orders' && method === 'POST') {
      const body = await parseBody();
      return orderController.createOrder({ body }, mockRes);
    }
    const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === 'PATCH') {
      const body = await parseBody();
      return orderController.updateOrderStatus({ params: { id: orderStatusMatch[1] }, body }, mockRes);
    }
    const orderIdMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (orderIdMatch && method === 'GET') {
      return orderController.getOrderByIdOrNumber({ params: { idOrNumber: orderIdMatch[1] } }, mockRes);
    }
    if (orderIdMatch && method === 'DELETE') {
      return orderController.deleteOrder({ params: { id: orderIdMatch[1] } }, mockRes);
    }

    // Product Routes
    if (pathname === '/api/products' && method === 'GET') {
      return productController.getProducts({ query: parsedUrl.query }, mockRes);
    }
    if (pathname === '/api/products' && method === 'POST') {
      const body = await parseBody();
      return productController.createProduct({ body }, mockRes);
    }
    const productIdMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productIdMatch && method === 'GET') {
      return productController.getProductById({ params: { id: productIdMatch[1] } }, mockRes);
    }
    if (productIdMatch && method === 'PUT') {
      const body = await parseBody();
      return productController.updateProduct({ params: { id: productIdMatch[1] }, body }, mockRes);
    }
    if (productIdMatch && method === 'DELETE') {
      return productController.deleteProduct({ params: { id: productIdMatch[1] } }, mockRes);
    }

    // Static Frontend File Serving
    let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

    // Default SPA fallback to index.html
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    sendJson(404, { success: false, error: 'Endpoint not found' });
  });
};

const startServer = async () => {
  await connectDB();

  const server = expressLoaded ? app : createFallbackServer();

  server.listen(PORT, () => {
    console.log(`
==================================================================
🥦 FreshCart Grocery Delivery Full-Stack System Active!
🎓 Lab Track: RVCE CSE Skill Lab Capstone (MERN Stack)
🌐 Web Storefront: http://localhost:${PORT}
⚡ REST API Base:  http://localhost:${PORT}/api/products
📦 Inventory API:  http://localhost:${PORT}/api/inventory/stats
🛵 Live Orders:    http://localhost:${PORT}/api/orders
🩺 Health Check:   http://localhost:${PORT}/api/health
==================================================================
    `);
  });
};

startServer();

module.exports = { app };
