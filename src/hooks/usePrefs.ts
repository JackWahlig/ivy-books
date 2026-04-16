import { BOOKS, SUGGESTIONS, USERS, USER_PREFS } from "../constants";
import type { Book, ConsensusEntry, Suggestion, UserPrefs } from "../types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { computeConsensus } from "../lib/rankingAlgorithm";
import { db } from "../lib/firebase";

export function useUserPrefs(uid: string) {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, USER_PREFS, uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPrefs({
          uid: data.uid,
          rankedList: data.rankedList ?? [],
          unranked: data.unranked ?? [],
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
        });
      } else {
        setPrefs({ uid, rankedList: [], unranked: [], updatedAt: new Date() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const savePrefs = async (rankedList: string[], unranked: string[]) => {
    await setDoc(doc(db, USER_PREFS, uid), {
      uid,
      rankedList,
      unranked,
      updatedAt: serverTimestamp(),
    });
  };

  return { prefs, loading, savePrefs };
}

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, SUGGESTIONS), where("isActive", "==", true));

    const unsub = onSnapshot(q, async (snap) => {
      const loaded: Suggestion[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          bookId: data.bookId,
          suggestedBy: data.suggestedBy,
          suggestedByName: data.suggestedByName,
          suggestedAt: data.suggestedAt?.toDate() ?? new Date(),
          isActive: data.isActive,
        };
      });
      setSuggestions(loaded);

      // Fetch book data for each suggestion
      if (loaded.length > 0) {
        const bookSnaps = await Promise.all(
          loaded.map((s) => getDoc(doc(db, BOOKS, s.bookId))),
        );
        const booksById: Record<string, Book> = {};
        bookSnaps.forEach((snap) => {
          if (snap.exists()) {
            booksById[snap.id] = { ...snap.data(), id: snap.id } as Book;
          }
        });
        setBooks(booksById);
      } else {
        setBooks({});
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const addSuggestion = async (
    bookId: string,
    uid: string,
    displayName: string,
  ) => {
    // Check if already suggested
    const existing = await getDoc(doc(db, SUGGESTIONS, bookId));
    if (existing.exists()) return;

    // Check if book is archived
    const bookSnap = await getDoc(doc(db, BOOKS, bookId));
    if (bookSnap.exists() && bookSnap.data().isArchived) {
      throw new Error("ARCHIVED");
    }

    const batch = writeBatch(db);

    // Add suggestion
    batch.set(doc(db, SUGGESTIONS, bookId), {
      bookId,
      suggestedBy: uid,
      suggestedByName: displayName,
      suggestedAt: serverTimestamp(),
      isActive: true,
    });

    // Mark book as on pref list
    batch.update(doc(db, BOOKS, bookId), {
      isOnPrefList: true,
      suggestedBy: uid,
      suggestedAt: serverTimestamp(),
    });

    await batch.commit();

    // Add to all users' unranked lists
    const usersSnap = await getDocs(collection(db, USERS));
    await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const prefsRef = doc(db, USER_PREFS, userDoc.id);
        const prefsSnap = await getDoc(prefsRef);
        if (prefsSnap.exists()) {
          const data = prefsSnap.data();
          const unranked: string[] = data.unranked ?? [];
          if (!unranked.includes(bookId)) {
            await updateDoc(prefsRef, { unranked: [...unranked, bookId] });
          }
        } else {
          await setDoc(prefsRef, {
            uid: userDoc.id,
            rankedList: [],
            unranked: [bookId],
            updatedAt: serverTimestamp(),
          });
        }
      }),
    );
  };

  const removeSuggestion = async (bookId: string) => {
    const batch = writeBatch(db);

    // Deactivate suggestion
    batch.delete(doc(db, SUGGESTIONS, bookId));

    // Mark book as off pref list
    batch.update(doc(db, BOOKS, bookId), { isOnPrefList: false });

    await batch.commit();

    // Remove from all users' prefs silently
    const usersSnap = await getDocs(collection(db, USERS));
    await Promise.all(
      usersSnap.docs.map(async (userDoc) => {
        const prefsRef = doc(db, USER_PREFS, userDoc.id);
        const prefsSnap = await getDoc(prefsRef);
        if (prefsSnap.exists()) {
          const data = prefsSnap.data();
          await updateDoc(prefsRef, {
            rankedList: (data.rankedList ?? []).filter(
              (id: string) => id !== bookId,
            ),
            unranked: (data.unranked ?? []).filter(
              (id: string) => id !== bookId,
            ),
          });
        }
      }),
    );
  };

  return { suggestions, books, loading, addSuggestion, removeSuggestion };
}

export function useConsensus(books: Record<string, Book>, bookIds: string[]) {
  const [consensus, setConsensus] = useState<ConsensusEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookIds.length === 0) {
      setConsensus([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, USER_PREFS), (snap) => {
      const allPrefs = snap.docs.map((d) => ({
        uid: d.id,
        rankedList: d.data().rankedList ?? [],
      }));

      const scores = computeConsensus(allPrefs, bookIds);

      const entries: ConsensusEntry[] = scores
        .map(({ bookId, score, controversy, voteCount }) => {
          const book = books[bookId];
          if (!book) return null;
          return { book, score, controversy, voteCount };
        })
        .filter((e): e is ConsensusEntry => e !== null);

      setConsensus(entries);
      setLoading(false);
    });

    return () => unsub();
  }, [bookIds.join(","), books]);

  return { consensus, loading };
}
