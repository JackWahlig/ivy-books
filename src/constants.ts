import type { LineupSlot, ReadingStatus } from "./types";

export const METHOD_LABEL: Record<string, string> = {
  physical: "📖 Physical",
  audio: "🎧 Audio",
  ebook: "📱 eBook",
};

export const AT_BAT: LineupSlot = "atBat";
export const ON_DECK: LineupSlot = "onDeck";
export const IN_THE_HOLE: LineupSlot = "inTheHole";

export const UNREAD: ReadingStatus = "unread";
export const READING: ReadingStatus = "reading";
export const FINISHED: ReadingStatus = "finished";
export const ABANDONED: ReadingStatus = "abandoned";

export const ALLOWED_EMAILS = "allowedEmails";
export const ARCHIVE = "archive";
export const BOOKS = "books";
export const LINEUP = "lineup";
export const REVIEWS = "reviews";
export const SUGGESTIONS = "suggestions";
export const USER_BOOK_STATUS = "userBookStatus";
export const USER_PREFS = "userPrefs";
export const USERS = "users";
