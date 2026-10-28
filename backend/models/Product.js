/**
 * FreshCart - Product Schema & Model
 * MongoDB Schema Design & Validation
 */

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let ProductModel = null;

if (mongoose) {
  const productSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
      },
      category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: [
          'Fruits & Vegetables',
          'Dairy & Breakfast',
          'Staples & Grains',
          'Snacks & Drinks',
          'Household & Personal'
        ]
      },
      price: {
        type: Number,
        required: [true, 'Please specify the price in INR'],
        min: [0, 'Price must be positive']
      },
      discountPrice: {
        type: Number,
        default: null
      },
      stockQuantity: {
        type: Number,
        required: [true, 'Please specify available stock count'],
        min: [0, 'Stock cannot be negative'],
        default: 0
      },
      unit: {
        type: String,
        required: [true, 'Please specify unit (e.g. 1 kg, 500g, 1L)'],
        trim: true
      },
      image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'
      },
      description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
      },
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        default: 4.5
      },
      isFeatured: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

  // Indexing for faster searching and category filtering
  productSchema.index({ name: 'text', description: 'text' });
  productSchema.index({ category: 1, price: 1 });

  ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
}

module.exports = ProductModel;
