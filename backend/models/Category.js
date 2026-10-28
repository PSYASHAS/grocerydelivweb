/**
 * FreshCart - Category Schema & Model
 * MongoDB Schema Design & Validation
 */

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let CategoryModel = null;

if (mongoose) {
  const categorySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true
      },
      slug: {
        type: String,
        required: true,
        unique: true
      },
      icon: {
        type: String,
        default: '🛒'
      },
      description: String
    },
    {
      timestamps: true
    }
  );

  CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema);
}

module.exports = CategoryModel;
