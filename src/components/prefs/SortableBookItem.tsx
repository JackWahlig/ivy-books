import type { Book, Suggestion } from "../../types";
import { GripVertical, X } from "lucide-react";

import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import SafeHtml from "../ui/SafeHtml";
import { useSortable } from "@dnd-kit/sortable";

interface SortableBookItemProps {
  book: Book;
  suggestion: Suggestion;
  canRemove: boolean;
  onRemove: (bookId: string) => void;
  rank?: number;
}

export default function SortableBookItem({
  book,
  suggestion,
  canRemove,
  onRemove,
  rank,
}: SortableBookItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-xl border p-3 shadow-sm transition-shadow
        ${isDragging ? "shadow-xl border-[#0E3386] opacity-75 z-50" : "border-gray-200"}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Rank number */}
      {rank !== undefined && (
        <span className="text-sm font-bold text-gray-400 w-5 text-center shrink-0">
          {rank}
        </span>
      )}

      {/* Cover */}
      <Link
        to={`/book/${book.googleBooksId}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-10 h-14 object-cover rounded hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
            <span className="text-lg">📚</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <Link
          to={`/book/${book.googleBooksId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-gray-900 text-sm truncate hover:text-[#0E3386] hover:underline transition-colors"
        >
          {book.title}
        </Link>
        <p className="text-xs text-gray-500 truncate">
          {book.authors.join(" & ")}
        </p>
        <div className="flex gap-3 mt-1">
          {book.pageCount > 0 && (
            <span className="text-xs text-gray-400">
              {book.pageCount} pages
            </span>
          )}
          <span className="text-xs text-gray-400">
            Suggested by {suggestion.suggestedByName}
          </span>
        </div>
        {book.description && (
          <SafeHtml
            html={book.description}
            className="text-xs text-gray-400 mt-1 line-clamp-2"
          />
        )}
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={() => onRemove(book.id)}
          className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
          title="Remove from pref list"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
