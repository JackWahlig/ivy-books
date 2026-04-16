import { Link } from "react-router-dom";
import SafeHtml from "../components/ui/SafeHtml";
import { useBookSearch } from "../hooks/useBookSearch";
import { useSearchParams } from "react-router-dom";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { results, loading, error } = useBookSearch(query);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0E3386]">Search Results</h1>
        {query && (
          <p className="text-gray-500 mt-1">
            Showing results for{" "}
            <span className="font-medium text-gray-700">"{query}"</span>
          </p>
        )}
      </div>

      {/* States */}
      {!query && (
        <div className="text-center py-24">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">
            Type something in the search bar to find books.
          </p>
        </div>
      )}

      {query && loading && (
        <div className="flex items-center justify-center py-24">
          <span className="text-[#0E3386] animate-pulse">Searching...</span>
        </div>
      )}

      {query && error && (
        <div className="text-center py-24">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="text-center py-24">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No results found for "{query}".</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different title or author name.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((book) => (
            <Link
              key={book.googleBooksId}
              to={`/book/${book.googleBooksId}`}
              className="flex gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-[#0E3386]/30 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Cover */}
              <div className="shrink-0">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-16 h-24 object-cover rounded-lg shadow"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0 gap-1 flex-1">
                <p className="font-bold text-gray-900 leading-tight">
                  {book.title}
                </p>
                <p className="text-sm text-gray-500">
                  {book.authors.join(" & ")}
                </p>

                <div className="flex gap-3 text-xs text-gray-400">
                  {book.publishedDate && (
                    <span>📅 {book.publishedDate.substring(0, 4)}</span>
                  )}
                  {book.pageCount > 0 && <span>📄 {book.pageCount} pages</span>}
                </div>

                {book.description && (
                  <SafeHtml
                    html={book.description}
                    className="text-sm text-gray-600 line-clamp-2 mt-1"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
