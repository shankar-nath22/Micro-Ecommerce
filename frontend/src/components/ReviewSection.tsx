import { useState, useEffect } from "react";
import api from "../api/axios";
import { useUserStore } from "../store/userStore";
import StarRating from "./StarRating";
import "./ReviewSection.css";
import toast from "react-hot-toast";

interface Review {
    _id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface ReviewSectionProps {
    productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({ averageRating: 0, numReviews: 0 });
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { token, userId, name: userName, role: userRole } = useUserStore();

    useEffect(() => {
        if (productId) {
            fetchReviews();
            fetchStats();
        }
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/reviews/product/${productId}`);
            setReviews(res.data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`/reviews/stats/${productId}`);
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error("Please login to leave a review");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/reviews/${editingId}`, {
                    rating,
                    comment
                });
                toast.success("Review updated!");
            } else {
                await api.post("/reviews", {
                    productId,
                    rating,
                    comment,
                    userName
                });
                toast.success("Review submitted!");
            }
            setComment("");
            setRating(5);
            setEditingId(null);
            fetchReviews();
            fetchStats();
        } catch (err: any) {
            const msg = err.response?.data?.error || "Failed to save review";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (review: Review) => {
        setEditingId(review._id);
        setRating(review.rating);
        setComment(review.comment);
        // Scroll to form
        const formElement = document.getElementById("review-form");
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setRating(5);
        setComment("");
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/reviews/${id}`);
            toast.success("Review deleted");
            fetchReviews();
            fetchStats();
        } catch (err) {
            toast.error("Failed to delete review");
        }
    };

    return (
        <div className="review-section">
            <div className="review-header">
                <h3>Customer Reviews</h3>
                <div className="stats-badge">
                    <StarRating rating={stats.averageRating} size={20} />
                    <span className="avg-text">{stats.averageRating}</span>
                    <span className="count-text">({stats.numReviews} reviews)</span>
                </div>
            </div>

            {token && (
                <form id="review-form" className="review-form glass-morphism" onSubmit={handleSubmit}>
                    <h4>{editingId ? "Edit Your Review" : "Write a Review"}</h4>
                    <div className="rating-input">
                        <span>Your Rating:</span>
                        <StarRating rating={rating} interactive onRatingChange={setRating} size={24} />
                    </div>
                    <textarea
                        className="review-textarea"
                        placeholder="Share your experience with this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        rows={4}
                    />
                    <div className="form-actions">
                        <button type="submit" className="submit-review-btn" disabled={submitting}>
                            {submitting ? "Saving..." : editingId ? "Update Review" : "Post Review"}
                        </button>
                        {editingId && (
                            <button type="button" className="cancel-edit-btn" onClick={cancelEdit}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}

            <div className="review-list">
                {reviews.length === 0 ? (
                    <div className="no-reviews">No reviews yet. Be the first to share your thoughts!</div>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="review-item glass-morphism">
                            <div className="review-item-header">
                                <div className="user-info">
                                    <div className="avatar-mini">{review.userName[0]}</div>
                                    <span className="user-name">{review.userName}</span>
                                </div>
                                <div className="review-meta">
                                    <StarRating rating={review.rating} size={14} />
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                            <div className="review-actions">
                                {(userRole === "ADMIN" || (token && review.userId === userId)) && (
                                    <button
                                        className="edit-review-btn"
                                        onClick={() => handleEdit(review)}
                                    >
                                        Edit
                                    </button>
                                )}
                                {(userRole === "ADMIN" || (token && review.userId === userId)) && (
                                    <button
                                        className="delete-review-btn"
                                        onClick={() => handleDelete(review._id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
