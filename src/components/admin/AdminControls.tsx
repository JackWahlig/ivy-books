import { AT_BAT, BOOKS, IN_THE_HOLE, ON_DECK } from "../../constants";
import type { Book, LineupSlot } from "../../types";
import { ChevronsRight, Cog, Pencil, Trash2 } from "lucide-react";
import {
  advanceLineup,
  removeFromLineup,
  setLineupSlot,
} from "../../lib/adminActions";

import BookSelectModal from "./BookSelectModal";
import type { LineupBookData } from "../../hooks/useLineup";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { useSuggestions } from "../../hooks/usePrefs";

interface ArchivePromptModalProps {
  action: "remove" | "advance";
  bookTitle: string;
  onConfirm: (shouldArchive: boolean) => void;
  onClose: () => void;
}

function ArchivePromptModal({
  action,
  bookTitle,
  onConfirm,
  onClose,
}: ArchivePromptModalProps) {
  return (
    <Modal
      title={action === "advance" ? "Advance Lineup" : "Remove Book"}
      onClose={onClose}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-700">
          {action === "advance"
            ? `Advancing the lineup will remove "${bookTitle}" from At-Bat.`
            : `Are you sure you want to remove "${bookTitle}" from the lineup?`}
        </p>
        <p className="text-sm font-medium text-gray-800">
          Would you like to mark it as complete and add it to the archive?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="w-full px-4 py-2.5 bg-[#0E3386] text-white rounded-lg text-sm font-medium hover:bg-[#0E3386]/90 transition-colors cursor-pointer"
          >
            ✓ Yes, archive it
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
          >
            No, just {action === "advance" ? "advance" : "remove"} it
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface AdminControlsProps {
  atBat: LineupBookData | null;
  onDeck: LineupBookData | null;
  inTheHole: LineupBookData | null;
}

export default function AdminControls({
  atBat,
  onDeck,
  inTheHole,
}: AdminControlsProps) {
  const { currentUser } = useAuth();
  const { suggestions, books: prefBooks } = useSuggestions();

  const [archivePrompt, setArchivePrompt] = useState<{
    action: "remove" | "advance";
    slot?: LineupSlot;
  } | null>(null);

  const [selectModal, setSelectModal] = useState<LineupSlot | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestionsByBookId = suggestions.reduce<
    Record<string, import("../../types").Suggestion>
  >((acc, s) => {
    acc[s.bookId] = s;
    return acc;
  }, {});
  const prefBookIds = suggestions.map((s) => s.bookId);

  const slotData = { atBat, onDeck, inTheHole };
  const slotLabels: Record<LineupSlot, string> = {
    atBat: "At-Bat",
    onDeck: "On-Deck",
    inTheHole: "In-The-Hole",
  };

  async function handleAdvance(shouldArchive: boolean) {
    setBusy(true);
    setArchivePrompt(null);
    try {
      await advanceLineup(shouldArchive, currentUser!.uid);
      toast.success("Lineup advanced.");
    } catch {
      toast.error("Failed to advance lineup.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(slot: LineupSlot, shouldArchive: boolean) {
    setBusy(true);
    setArchivePrompt(null);
    try {
      await removeFromLineup(slot, shouldArchive, currentUser!.uid);
      toast.success(`${slotLabels[slot]} book removed.`);
    } catch {
      toast.error("Failed to remove book.");
    } finally {
      setBusy(false);
    }
  }

  async function handleBookSelected(slot: LineupSlot, book: Book) {
    setBusy(true);
    setSelectModal(null);
    try {
      // Cache the book in Firestore first if it came from a search result
      const { doc, getDoc, setDoc, serverTimestamp } =
        await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");
      const snap = await getDoc(doc(db, BOOKS, book.googleBooksId));
      if (!snap.exists()) {
        await setDoc(doc(db, BOOKS, book.googleBooksId), {
          ...book,
          id: book.googleBooksId,
          cachedAt: serverTimestamp(),
        });
      }
      await setLineupSlot(
        slot,
        { ...book, id: book.googleBooksId },
        currentUser!.uid,
      );
      toast.success(`${slotLabels[slot]} updated.`);
    } catch (error) {
      console.log("Error setting lineup slot:", error);
      toast.error("Failed to update lineup slot.");
    } finally {
      setBusy(false);
    }
  }

  const atBatTitle = atBat?.book.title ?? "the current book";

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cog className="w-5 h-5" />
          <h2 className="font-bold text-gray-800">Admin Controls</h2>
        </div>

        {/* Advance lineup */}
        <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Shifts all books up one slot. At-Bat is removed, On-Deck becomes
            At-Bat, In-The-Hole becomes On-Deck.
          </p>
          <button
            onClick={() => {
              if (atBat) {
                setArchivePrompt({ action: "advance" });
              } else {
                handleAdvance(false);
              }
            }}
            disabled={busy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0E3386] text-white rounded-lg text-sm font-medium hover:bg-[#0E3386]/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
            Advance Lineup
          </button>
        </div>

        {/* Per-slot controls */}
        <div className="flex flex-col gap-3">
          {([AT_BAT, ON_DECK, IN_THE_HOLE] as LineupSlot[]).map((slot) => {
            const data = slotData[slot];
            return (
              <div
                key={slot}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {slotLabels[slot]}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {data?.book.title ?? "Empty"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectModal(slot)}
                    disabled={busy}
                    title={`Set ${slotLabels[slot]} book`}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#0E3386] hover:bg-[#0E3386]/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {data && (
                    <button
                      onClick={() => {
                        if (slot === AT_BAT) {
                          setArchivePrompt({ action: "remove", slot });
                        } else {
                          handleRemove(slot, false);
                        }
                      }}
                      disabled={busy}
                      title={`Remove ${slotLabels[slot]} book`}
                      className="p-2 rounded-lg text-gray-400 hover:text-[#CC3433] hover:bg-[#CC3433]/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archive prompt modal */}
      {archivePrompt && (
        <ArchivePromptModal
          action={archivePrompt.action}
          bookTitle={atBatTitle}
          onClose={() => setArchivePrompt(null)}
          onConfirm={(shouldArchive) => {
            if (archivePrompt.action === "advance") {
              handleAdvance(shouldArchive);
            } else if (archivePrompt.slot) {
              handleRemove(archivePrompt.slot, shouldArchive);
            }
          }}
        />
      )}

      {/* Book select modal */}
      {selectModal && (
        <BookSelectModal
          onClose={() => setSelectModal(null)}
          onSelect={(book) => handleBookSelected(selectModal, book)}
          prefBooks={prefBooks}
          suggestions={suggestionsByBookId}
          prefBookIds={prefBookIds}
        />
      )}
    </>
  );
}
