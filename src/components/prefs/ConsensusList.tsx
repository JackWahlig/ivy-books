import type { Book, Suggestion } from "../../types";

import { Link } from "react-router-dom";
import { useConsensus } from "../../hooks/usePrefs";

interface ConsensusListProps {
  books: Record<string, Book>;
  suggestions: Record<string, Suggestion>;
  bookIds: string[];
}

function ScoreBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${color}`}
    >
      <span className="text-xs font-medium opacity-70">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

export default function ConsensusList({
  books,
  suggestions,
  bookIds,
}: ConsensusListProps) {
  const { consensus, loading } = useConsensus(books, bookIds);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 animate-pulse">
        Computing consensus...
      </div>
    );
  }

  if (consensus.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🗳️</p>
        <p className="text-gray-400">No books on the pref list yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Rankings are computed from all members' personal preference lists. Score
        reflects overall popularity; controversy reflects how divided votes
        were.
      </p>

      {consensus.map((entry, index) => {
        const suggestion = suggestions[entry.book.id];
        const notEnoughVotes = entry.voteCount < 2;

        return (
          <div
            key={entry.book.id}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            {/* Rank */}
            <span className="text-2xl font-black text-gray-200 w-8 text-center shrink-0">
              {index + 1}
            </span>

            {/* Cover */}
            <Link
              to={`/book/${entry.book.googleBooksId}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              {entry.book.coverUrl ? (
                <img
                  src={entry.book.coverUrl}
                  alt={entry.book.title}
                  className="w-10 h-14 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center shrink-0">
                  <span className="text-lg">📚</span>
                </div>
              )}
            </Link>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <Link
                to={`/book/${entry.book.googleBooksId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-gray-900 text-sm truncate hover:text-[#0E3386] hover:underline transition-colors"
              >
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {entry.book.title}
                </p>
              </Link>
              <p className="text-xs text-gray-500 truncate">
                {entry.book.authors.join(" & ")}
              </p>
              {entry.book.pageCount > 0 && (
                <p className="text-xs text-gray-400">
                  {entry.book.pageCount} pages
                </p>
              )}
              {suggestion && (
                <p className="text-xs text-gray-400">
                  Suggested by {suggestion.suggestedByName}
                </p>
              )}
            </div>

            {/* Scores */}
            <div className="flex gap-2 shrink-0">
              {notEnoughVotes ? (
                <span className="text-xs text-gray-400 italic self-center">
                  Not enough votes
                </span>
              ) : (
                <>
                  <ScoreBadge
                    label="Score"
                    value={`${entry.score}`}
                    color="bg-[#0E3386]/10 text-[#0E3386]"
                  />
                  <ScoreBadge
                    label="Controversy"
                    value={`${entry.controversy}`}
                    color={
                      entry.controversy > 2
                        ? "bg-[#CC3433]/10 text-[#CC3433]"
                        : "bg-gray-100 text-gray-500"
                    }
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
