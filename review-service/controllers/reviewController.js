const Review = require('../models/Review');

exports.createReview = async (req, res) => {
    try {
        const { productId, rating, comment, userName } = req.body;
        const userId = req.user.id;
        console.log('Creating review:', { productId, userId, userName, rating, comment });

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        const review = new Review({
            productId,
            userId,
            userName,
            rating,
            comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReviewStats = async (req, res) => {
    try {
        const { productId } = req.params;
        const stats = await Review.aggregate([
            { $match: { productId } },
            {
                $group: {
                    _id: '$productId',
                    averageRating: { $avg: '$rating' },
                    numReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({ averageRating: 0, numReviews: 0 });
        }

        res.json({
            averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
            numReviews: stats[0].numReviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBulkReviewStats = async (req, res) => {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds)) {
            return res.status(400).json({ error: 'productIds must be an array' });
        }

        const stats = await Review.aggregate([
            { $match: { productId: { $in: productIds } } },
            {
                $group: {
                    _id: '$productId',
                    averageRating: { $avg: '$rating' },
                    numReviews: { $sum: 1 }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => {
            statsMap[s._id] = {
                averageRating: parseFloat(s.averageRating.toFixed(1)),
                numReviews: s.numReviews
            };
        });

        res.json(statsMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const review = await Review.findOneAndUpdate(
            { _id: id, userId },
            { rating, comment },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = { _id: id };
        // Only owners can delete their reviews, unless it's an admin
        if (userRole !== 'ADMIN') {
            query.userId = userId;
        }

        const review = await Review.findOneAndDelete(query);

        if (!review) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
