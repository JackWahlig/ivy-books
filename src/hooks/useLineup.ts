import {
  type AppUser,
  type Book,
  type Lineup,
  type ReaderInfo,
  type UserBookStatus,
} from "../types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../lib/firebase";
import { BOOKS, LINEUP, UNREAD, USER_BOOK_STATUS, USERS } from "../constants";

export interface LineupBookData {
  book: Book;
  readers: ReaderInfo[];
}

export interface LineupData {
  atBat: LineupBookData | null;
  onDeck: LineupBookData | null;
  inTheHole: LineupBookData | null;
  loading: boolean;
}

export function useLineup(): LineupData {
  const [data, setData] = useState<LineupData>({
    atBat: null,
    onDeck: null,
    inTheHole: null,
    loading: true,
  });

  useEffect(() => {
    const lineupUnsub = onSnapshot(
      doc(db, LINEUP, "current"),
      async (lineupSnap) => {
        if (!lineupSnap.exists()) {
          setData({
            atBat: null,
            onDeck: null,
            inTheHole: null,
            loading: false,
          });
          return;
        }

        const lineup = lineupSnap.data() as Lineup;
        const slots = [lineup.atBat, lineup.onDeck, lineup.inTheHole];
        const bookIds = slots.filter(Boolean).map((s) => s!.bookId);

        if (bookIds.length === 0) {
          setData({
            atBat: null,
            onDeck: null,
            inTheHole: null,
            loading: false,
          });
          return;
        }

        // Fetch books
        const bookSnaps = await Promise.all(
          bookIds.map((id) => getDoc(doc(db, BOOKS, id))),
        );
        const booksById: Record<string, Book> = {};
        bookSnaps.forEach((snap) => {
          if (snap.exists()) {
            booksById[snap.id] = { ...snap.data(), id: snap.id } as Book;
          }
        });

        // Fetch statuses for all lineup books
        const statusSnaps = await Promise.all(
          bookIds.map((id) =>
            getDocs(
              query(
                collection(db, USER_BOOK_STATUS),
                where("bookId", "==", id),
              ),
            ),
          ),
        );

        // Fetch all users for display names
        const usersSnap = await getDocs(collection(db, USERS));
        const usersById: Record<string, AppUser> = {};
        usersSnap.forEach((snap) => {
          usersById[snap.id] = snap.data() as AppUser;
        });

        // Build readers list per book
        const readersByBookId: Record<string, ReaderInfo[]> = {};
        statusSnaps.forEach((snap) => {
          snap.forEach((statusDoc) => {
            const status = statusDoc.data() as UserBookStatus;
            if (status.status === UNREAD) return;
            const user = usersById[status.uid];
            if (!user) return;
            if (!readersByBookId[status.bookId])
              readersByBookId[status.bookId] = [];
            readersByBookId[status.bookId].push({
              uid: status.uid,
              displayName: user.customDisplayName ?? user.displayName,
              status: status.status,
              readingMethod: status.readingMethod,
            });
          });
        });

        function buildSlot(entry: typeof lineup.atBat): LineupBookData | null {
          if (!entry) return null;
          const book = booksById[entry.bookId];
          if (!book) return null;
          return {
            book,
            readers: readersByBookId[entry.bookId] ?? [],
          };
        }

        setData({
          atBat: buildSlot(lineup.atBat),
          onDeck: buildSlot(lineup.onDeck),
          inTheHole: buildSlot(lineup.inTheHole),
          loading: false,
        });
      },
    );

    return () => lineupUnsub();
  }, []);

  return data;
}
