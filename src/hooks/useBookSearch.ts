import { useEffect, useRef, useState } from "react";

import type { Book } from "../types";
import { searchBooks } from "../lib/googleBooks";

interface UseBookSearchResult {
  results: Book[];
  loading: boolean;
  error: string | null;
}

export function useBookSearch(
  query: string,
  debounceMs = 100,
): UseBookSearchResult {
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useRef lets us hold a value across renders without triggering a re-render
  // We use it here to track the timeout so we can cancel it if the query changes
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cancel any pending search from the previous keystroke
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const books = await searchBooks(query);
        setResults(books);
        setError(null);
      } catch (err) {
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // Cleanup: cancel the timeout if the component unmounts or query changes again
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs]);

  return { results, loading, error };
}
