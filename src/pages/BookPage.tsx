import { type ReadingMethod, type ReadingStatus } from "../types";

import toast from "react-hot-toast";
import ReviewForm from "../components/book/ReviewForm";
import ReviewList from "../components/book/ReviewList";
import StatusSelector from "../components/book/StatusSelector";
import { useAuth } from "../context/AuthContext";
import { useBook } from "../hooks/useBook";
import { useSuggestions } from "../hooks/usePrefs";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUserStatus } from "../hooks/useUserStatus";
import SafeHtml from "../components/ui/SafeHtml";
import { FINISHED } from "../constants";

export default function BookPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const { currentUser } = useAuth();
  const { book, loading, error } = useBook(bookId ?? "");
  const { status, updateStatus } = useUserStatus(
    currentUser!.uid,
    bookId ?? "",
  );
  const { suggestions, addSuggestion } = useSuggestions();
  const [hasReviewed, setHasReviewed] = useState(false);

  const displayName =
    currentUser!.customDisplayName ?? currentUser!.displayName;

  const isSuggested = book
    ? suggestions.some((s) => s.bookId === book.id)
    : false;
  const isArchived = book?.isArchived ?? false;

  async function handleSuggest() {
    if (!book) return;
    const displayName =
      currentUser!.customDisplayName ?? currentUser!.displayName;
    try {
      await addSuggestion(book.id, currentUser!.uid, displayName);
      toast.success("Book added to the pref list!");
      navigate("/prefs");
    } catch (err) {
      if (err instanceof Error && err.message === "ARCHIVED") {
        toast.error(
          "This book has been archived and cannot be suggested again.",
        );
      } else {
        toast.error("Failed to suggest book.");
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-[#0E3386] text-lg animate-pulse">
          Loading book...
        </span>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-red-500">{error ?? "Book not found."}</span>
      </div>
    );
  }

  const isFinished = status?.status === FINISHED;
  const showReviews = isFinished && hasReviewed;

  async function handleStatusUpdate(
    newStatus: ReadingStatus,
    method: ReadingMethod | null,
    date: Date,
  ) {
    await updateStatus(newStatus, method, date);
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Book header */}
      <div className="flex gap-8 items-start">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-40 h-60 object-cover rounded-xl shadow-lg shrink-0"
          />
        ) : (
          <div className="w-40 h-60 bg-[#0E3386]/10 rounded-xl shadow-lg flex items-center justify-center shrink-0">
            <span className="text-5xl">📚</span>
          </div>
        )}

        <div className="flex flex-col gap-3 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {book.title}
          </h1>
          <p className="text-lg text-gray-600">{book.authors.join(" & ")}</p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {book.publishedDate && (
              <span>📅 {book.publishedDate.substring(0, 4)}</span>
            )}
            {book.pageCount > 0 && <span>📄 {book.pageCount} pages</span>}
          </div>

          {/* Suggest button */}
          <div className="mt-2">
            {isArchived ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
                📦 This book has been archived
              </div>
            ) : isSuggested ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                ✓ On the Pref List
              </div>
            ) : (
              <button
                onClick={handleSuggest}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C4A35A] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[#C4A35A]/90 transition-colors"
              >
                ⭐ Suggest for Club
              </button>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <SafeHtml
              html={book.description}
              className="text-sm text-gray-700 leading-relaxed line-clamp-4 prose prose-sm max-w-none"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200" />

      {/* Status selector */}
      <StatusSelector userStatus={status} onSave={handleStatusUpdate} />

      {/* Reviews section */}
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-800">Reviews</h2>

        {!isFinished ? (
          <div className="p-5 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-400 italic">
              Mark this book as finished to leave a review.
            </p>
          </div>
        ) : (
          <>
            <ReviewForm
              uid={currentUser!.uid}
              bookId={book.id}
              displayName={displayName}
              onReviewSubmitted={() => setHasReviewed(true)}
            />
            {showReviews && (
              <ReviewList bookId={book.id} currentUid={currentUser!.uid} />
            )}
            {isFinished && !hasReviewed && (
              <p className="text-sm text-gray-400 italic text-center">
                Submit your review to see what others thought.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
