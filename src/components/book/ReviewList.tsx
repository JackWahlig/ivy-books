import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { REVIEWS } from "../../constants";
import type { Review } from "../../types";
import StarRating from "../ui/StarRating";
import { db } from "../../lib/firebase";

interface ReviewListProps {
  bookId: string;
  currentUid: string;
}

export default function ReviewList({ bookId, currentUid }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, REVIEWS), where("bookId", "==", bookId));
    const unsub = onSnapshot(q, (snap) => {
      const loaded: Review[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            uid: data.uid,
            bookId: data.bookId,
            stars: data.stars,
            body: data.body,
            displayName: data.displayName,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
          };
        })
        // Filter out the current user's review — they see it in ReviewForm
        .filter((r) => r.uid !== currentUid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReviews(loaded);
      setLoading(false);
    });
    return () => unsub();
  }, [bookId, currentUid]);

  if (loading) return null;

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No other reviews yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800">Other Reviews</h3>
      {reviews.map((review) => (
        <div
          key={review.uid}
          className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800 text-sm">
              {review.displayName}
            </span>
            <StarRating value={review.stars} readonly size="sm" />
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {review.body}
          </p>
          <p className="text-xs text-gray-400">
            {review.updatedAt > review.createdAt
              ? `Updated ${review.updatedAt.toLocaleDateString()}`
              : review.createdAt.toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
