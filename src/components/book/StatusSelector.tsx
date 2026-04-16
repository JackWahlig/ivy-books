import {
  type ReadingMethod,
  type ReadingStatus,
  type UserBookStatus,
} from "../../types";
import { useEffect, useState } from "react";
import { READING, ABANDONED, FINISHED, UNREAD } from "../../constants";

const STATUSES: { value: ReadingStatus; label: string; color: string }[] = [
  {
    value: UNREAD,
    label: "Unread",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  {
    value: READING,
    label: "Reading",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: FINISHED,
    label: "Finished",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: ABANDONED,
    label: "Abandoned",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

const METHODS: { value: ReadingMethod; label: string; icon: string }[] = [
  { value: "physical", label: "Physical", icon: "📖" },
  { value: "audio", label: "Audio", icon: "🎧" },
  { value: "ebook", label: "eBook", icon: "📱" },
];

function toDateInputValue(date: Date): string {
  return date.toISOString().substring(0, 10);
}

interface StatusSelectorProps {
  userStatus: UserBookStatus | null;
  onSave: (
    status: ReadingStatus,
    method: ReadingMethod | null,
    date: Date,
  ) => Promise<void>;
}

export default function StatusSelector({
  userStatus,
  onSave,
}: StatusSelectorProps) {
  const currentStatus = userStatus?.status ?? UNREAD;

  const [selected, setSelected] = useState<ReadingStatus>(currentStatus);
  const [method, setMethod] = useState<ReadingMethod | null>(
    userStatus?.readingMethod ?? null,
  );
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Keep local state in sync if Firestore updates externally
  useEffect(() => {
    setSelected(userStatus?.status ?? UNREAD);
    setMethod(userStatus?.readingMethod ?? null);
    setDirty(false);
  }, [userStatus]);

  // When the user picks a new status, pre-fill the date with any existing date
  // for that status or default to today
  function handleStatusChange(newStatus: ReadingStatus) {
    setSelected(newStatus);
    setDirty(true);

    if (newStatus === READING && userStatus?.readingDate) {
      setDate(toDateInputValue(userStatus.readingDate));
    } else if (newStatus === FINISHED && userStatus?.finishedDate) {
      setDate(toDateInputValue(userStatus.finishedDate));
    } else if (newStatus === ABANDONED && userStatus?.abandonedDate) {
      setDate(toDateInputValue(userStatus.abandonedDate));
    } else {
      setDate(toDateInputValue(new Date()));
    }
  }

  async function handleSave() {
    setSaving(true);
    await onSave(selected, method, new Date(date));
    setSaving(false);
    setDirty(false);
  }

  const needsDate = selected !== UNREAD;
  const needsMethod = selected === READING || selected === FINISHED;

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-gray-800">Your Status</h3>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatusChange(s.value)}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-all
              ${
                selected === s.value
                  ? `${s.color} ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Reading method */}
      {needsMethod && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">
            Reading method
          </label>
          <div className="flex gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMethod(m.value);
                  setDirty(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all
                  ${
                    method === m.value
                      ? "bg-[#0E3386] text-white border-[#0E3386]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date picker */}
      {needsDate && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">
            {selected === READING
              ? "Started reading"
              : selected === FINISHED
                ? "Finished on"
                : "Abandoned on"}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDirty(true);
            }}
            className="w-44 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E3386]"
          />
        </div>
      )}

      {/* Save button */}
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving || (needsMethod && !method)}
          className="self-start px-5 py-2 bg-[#0E3386] text-white rounded-lg text-sm font-medium hover:bg-[#0E3386]/90 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
