/**
 * FreshCart - Database Configuration
 * MongoDB & Document Integration
 * 
 * Supports both MongoDB (via Mongoose) and an automated persistent JSON document
 * fallback store if MongoDB daemon is not running locally.
 */

const fs = require('fs');
const path = require('path');

// Simple native .env loader so environment variables are loaded with zero external dependencies
try {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match && !match[1].startsWith('#')) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {}

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (err) {
  // Mongoose not installed yet in sandbox/offline
}

const DB_FILE_PATH = path.join(__dirname, '..', 'data', 'db.json');
const SAMPLE_PRODUCTS_PATH = path.join(__dirname, '..', 'data', 'sampleProducts.json');

// Memory store fallback with disk sync
class PersistentJsonStore {
  constructor() {
    this.data = {
      products: [],
      orders: [],
      users: [],
      categories: [
        { id: 'cat_1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥦' },
        { id: 'cat_2', name: 'Dairy & Breakfast', slug: 'dairy-breakfast', icon: '🥛' },
        { id: 'cat_3', name: 'Staples & Grains', slug: 'staples-grains', icon: '🌾' },
        { id: 'cat_4', name: 'Snacks & Drinks', slug: 'snacks-drinks', icon: '🍪' },
        { id: 'cat_5', name: 'Household & Personal', slug: 'household-personal', icon: '🧼' }
      ]
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        // Load initial products from sampleProducts.json
        if (fs.existsSync(SAMPLE_PRODUCTS_PATH)) {
          const sampleRaw = fs.readFileSync(SAMPLE_PRODUCTS_PATH, 'utf8');
          this.data.products = JSON.parse(sampleRaw);
        }
        this.persist();
      }
    } catch (err) {
      console.error('[DB] Error loading database file:', err.message);
    }
  }

  persist() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Error persisting database file:', err.message);
    }
  }
}

const store = new PersistentJsonStore();

let isConnectedToMongo = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freshcart_db';

  if (!mongoose) {
    console.log('[DB] Mongoose driver not loaded. Using Embedded Resilient JSON Datastore.');
    return { isMongo: false, store };
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500 // Fail fast if local mongod is not started
    });
    isConnectedToMongo = true;
    console.log(`[DB] MongoDB Connected successfully: ${conn.connection.host}`);
    return { isMongo: true, connection: conn };
  } catch (err) {
    console.log(`[DB] Notice: Local MongoDB connection to ${mongoURI} was not detected (${err.message}).`);
    console.log(`[DB] -> Seamlessly activating Persistent JSON Datastore at backend/data/db.json.`);
    console.log(`[DB] -> All CRUD, inventory updates, and order placements are fully functional!`);
    return { isMongo: false, store };
  }
};

module.exports = {
  connectDB,
  isMongo: () => isConnectedToMongo,
  store
};
