import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { BOOKS } from "../constants";
import type { Book } from "../types";
import { db } from "../lib/firebase";
import { fetchBookById } from "../lib/googleBooks";

interface UseBookResult {
  book: Book | null;
  loading: boolean;
  error: string | null;
}

export function useBook(googleBooksId: string): UseBookResult {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!googleBooksId) return;

    // Listen to the books collection for a document with this googleBooksId
    // The document ID and googleBooksId are the same for books added via search
    const ref = doc(db, BOOKS, googleBooksId);

    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setBook({ ...snap.data(), id: snap.id } as Book);
        setLoading(false);
      } else {
        // Book not in Firestore yet — fetch from Google Books and cache it
        try {
          const fetched = await fetchBookById(googleBooksId);
          if (!fetched) {
            setError("Book not found.");
            setLoading(false);
            return;
          }
          // Cache in Firestore so future visits are instant
          await setDoc(ref, {
            ...fetched,
            suggestedBy: null,
            suggestedAt: null,
            isOnPrefList: false,
            isArchived: false,
            cachedAt: serverTimestamp(),
          });
          // The onSnapshot will fire again with the new data
        } catch {
          setError("Failed to load book.");
          setLoading(false);
        }
      }
    });

    return () => unsub();
  }, [googleBooksId]);

  return { book, loading, error };
}
