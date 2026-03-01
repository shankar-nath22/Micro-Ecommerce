const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure a user can't wishlist the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
