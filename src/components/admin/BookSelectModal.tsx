import type { Book, Suggestion } from "../../types";
import { Loader2, Search } from "lucide-react";

import Modal from "../ui/Modal";
import { useBookSearch } from "../../hooks/useBookSearch";
import { useConsensus } from "../../hooks/usePrefs";
import { useState } from "react";

interface BookSelectModalProps {
  onSelect: (book: Book) => void;
  onClose: () => void;
  prefBooks: Record<string, Book>;
  suggestions: Record<string, Suggestion>;
  prefBookIds: string[];
}

type TabType = "prefs" | "search";

export default function BookSelectModal({
  onSelect,
  onClose,
  prefBooks,
  suggestions,
  prefBookIds,
}: BookSelectModalProps) {
  const [tab, setTab] = useState<TabType>("prefs");
  const [searchQuery, setSearchQuery] = useState("");
  const { results: searchResults, loading: searchLoading } =
    useBookSearch(searchQuery);
  const { consensus } = useConsensus(prefBooks, prefBookIds);

  return (
    <Modal title="Select a Book" onClose={onClose} size="lg">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 -mx-6 px-6 mb-4">
        {(
          [
            { id: "prefs", label: "⭐ From Pref List" },
            { id: "search", label: "🔍 Search All Books" },
          ] as { id: TabType; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer
              ${
                tab === t.id
                  ? "border-[#0E3386] text-[#0E3386]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pref list tab */}
      {tab === "prefs" && (
        <div className="flex flex-col gap-2">
          {consensus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No books on the pref list yet.
            </p>
          ) : (
            consensus.map((entry, index) => (
              <button
                key={entry.book.id}
                onClick={() => onSelect(entry.book)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#F5F0E8] transition-colors text-left cursor-pointer border border-transparent hover:border-gray-200"
              >
                <span className="text-lg font-black text-gray-200 w-6 text-center shrink-0">
                  {index + 1}
                </span>
                {entry.book.coverUrl ? (
                  <img
                    src={entry.book.coverUrl}
                    alt={entry.book.title}
                    className="w-9 h-12 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-9 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0">
                    <span>📚</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {entry.book.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {entry.book.authors.join(" & ")}
                  </p>
                  {entry.voteCount >= 2 && (
                    <p className="text-xs text-[#0E3386] mt-0.5">
                      Score: {entry.score}
                    </p>
                  )}
                </div>
                {suggestions[entry.book.id] && (
                  <span className="text-xs text-gray-400 shrink-0">
                    by {suggestions[entry.book.id].suggestedByName}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === "search" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            {searchLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            {searchResults.length === 0 && searchQuery && !searchLoading && (
              <p className="text-sm text-gray-400 text-center py-6">
                No results found.
              </p>
            )}
            {searchResults.map((book) => (
              <button
                key={book.googleBooksId}
                onClick={() => onSelect(book)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#F5F0E8] transition-colors text-left cursor-pointer border border-transparent hover:border-gray-200"
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-9 h-12 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-9 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0">
                    <span>📚</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {book.authors.join(" & ")}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    {book.publishedDate && (
                      <span className="text-xs text-gray-400">
                        {book.publishedDate.substring(0, 4)}
                      </span>
                    )}
                    {book.pageCount > 0 && (
                      <span className="text-xs text-gray-400">
                        {book.pageCount} pages
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
