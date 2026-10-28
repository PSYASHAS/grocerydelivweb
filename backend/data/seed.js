/**
 * FreshCart - Database Seeder
 * Day 4: MongoDB Database Integration & Data Seeding
 * 
 * Run with: npm run seed or node backend/data/seed.js
 */

const fs = require('fs');
const path = require('path');
const { connectDB, isMongo, store } = require('../config/db');

let Product = null;
let Order = null;
let User = null;

try {
  Product = require('../models/Product');
  Order = require('../models/Order');
  User = require('../models/User');
} catch (e) {}

const seedDatabase = async () => {
  console.log('🌱 Starting FreshCart Database Seeding...');

  await connectDB();

  const sampleProducts = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'sampleProducts.json'), 'utf8')
  );

  if (isMongo() && Product && Order && User) {
    try {
      console.log('Clearing existing MongoDB collections...');
      await Product.deleteMany({});
      await Order.deleteMany({});
      await User.deleteMany({});

      console.log(`Inserting ${sampleProducts.length} grocery items into MongoDB...`);
      const createdProducts = await Product.insertMany(sampleProducts);

      console.log('Creating Admin & Demo Customer users...');
      await User.create([
        {
          name: 'Store Manager',
          email: 'admin@freshcart.com',
          password: 'admin123',
          role: 'admin',
          phone: '9876543210'
        },
        {
          name: 'Yashas (Student)',
          email: 'yashas@rvce.edu.in',
          password: 'user123',
          role: 'customer',
          phone: '9988776655'
        }
      ]);

      console.log('Creating Initial Demo Order...');
      await Order.create({
        orderNumber: 'FC-102938',
        customer: {
          name: 'Yashas',
          phone: '9988776655',
          email: 'yashas@rvce.edu.in',
          address: {
            street: 'RVCE Campus, Mysuru Road',
            city: 'Bengaluru',
            pincode: '560059'
          }
        },
        items: [
          {
            productId: createdProducts[0]._id,
            name: createdProducts[0].name,
            price: createdProducts[0].discountPrice || createdProducts[0].price,
            quantity: 2,
            unit: createdProducts[0].unit,
            image: createdProducts[0].image
          },
          {
            productId: createdProducts[5]._id,
            name: createdProducts[5].name,
            price: createdProducts[5].discountPrice || createdProducts[5].price,
            quantity: 1,
            unit: createdProducts[5].unit,
            image: createdProducts[5].image
          }
        ],
        subtotal: (createdProducts[0].discountPrice || createdProducts[0].price) * 2 + (createdProducts[5].discountPrice || createdProducts[5].price),
        deliveryFee: 40,
        totalAmount: (createdProducts[0].discountPrice || createdProducts[0].price) * 2 + (createdProducts[5].discountPrice || createdProducts[5].price) + 40,
        paymentMethod: 'UPI',
        paymentStatus: 'Completed',
        orderStatus: 'Packing',
        timeline: [
          { status: 'Placed', timestamp: new Date(Date.now() - 15 * 60 * 1000), note: 'Order placed by student' },
          { status: 'Packing', timestamp: new Date(Date.now() - 5 * 60 * 1000), note: 'Grocery items being packed in crate' }
        ]
      });

      console.log('✅ MongoDB Database Seeded Successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    }
  } else {
    console.log('Seeding Embedded Resilient JSON store...');
    store.data.products = sampleProducts;
    store.data.orders = [
      {
        id: 'ord_demo_1',
        orderNumber: 'FC-102938',
        customer: {
          name: 'Yashas',
          phone: '9988776655',
          email: 'yashas@rvce.edu.in',
          address: {
            street: 'RVCE Campus, Mysuru Road',
            city: 'Bengaluru',
            pincode: '560059'
          }
        },
        items: [
          {
            productId: 'prod_001',
            name: 'Farm Fresh Red Tomatoes',
            price: 32,
            quantity: 2,
            unit: '1 kg',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500'
          },
          {
            productId: 'prod_006',
            name: 'Amul Taaza Fresh Toned Milk',
            price: 52,
            quantity: 1,
            unit: '1 Litre Pouch',
            image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500'
          }
        ],
        subtotal: 116,
        deliveryFee: 40,
        totalAmount: 156,
        paymentMethod: 'UPI',
        paymentStatus: 'Completed',
        orderStatus: 'Packing',
        deliveryOtp: '4829',
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'Placed', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'Order placed by student' },
          { status: 'Packing', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), note: 'Grocery items being packed in crate' }
        ]
      }
    ];
    store.data.users = [
      {
        id: 'usr_admin',
        name: 'Store Manager',
        email: 'admin@freshcart.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        id: 'usr_demo',
        name: 'Yashas',
        email: 'yashas@rvce.edu.in',
        password: 'user123',
        role: 'customer'
      }
    ];
    store.persist();
    console.log('✅ Persistent JSON Datastore Seeded Successfully!');
    process.exit(0);
  }
};

seedDatabase();
