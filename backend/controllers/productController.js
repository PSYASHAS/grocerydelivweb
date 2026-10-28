/**
 * FreshCart - Product Controller
 * Product Catalog, Filtering & CRUD Operations
 */

const { isMongo, store } = require('../config/db');
const Product = require('../models/Product');

// @desc    Get all products with category filter, search, & sorting
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, inStockOnly } = req.query;

    if (isMongo() && Product) {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (inStockOnly === 'true') {
        query.stockQuantity = { $gt: 0 };
      }

      let mongoQuery = Product.find(query);
      if (sort === 'price_asc') mongoQuery = mongoQuery.sort({ price: 1 });
      else if (sort === 'price_desc') mongoQuery = mongoQuery.sort({ price: -1 });
      else if (sort === 'rating') mongoQuery = mongoQuery.sort({ rating: -1 });

      const products = await mongoQuery.exec();
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    }

    // Fallback store logic
    let products = [...store.data.products];

    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (inStockOnly === 'true') {
      products = products.filter(p => p.stockQuantity > 0);
    }

    if (sort === 'price_asc') {
      products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sort === 'price_desc') {
      products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    }

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongo() && Product) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      return res.status(200).json({ success: true, data: product });
    }

    const product = store.data.products.find(p => p.id === id || p._id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, discountPrice, stockQuantity, unit, image, description } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, category, and price'
      });
    }

    if (isMongo() && Product) {
      const newProduct = await Product.create(req.body);
      return res.status(201).json({ success: true, data: newProduct });
    }

    const newProd = {
      id: `prod_${Date.now()}`,
      name,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 10,
      unit: unit || '1 unit',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      description: description || '',
      rating: 4.8,
      isFeatured: false,
      createdAt: new Date().toISOString()
    };

    store.data.products.unshift(newProd);
    store.persist();

    res.status(201).json({ success: true, data: newProd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update product details / stock
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongo() && Product) {
      const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, error: 'Product not found' });
      return res.status(200).json({ success: true, data: updated });
    }

    const idx = store.data.products.findIndex(p => p.id === id || p._id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    store.data.products[idx] = {
      ...store.data.products[idx],
      ...req.body
    };
    store.persist();

    res.status(200).json({ success: true, data: store.data.products[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongo() && Product) {
      const deleted = await Product.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Product not found' });
      return res.status(200).json({ success: true, message: 'Product removed' });
    }

    const initialLen = store.data.products.length;
    store.data.products = store.data.products.filter(p => p.id !== id && p._id !== id);

    if (store.data.products.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    store.persist();
    res.status(200).json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
