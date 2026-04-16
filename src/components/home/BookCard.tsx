import type { Book } from "../../types";
import { Link } from "react-router-dom";

interface BookCardProps {
  book: Book;
  size?: "large" | "small";
}

export default function BookCard({ book, size = "large" }: BookCardProps) {
  const isLarge = size === "large";

  return (
    <Link
      to={`/book/${book.googleBooksId}`}
      className="group flex flex-col items-center gap-3"
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          className={`${isLarge ? "w-36 h-52" : "w-24 h-36"} object-cover rounded-lg shadow-lg group-hover:shadow-xl hover:scale-105 transition-transform duration-200`}
        />
      ) : (
        <div
          className={`${isLarge ? "w-36 h-52" : "w-24 h-36"} bg-[#0E3386]/20 rounded-lg shadow-lg flex items-center justify-center`}
        >
          <span className="text-4xl">📚</span>
        </div>
      )}
      <div className="text-center">
        <p
          className={`font-bold text-gray-900 ${isLarge ? "text-base" : "text-sm"} leading-tight`}
        >
          {book.title}
        </p>
        <p
          className={`text-gray-500 ${isLarge ? "text-sm" : "text-xs"} mt-0.5`}
        >
          {book.authors.join(" & ")}
        </p>
      </div>
    </Link>
  );
}
