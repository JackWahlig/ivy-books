import BookCard from "./BookCard";
import type { LineupBookData } from "../../hooks/useLineup";
import type { LineupSlot } from "../../types";
import ReaderBadge from "./ReaderBadge";

const SLOT_CONFIG: Record<LineupSlot, { label: string; accent: string }> = {
  atBat: {
    label: "At Bat",
    accent: "border-[#0E3386] bg-white",
  },
  onDeck: {
    label: "On Deck",
    accent: "border-[#C4A35A] bg-white",
  },
  inTheHole: {
    label: "In the Hole",
    accent: "border-[#CC3433] bg-white",
  },
};

interface BaseballSlotProps {
  slot: LineupSlot;
  data: LineupBookData | null;
}

export default function BaseballSlot({ slot, data }: BaseballSlotProps) {
  const config = SLOT_CONFIG[slot];

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 ${config.accent} shadow-md p-6 gap-5 flex-1 min-w-0`}
    >
      {/* Slot header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          {config.label}
        </h2>
      </div>

      {/* Book or empty state */}
      {data ? (
        <div className="flex flex-col items-center gap-4">
          <BookCard book={data.book} size="large" />

          {/* Readers */}
          <div className="w-full">
            {data.readers.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {data.readers.map((reader) => (
                  <ReaderBadge key={reader.uid} reader={reader} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 italic">
                No readers yet
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
          <span className="text-5xl opacity-20">📚</span>
          <p className="text-sm text-gray-400 italic">No book selected</p>
        </div>
      )}
    </div>
  );
}
