import type { Book, GoogleBooksResponse, GoogleBooksVolume } from "../types";

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const MAX_RESULTS = 12;

function normalizeVolume(
  volume: GoogleBooksVolume,
): Omit<Book, "suggestedBy" | "suggestedAt" | "isOnPrefList" | "isArchived"> {
  const info = volume.volumeInfo;

  // Google returns http thumbnail URLs — force https to avoid mixed content warnings
  const rawCover =
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "";
  const coverUrl = rawCover.replace("http://", "https://");

  return {
    id: volume.id,
    googleBooksId: volume.id,
    title: info.title ?? "Unknown Title",
    authors: info.authors ?? ["Unknown Author"],
    coverUrl,
    publishedDate: info.publishedDate ?? "Unknown",
    pageCount: info.pageCount ?? 0,
    description: info.description ?? "No description available.",
  };
}

export async function searchBooks(
  query: string,
  maxResults = MAX_RESULTS,
): Promise<Book[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: "books",
    key: API_KEY,
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data: GoogleBooksResponse = await res.json();
  if (!data.items) return [];

  return data.items.map((volume) => ({
    ...normalizeVolume(volume),
    suggestedBy: null,
    suggestedAt: null,
    isOnPrefList: false,
    isArchived: false,
  }));
}

export async function fetchBookById(
  googleBooksId: string,
): Promise<Book | null> {
  const res = await fetch(`${BASE_URL}/${googleBooksId}?key=${API_KEY}`);
  if (!res.ok) return null;

  const volume: GoogleBooksVolume = await res.json();
  return {
    ...normalizeVolume(volume),
    suggestedBy: null,
    suggestedAt: null,
    isOnPrefList: false,
    isArchived: false,
  };
}
