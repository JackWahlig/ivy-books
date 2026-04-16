import { ARCHIVE, FINISHED, METHOD_LABEL } from "../constants";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import type { ArchiveEntry } from "../types";
import { Link } from "react-router-dom";
import StarRating from "../components/ui/StarRating";
import { db } from "../lib/firebase";
import { format } from "date-fns";

const STATUS_LABEL: Record<string, string> = {
  reading: "Reading",
  finished: "Finished",
  abandoned: "Abandoned",
};

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, ARCHIVE), orderBy("archivedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const loaded: ArchiveEntry[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          bookId: data.bookId,
          googleBooksId: data.googleBooksId,
          title: data.title,
          authors: data.authors ?? [],
          coverUrl: data.coverUrl ?? "",
          archivedAt: data.archivedAt?.toDate() ?? new Date(),
          archivedBy: data.archivedBy,
          averageRating: data.averageRating ?? null,
          readers: data.readers ?? [],
        };
      });
      setEntries(loaded);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-[#0E3386] text-lg animate-pulse">
          Loading archive...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0E3386]">Archive</h1>
        <p className="text-gray-500 mt-1">Books the club has read.</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-gray-400">No books archived yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const isExpanded = expanded === entry.id;
            const finishedReaders = entry.readers.filter(
              (r) => r.status === FINISHED,
            );
            const otherReaders = entry.readers.filter(
              (r) => r.status !== FINISHED,
            );

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Main row */}
                <div className="flex gap-4 p-5">
                  {/* Cover */}
                  <Link
                    to={`/book/${entry.googleBooksId}`}
                    className="shrink-0 cursor-pointer"
                  >
                    {entry.coverUrl ? (
                      <img
                        src={entry.coverUrl}
                        alt={entry.title}
                        className="w-16 h-24 object-cover rounded-lg shadow hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <Link
                      to={`/book/${entry.googleBooksId}`}
                      className="font-bold text-gray-900 hover:text-[#0E3386] hover:underline transition-colors cursor-pointer"
                    >
                      {entry.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {entry.authors.join(" & ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      Completed {format(entry.archivedAt, "MMMM yyyy")}
                    </p>

                    {/* Average rating */}
                    {entry.averageRating !== null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating
                          value={entry.averageRating}
                          readonly
                          size="sm"
                        />
                        <span className="text-xs text-gray-500">
                          {entry.averageRating} avg
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-1">
                        No reviews yet
                      </p>
                    )}

                    {/* Reader summary + expand toggle */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : entry.id)}
                      className="mt-2 self-start text-xs text-[#0E3386] cursor-pointer flex items-center gap-1"
                    >
                      <span className="hover:underline">
                        {entry.readers.length} reader
                        {entry.readers.length !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`inline-block transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded readers list */}
                {entry.readers.length > 0 && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="border-t border-gray-100 px-5 py-4 bg-[#F5F0E8]/50">
                      <div className="flex flex-col gap-2">
                        {finishedReaders.length > 0 && (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Finished
                            </p>
                            {finishedReaders.map((r) => (
                              <div
                                key={r.uid}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-700 font-medium">
                                  {r.displayName}
                                </span>
                                {r.readingMethod && (
                                  <span className="text-xs text-gray-400">
                                    {METHOD_LABEL[r.readingMethod]}
                                  </span>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                        {otherReaders.length > 0 && (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
                              Other
                            </p>
                            {otherReaders.map((r) => (
                              <div
                                key={r.uid}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-500">
                                  {r.displayName}
                                  <span className="text-xs ml-1 text-gray-400">
                                    ({STATUS_LABEL[r.status]})
                                  </span>
                                </span>
                                {r.readingMethod && (
                                  <span className="text-xs text-gray-400">
                                    {METHOD_LABEL[r.readingMethod]}
                                  </span>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
