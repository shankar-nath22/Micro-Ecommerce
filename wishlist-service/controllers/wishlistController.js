const Wishlist = require('../models/Wishlist');

const addToWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id; // From JWT

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    try {
        const item = new Wishlist({ userId, productId });
        await item.save();
        res.status(201).json({ message: 'Added to wishlist', item });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }
        console.error(err);
        res.status(500).json({ message: 'Error adding to wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const result = await Wishlist.findOneAndDelete({ userId, productId });
        if (!result) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }
        res.json({ message: 'Removed from wishlist' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error removing from wishlist' });
    }
};

const getWishlist = async (req, res) => {
    const userId = req.user.id;

    try {
        const items = await Wishlist.find({ userId }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching wishlist' });
    }
};

module.exports = { addToWishlist, removeFromWishlist, getWishlist };
