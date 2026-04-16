import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { REVIEWS } from "../../constants";
import type { Review } from "../../types";
import StarRating from "../ui/StarRating";
import { db } from "../../lib/firebase";
import { refreshArchivedBookStats } from "../../lib/adminActions";
import toast from "react-hot-toast";

interface ReviewFormProps {
  uid: string;
  bookId: string;
  displayName: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({
  uid,
  bookId,
  displayName,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [stars, setStars] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const docId = `${uid}_${bookId}`;

  useEffect(() => {
    async function loadExisting() {
      const snap = await getDoc(doc(db, REVIEWS, docId));
      if (snap.exists()) {
        const data = snap.data();
        const review: Review = {
          uid: data.uid,
          bookId: data.bookId,
          stars: data.stars,
          body: data.body,
          displayName: data.displayName,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
        };
        setExistingReview(review);
        setStars(review.stars);
        setBody(review.body);
      }
    }
    loadExisting();
  }, [docId]);

  async function handleSubmit() {
    if (stars < 0.5) {
      toast.error("Please give it a star rating.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please write a review. Don't be shy.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, REVIEWS, docId), {
        uid,
        bookId,
        stars,
        body: body.trim(),
        displayName,
        createdAt: existingReview
          ? existingReview.createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(existingReview ? "Review updated!" : "Review submitted!");
      await refreshArchivedBookStats(bookId);
      const snap = await getDoc(doc(db, REVIEWS, docId));
      if (snap.exists()) {
        const data = snap.data();
        setExistingReview({
          uid: data.uid,
          bookId: data.bookId,
          stars: data.stars,
          body: data.body,
          displayName: data.displayName,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
        });
      }
      setIsEditing(false);
      onReviewSubmitted();
    } catch {
      toast.error("Failed to save review. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Showing existing review (not editing)
  if (existingReview && !isEditing) {
    return (
      <div className="flex flex-col gap-3 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Your Review</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#0E3386] hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <StarRating value={existingReview.stars} readonly size="md" />
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {existingReview.body}
        </p>
        <p className="text-xs text-gray-400">
          {existingReview.updatedAt > existingReview.createdAt
            ? `Updated ${existingReview.updatedAt.toLocaleDateString()}`
            : `Submitted ${existingReview.createdAt.toLocaleDateString()}`}
        </p>
      </div>
    );
  }

  // Review form (new or editing)
  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-800">
        {existingReview ? "Edit Your Review" : "Write a Review"}
      </h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 font-medium">Rating</label>
        <StarRating value={stars} onChange={setStars} size="lg" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 font-medium">Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          placeholder="What did you think?"
          rows={5}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#0E3386]"
        />
        <p className="text-xs text-gray-400 text-right">{body.length} / 1000</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2 bg-[#0E3386] text-white rounded-lg text-sm font-medium hover:bg-[#0E3386]/90 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving
            ? "Saving..."
            : existingReview
              ? "Update Review"
              : "Submit Review"}
        </button>
        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setStars(existingReview!.stars);
              setBody(existingReview!.body);
            }}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
