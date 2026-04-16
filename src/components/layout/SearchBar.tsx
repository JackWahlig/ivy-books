import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Book } from "../../types";
import { useBookSearch } from "../../hooks/useBookSearch";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading } = useBookSearch(query);

  // Close the dropdown if the user clicks outside the search bar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown whenever there are results
  useEffect(() => {
    setOpen(query.trim().length > 0);
  }, [query, results]);

  function handleSelect(book: Book) {
    setQuery("");
    setOpen(false);
    navigate(`/book/${book.googleBooksId}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center bg-white/10 border border-white/20 rounded-lg px-3 py-2 gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 text-white/60 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-white/60 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search books or authors..."
          className="bg-transparent text-white placeholder-white/50 text-sm outline-none w-full"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200">
          {results.length === 0 && !loading && query.trim() && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results found
            </div>
          )}
          {results.map((book) => (
            <button
              key={book.googleBooksId}
              onClick={() => handleSelect(book)}
              className="flex items-center gap-3 w-full px-3 py-2 cursor-pointer hover:bg-[#F5F0E8] transition-colors text-left"
            >
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-8 h-12 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-8 h-12 bg-gray-200 rounded shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {book.authors.join(" & ")}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {book.publishedDate && (
                    <span className="text-xs text-gray-400">
                      {book.publishedDate.substring(0, 4)}
                    </span>
                  )}
                  {book.pageCount > 0 && (
                    <>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {book.pageCount} pages
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
          {query.trim() && results.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="w-full px-4 py-2 text-sm text-[#0E3386] font-medium hover:bg-[#F5F0E8] border-t border-gray-100 text-center"
            >
              See all results for "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
