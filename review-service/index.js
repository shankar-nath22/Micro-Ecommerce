const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const reviewController = require('./controllers/reviewController');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8089;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reviews_db';

// Middleware
// app.use(cors());
app.use(bodyParser.json());

// Routes
// Public routes
app.get('/reviews/product/:productId', reviewController.getProductReviews);
app.get('/reviews/stats/:productId', reviewController.getReviewStats);
app.post('/reviews/stats/bulk', reviewController.getBulkReviewStats);

// Protected routes
app.post('/reviews', auth, reviewController.createReview);
app.put('/reviews/:id', auth, reviewController.updateReview);
app.delete('/reviews/:id', auth, reviewController.deleteReview);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to Review MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Review Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
