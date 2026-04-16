import {
  type ReadingMethod,
  type ReadingStatus,
  type UserBookStatus,
} from "../types";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ABANDONED, FINISHED, READING } from "../constants";

import { db } from "../lib/firebase";
import { USER_BOOK_STATUS } from "../constants";
import { refreshArchivedBookStats } from "../lib/adminActions";

interface UseUserStatusResult {
  status: UserBookStatus | null;
  loading: boolean;
  updateStatus: (
    newStatus: ReadingStatus,
    method: ReadingMethod | null,
    date: Date,
  ) => Promise<void>;
}

export function useUserStatus(
  uid: string,
  bookId: string,
): UseUserStatusResult {
  const [status, setStatus] = useState<UserBookStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const docId = `${uid}_${bookId}`;
  const ref = doc(db, USER_BOOK_STATUS, docId);

  useEffect(() => {
    if (!uid || !bookId) return;

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStatus({
          uid: data.uid,
          bookId: data.bookId,
          status: data.status,
          readingMethod: data.readingMethod ?? null,
          readingDate: data.readingDate?.toDate() ?? null,
          finishedDate: data.finishedDate?.toDate() ?? null,
          abandonedDate: data.abandonedDate?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
        });
      } else {
        setStatus(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid, bookId]);

  const updateStatus = async (
    newStatus: ReadingStatus,
    method: ReadingMethod | null,
    date: Date,
  ) => {
    const existing = status;

    // Build the date fields — only update the relevant one for the new status
    const dateFields = {
      readingDate: existing?.readingDate ?? null,
      finishedDate: existing?.finishedDate ?? null,
      abandonedDate: existing?.abandonedDate ?? null,
    };

    if (newStatus === READING) dateFields.readingDate = date;
    if (newStatus === FINISHED) dateFields.finishedDate = date;
    if (newStatus === ABANDONED) dateFields.abandonedDate = date;

    await setDoc(ref, {
      uid,
      bookId,
      status: newStatus,
      readingMethod: method,
      ...dateFields,
      updatedAt: serverTimestamp(),
    });
    await refreshArchivedBookStats(bookId);
  };

  return { status, loading, updateStatus };
}
