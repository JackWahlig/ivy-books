import type { Book, Suggestion } from "../../types";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";

import SortableBookItem from "./SortableBookItem";
import { useAuth } from "../../context/AuthContext";
import { useUserPrefs } from "../../hooks/usePrefs";

interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
}

function DroppableZone({
  id,
  children,
  isEmpty,
  emptyMessage,
}: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-20 rounded-xl transition-colors p-1
        ${isOver ? "bg-[#0E3386]/5 ring-2 ring-[#0E3386]/20" : ""}`}
    >
      {isEmpty ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${isOver ? "border-[#0E3386]/40" : "border-gray-200"}`}
        >
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface PrefListProps {
  books: Record<string, Book>;
  suggestions: Record<string, Suggestion>;
  onRemove: (bookId: string) => void;
}

export default function PrefList({
  books,
  suggestions,
  onRemove,
}: PrefListProps) {
  const { currentUser } = useAuth();
  const { prefs, loading, savePrefs } = useUserPrefs(currentUser!.uid);

  const [ranked, setRanked] = useState<string[]>([]);
  const [unranked, setUnranked] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keep a ref of the current lists so handleDragEnd always sees
  // the latest state even after cross-list moves in handleDragOver
  const rankedRef = useRef(ranked);
  const unrankedRef = useRef(unranked);
  useEffect(() => {
    rankedRef.current = ranked;
  }, [ranked]);
  useEffect(() => {
    unrankedRef.current = unranked;
  }, [unranked]);

  const isAdmin = currentUser!.isAdmin;

  useEffect(() => {
    if (!prefs) return;
    const activeBookIds = Object.keys(books);
    const validRanked = prefs.rankedList.filter((id) =>
      activeBookIds.includes(id),
    );
    const validUnranked = prefs.unranked.filter((id) =>
      activeBookIds.includes(id),
    );
    const allKnown = new Set([...validRanked, ...validUnranked]);
    const newBooks = activeBookIds.filter((id) => !allKnown.has(id));
    setRanked(validRanked);
    setUnranked([...validUnranked, ...newBooks]);
  }, [prefs, books]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the pointer to move 8px before a drag starts,
      // so that clicks on buttons and links still work normally
      activationConstraint: { distance: 8 },
    }),
  );

  const activeBook = activeId ? books[activeId] : null;
  const activeSuggestion = activeId ? suggestions[activeId] : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    const currentRanked = rankedRef.current;
    const currentUnranked = unrankedRef.current;

    const inRanked = currentRanked.includes(activeIdStr);
    const inUnranked = currentUnranked.includes(activeIdStr);

    // Only handle cross-list moves here — same-list reordering
    // is handled in onDragEnd to avoid jumpiness
    const overInRanked =
      currentRanked.includes(overId) || overId === "ranked-zone";
    const overInUnranked =
      currentUnranked.includes(overId) || overId === "unranked-zone";

    if (inUnranked && overInRanked) {
      const newUnranked = currentUnranked.filter((id) => id !== activeIdStr);
      const insertIndex =
        overId === "ranked-zone"
          ? currentRanked.length
          : currentRanked.indexOf(overId);
      const newRanked = [...currentRanked];
      newRanked.splice(
        insertIndex === -1 ? newRanked.length : insertIndex,
        0,
        activeIdStr,
      );
      setUnranked(newUnranked);
      setRanked(newRanked);
    } else if (inRanked && overInUnranked) {
      const newRanked = currentRanked.filter((id) => id !== activeIdStr);
      const insertIndex =
        overId === "unranked-zone"
          ? currentUnranked.length
          : currentUnranked.indexOf(overId);
      const newUnranked = [...currentUnranked];
      newUnranked.splice(
        insertIndex === -1 ? newUnranked.length : insertIndex,
        0,
        activeIdStr,
      );
      setRanked(newRanked);
      setUnranked(newUnranked);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      // Dropped outside — save whatever state we have from dragOver
      savePrefs(rankedRef.current, unrankedRef.current);
      return;
    }

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    const currentRanked = rankedRef.current;
    const currentUnranked = unrankedRef.current;

    // Same-list reordering within ranked
    if (currentRanked.includes(activeIdStr) && currentRanked.includes(overId)) {
      const oldIndex = currentRanked.indexOf(activeIdStr);
      const newIndex = currentRanked.indexOf(overId);
      if (oldIndex !== newIndex) {
        const newRanked = arrayMove(currentRanked, oldIndex, newIndex);
        setRanked(newRanked);
        savePrefs(newRanked, currentUnranked);
        return;
      }
    }

    // Same-list reordering within unranked
    if (
      currentUnranked.includes(activeIdStr) &&
      currentUnranked.includes(overId)
    ) {
      const oldIndex = currentUnranked.indexOf(activeIdStr);
      const newIndex = currentUnranked.indexOf(overId);
      if (oldIndex !== newIndex) {
        const newUnranked = arrayMove(currentUnranked, oldIndex, newIndex);
        setUnranked(newUnranked);
        savePrefs(currentRanked, newUnranked);
        return;
      }
    }

    // Cross-list move already handled in onDragOver — just save
    savePrefs(currentRanked, currentUnranked);
  }

  function moveToRanked(bookId: string) {
    const newUnranked = unranked.filter((id) => id !== bookId);
    const newRanked = [...ranked, bookId];
    setUnranked(newUnranked);
    setRanked(newRanked);
    savePrefs(newRanked, newUnranked);
  }

  function moveToUnranked(bookId: string) {
    const newRanked = ranked.filter((id) => id !== bookId);
    const newUnranked = [...unranked, bookId];
    setRanked(newRanked);
    setUnranked(newUnranked);
    savePrefs(newRanked, newUnranked);
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 animate-pulse">
        Loading your rankings...
      </div>
    );
  }

  const allEmpty = ranked.length === 0 && unranked.length === 0;

  if (allEmpty) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📚</p>
        <p className="text-gray-400">No books on the pref list yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Visit a book page and click "Suggest for Club" to add one.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-8">
        {/* Ranked section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">My Ranking</h2>
            <span className="text-sm text-gray-400">
              ({ranked.length} books)
            </span>
          </div>
          <SortableContext
            items={ranked}
            strategy={verticalListSortingStrategy}
          >
            <DroppableZone
              id="ranked-zone"
              isEmpty={ranked.length === 0}
              emptyMessage="Drag books here from the Unranked section to start ranking them."
            >
              {ranked.map((bookId, index) => {
                const book = books[bookId];
                const suggestion = suggestions[bookId];
                if (!book || !suggestion) return null;
                return (
                  <div key={bookId} className="relative group">
                    <SortableBookItem
                      book={book}
                      suggestion={suggestion}
                      canRemove={
                        isAdmin || suggestion.suggestedBy === currentUser!.uid
                      }
                      onRemove={onRemove}
                      rank={index + 1}
                    />
                    <button
                      onClick={() => moveToUnranked(bookId)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-300
                        hover:text-gray-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity px-2"
                    >
                      Unrank
                    </button>
                  </div>
                );
              })}
            </DroppableZone>
          </SortableContext>
        </div>

        {/* Unranked section */}
        {unranked.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-500">Unranked</h2>
              <span className="text-sm text-gray-400">
                ({unranked.length} books)
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Drag books into the ranked section above, or click to add them to
              the bottom of your ranking.
            </p>
            <SortableContext
              items={unranked}
              strategy={verticalListSortingStrategy}
            >
              <DroppableZone id="unranked-zone" isEmpty={false} emptyMessage="">
                {unranked.map((bookId) => {
                  const book = books[bookId];
                  const suggestion = suggestions[bookId];
                  if (!book || !suggestion) return null;
                  return (
                    <div
                      key={bookId}
                      onClick={() => moveToRanked(bookId)}
                      className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <SortableBookItem
                        book={book}
                        suggestion={suggestion}
                        canRemove={
                          isAdmin || suggestion.suggestedBy === currentUser!.uid
                        }
                        onRemove={onRemove}
                      />
                    </div>
                  );
                })}
              </DroppableZone>
            </SortableContext>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeBook && activeSuggestion ? (
          <div className="opacity-90 scale-105">
            <SortableBookItem
              book={activeBook}
              suggestion={activeSuggestion}
              canRemove={false}
              onRemove={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
