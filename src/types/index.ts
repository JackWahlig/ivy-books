export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  customDisplayName: string | null;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Book {
  id: string;
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string;
  publishedDate: string;
  pageCount: number;
  description: string;
  suggestedBy: string | null;
  suggestedAt: Date | null;
  isOnPrefList: boolean;
  isArchived: boolean;
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export type ReadingStatus = "unread" | "reading" | "finished" | "abandoned";
export type ReadingMethod = "physical" | "audio" | "ebook";
export type LineupSlot = "atBat" | "onDeck" | "inTheHole";

export interface LineupEntry {
  bookId: string;
  googleBooksId: string;
  addedAt: Date;
  addedBy: string;
}

export interface Lineup {
  atBat: LineupEntry | null;
  onDeck: LineupEntry | null;
  inTheHole: LineupEntry | null;
}

export interface UserBookStatus {
  uid: string;
  bookId: string;
  status: ReadingStatus;
  readingMethod: ReadingMethod | null;
  readingDate: Date | null;
  finishedDate: Date | null;
  abandonedDate: Date | null;
  updatedAt: Date;
}

export interface ReaderInfo {
  uid: string;
  displayName: string;
  status: ReadingStatus;
  readingMethod: ReadingMethod | null;
}

export interface Review {
  uid: string;
  bookId: string;
  stars: number;
  body: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchivedBook {
  bookId: string;
  googleBooksId: string;
  title: string;
  archivedAt: Date;
  archivedBy: string;
  averageRating: number | null;
}

export interface Suggestion {
  bookId: string;
  suggestedBy: string;
  suggestedByName: string;
  suggestedAt: Date;
  isActive: boolean;
}

export interface UserPrefs {
  uid: string;
  rankedList: string[];
  unranked: string[];
  updatedAt: Date;
}

export interface ConsensusEntry {
  book: Book;
  score: number;
  controversy: number;
  voteCount: number;
}

export interface ArchiveEntry {
  id: string;
  bookId: string;
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string;
  archivedAt: Date;
  archivedBy: string;
  averageRating: number | null;
  readers: {
    uid: string;
    displayName: string;
    status: ReadingStatus;
    readingMethod: ReadingMethod | null;
  }[];
}
