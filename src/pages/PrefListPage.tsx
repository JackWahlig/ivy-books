import ConsensusList from "../components/prefs/ConsensusList";
import PrefList from "../components/prefs/PrefList";
import type { Suggestion } from "../types";
import toast from "react-hot-toast";
import { useState } from "react";
import { useSuggestions } from "../hooks/usePrefs";

type Tab = "mine" | "consensus";

export default function PrefListPage() {
  const { suggestions, books, loading, removeSuggestion } = useSuggestions();
  const [activeTab, setActiveTab] = useState<Tab>("mine");

  const bookIds = suggestions.map((s) => s.bookId);

  const suggestionsByBookId = suggestions.reduce<Record<string, Suggestion>>(
    (acc, s) => {
      acc[s.bookId] = s;
      return acc;
    },
    {},
  );

  async function handleRemove(bookId: string) {
    const confirmed = window.confirm(
      "Remove this book from the pref list? It will be removed from everyone's rankings.",
    );
    if (!confirmed) return;
    try {
      await removeSuggestion(bookId);
      toast.success("Book removed from pref list.");
    } catch {
      toast.error("Failed to remove book.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0E3386]">Pref List</h1>
        <p className="text-gray-500 mt-1">
          Rank the books you'd like the club to read next.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(
          [
            { id: "mine", label: "🗳️ My Rankings" },
            { id: "consensus", label: "🏆 Club Consensus" },
          ] as { id: Tab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 cursor-pointer transition-colors -mb-px
              ${
                activeTab === tab.id
                  ? "border-[#0E3386] text-[#0E3386]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">
          Loading pref list...
        </div>
      ) : (
        <>
          {activeTab === "mine" && (
            <PrefList
              books={books}
              suggestions={suggestionsByBookId}
              onRemove={handleRemove}
            />
          )}
          {activeTab === "consensus" && (
            <ConsensusList
              books={books}
              suggestions={suggestionsByBookId}
              bookIds={bookIds}
            />
          )}
        </>
      )}
    </div>
  );
}
