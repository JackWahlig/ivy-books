import {
  ARCHIVE,
  BOOKS,
  LINEUP,
  REVIEWS,
  SUGGESTIONS,
  USERS,
  USER_BOOK_STATUS,
  USER_PREFS,
} from "../constants";
import type {
  ArchiveEntry,
  Book,
  Lineup,
  LineupEntry,
  LineupSlot,
} from "../types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getLineup(): Promise<Lineup> {
  const snap = await getDoc(doc(db, LINEUP, "current"));
  if (!snap.exists()) {
    return { atBat: null, onDeck: null, inTheHole: null };
  }
  return snap.data() as Lineup;
}

async function getAverageRating(bookId: string): Promise<number | null> {
  const snap = await getDocs(
    query(collection(db, REVIEWS), where("bookId", "==", bookId)),
  );
  if (snap.empty) return null;
  const stars = snap.docs.map((d) => d.data().stars as number);
  const avg = stars.reduce((sum, s) => sum + s, 0) / stars.length;
  return Math.round(avg * 10) / 10;
}

async function getReadersForBook(bookId: string) {
  const statusSnap = await getDocs(
    query(collection(db, USER_BOOK_STATUS), where("bookId", "==", bookId)),
  );
  const usersSnap = await getDocs(collection(db, USERS));
  const usersById: Record<
    string,
    { displayName: string; customDisplayName: string | null }
  > = {};
  usersSnap.forEach((d) => {
    const data = d.data();
    usersById[d.id] = {
      displayName: data.displayName,
      customDisplayName: data.customDisplayName ?? null,
    };
  });

  return statusSnap.docs
    .map((d) => {
      const data = d.data();
      if (data.status === "unread") return null;
      const user = usersById[data.uid];
      if (!user) return null;
      return {
        uid: data.uid,
        displayName: user.customDisplayName ?? user.displayName,
        status: data.status,
        readingMethod: data.readingMethod ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

async function removeFromAllUserPrefs(bookId: string): Promise<void> {
  const suggestionSnap = await getDoc(doc(db, SUGGESTIONS, bookId));
  if (suggestionSnap.exists()) {
    const batch = writeBatch(db);
    batch.delete(doc(db, SUGGESTIONS, bookId));
    batch.update(doc(db, BOOKS, bookId), { isOnPrefList: false });
    await batch.commit();

    // Remove from all user prefs
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
  }
}

// ─── Archive ─────────────────────────────────────────────────────────────────

export async function archiveBook(
  bookId: string,
  archivedBy: string,
): Promise<void> {
  const bookSnap = await getDoc(doc(db, BOOKS, bookId));
  if (!bookSnap.exists()) return;

  const book = { ...bookSnap.data(), id: bookSnap.id } as Book;
  if (book.isArchived) return;
  const [averageRating, readers] = await Promise.all([
    getAverageRating(bookId),
    getReadersForBook(bookId),
  ]);

  const entry: Omit<ArchiveEntry, "id"> = {
    bookId,
    googleBooksId: book.googleBooksId,
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    archivedAt: new Date(),
    archivedBy,
    averageRating,
    readers,
  };

  const batch = writeBatch(db);
  batch.set(doc(collection(db, ARCHIVE)), {
    ...entry,
    archivedAt: serverTimestamp(),
  });
  batch.update(doc(db, BOOKS, bookId), {
    isArchived: true,
    isOnPrefList: false,
  });
  await batch.commit();

  // Remove from pref list and all user prefs if it was suggested
  await removeFromAllUserPrefs(bookId);
}

// ─── Lineup management ───────────────────────────────────────────────────────

export async function removeFromLineup(
  slot: LineupSlot,
  shouldArchive: boolean,
  adminUid: string,
): Promise<void> {
  const lineup = await getLineup();
  const entry = lineup[slot];

  if (entry && shouldArchive) {
    await archiveBook(entry.bookId, adminUid);
  }

  await setDoc(doc(db, LINEUP, "current"), { [slot]: null }, { merge: true });
}

export async function advanceLineup(
  shouldArchive: boolean,
  adminUid: string,
): Promise<void> {
  const lineup = await getLineup();

  if (lineup.atBat && shouldArchive) {
    await archiveBook(lineup.atBat.bookId, adminUid);
  }

  await setDoc(
    doc(db, LINEUP, "current"),
    {
      atBat: lineup.onDeck ?? null,
      onDeck: lineup.inTheHole ?? null,
      inTheHole: null,
    },
    { merge: true },
  );
}

export async function setLineupSlot(
  slot: LineupSlot,
  book: Book,
  adminUid: string,
): Promise<void> {
  // If replacing an existing book, check if it needs archiving
  // (caller handles the archive prompt before calling this)
  const entry: LineupEntry = {
    bookId: book.id,
    googleBooksId: book.googleBooksId,
    addedAt: new Date(),
    addedBy: adminUid,
  };

  // Remove from pref list if it was on there
  await removeFromAllUserPrefs(book.id);

  await setDoc(
    doc(db, LINEUP, "current"),
    {
      [slot]: {
        ...entry,
        addedAt: serverTimestamp(),
      },
    },
    { merge: true },
  );
}

export async function refreshArchivedBookStats(bookId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, ARCHIVE), where("bookId", "==", bookId)),
  );
  if (snap.empty) return;

  const [averageRating, readers] = await Promise.all([
    getAverageRating(bookId),
    getReadersForBook(bookId),
  ]);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { averageRating, readers });
  });
  await batch.commit();
}

export async function initializeLineupIfMissing(): Promise<void> {
  const snap = await getDoc(doc(db, LINEUP, "current"));
  if (!snap.exists()) {
    await setDoc(doc(db, LINEUP, "current"), {
      atBat: null,
      onDeck: null,
      inTheHole: null,
    });
  }
}
