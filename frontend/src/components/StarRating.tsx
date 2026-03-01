import { Star, StarHalf } from "lucide-react";
import "./StarRating.css";

interface StarRatingProps {
    rating: number;
    max?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export default function StarRating({
    rating,
    max = 5,
    size = 18,
    interactive = false,
    onRatingChange
}: StarRatingProps) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= max; i++) {
        if (i <= fullStars) {
            stars.push(
                <Star
                    key={i}
                    size={size}
                    className={`star-icon filled ${interactive ? 'interactive' : ''}`}
                    onClick={() => interactive && onRatingChange?.(i)}
                />
            );
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars.push(
                <StarHalf
                    key={i}
                    size={size}
                    className={`star-icon half ${interactive ? 'interactive' : ''}`}
                    onClick={() => interactive && onRatingChange?.(i)}
                />
            );
        } else {
            stars.push(
                <Star
                    key={i}
                    size={size}
                    className={`star-icon empty ${interactive ? 'interactive' : ''}`}
                    onClick={() => interactive && onRatingChange?.(i)}
                />
            );
        }
    }

    return <div className="star-rating-container">{stars}</div>;
}
