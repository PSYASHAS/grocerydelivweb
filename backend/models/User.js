/**
 * FreshCart - User Schema & Model
 * Day 4: MongoDB Schema Design & Validation
 */

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let UserModel = null;

if (mongoose) {
  const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email'
        ]
      },
      role: {
        type: String,
        enum: ['customer', 'admin', 'delivery'],
        default: 'customer'
      },
      password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
      },
      phone: {
        type: String,
        default: '9876543210'
      },
      savedAddresses: [
        {
          street: String,
          city: String,
          pincode: String,
          isDefault: Boolean
        }
      ]
    },
    {
      timestamps: true
    }
  );

  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
}

module.exports = UserModel;
