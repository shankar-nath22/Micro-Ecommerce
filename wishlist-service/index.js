const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const { addToWishlist, removeFromWishlist, getWishlist } = require('./controllers/wishlistController');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8088;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wishlist_db';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB (Wishlist)'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
// All wishlist routes require USER role
app.post('/wishlist/add', authenticate, requireRole('USER'), addToWishlist);
app.delete('/wishlist/remove/:productId', authenticate, requireRole('USER'), removeFromWishlist);
app.get('/wishlist', authenticate, requireRole('USER'), getWishlist);

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Wishlist Service' });
});

app.listen(PORT, () => {
    console.log(`🚀 Wishlist Service started on port ${PORT}`);
});
